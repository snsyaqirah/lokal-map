import { useCallback, useMemo, useState } from "react";
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from "@react-google-maps/api";
import {
  ArrowLeft, ChevronDown, ChevronLeft, ChevronRight,
  Locate, Navigation, Search, X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { BrandWithDetails, DBLocation } from "@/lib/database.types";
import { DAYS_OF_WEEK } from "@/lib/database.types";

const GMAP_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? "";

const PALETTE = [
  "#FF9AA2", "#FFDAC1", "#B5EAD7", "#C7CEEA", "#F8B4D9",
  "#A8DADC", "#FFD166", "#BDE0FE", "#CFBAF0", "#90DBF4",
  "#FFB347", "#B4F8C8", "#FFC8A2", "#D4F0F0", "#CCE2CB",
];

function buildColorMap(brands: BrandWithDetails[]): Map<number, string> {
  const map = new Map<number, string>();
  brands.forEach((b, i) => map.set(b.brand_id, PALETTE[i % PALETTE.length]));
  return map;
}

function makePinMarker(color: string, selected = false) {
  const w = selected ? 30 : 24;
  const h = selected ? 42 : 34;
  const cx = w / 2;
  const r = cx;
  const svg = encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
      <path d="M${cx} 0 C${cx * 0.1} 0 0 ${r * 0.9} 0 ${r} C0 ${r * 1.75} ${cx} ${h} ${cx} ${h} C${cx} ${h} ${w} ${r * 1.75} ${w} ${r} C${w} ${r * 0.9} ${cx * 1.9} 0 ${cx} 0Z"
        fill="${color}" stroke="white" stroke-width="2.5"/>
      <circle cx="${cx}" cy="${r}" r="${r * 0.38}" fill="white" fill-opacity="0.9"/>
    </svg>`
  );
  return {
    url: `data:image/svg+xml;charset=UTF-8,${svg}`,
    scaledSize: new google.maps.Size(w, h),
    anchor: new google.maps.Point(cx, h),
  };
}

interface ActivePopup { brandId: number; locId: number; lat: number; lng: number }

async function fetchAllBrands(): Promise<BrandWithDetails[]> {
  const { data, error } = await supabase
    .from("Brand")
    .select("*, Locations(*), Products(*), Online(*)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as BrandWithDetails[];
}

const CATEGORY_LABEL: Record<string, string> = {
  clothing: "Fashion",
  "local-service": "Local Service",
  "home-bakery": "Home Bakery",
  cafe: "Cafe",
  photography: "Photography",
  others: "Others",
};

// ── Mobile bottom-sheet peek height ─────────────────────────────────────────
const PEEK_PX = 82;

export default function MapPage() {
  const navigate = useNavigate();
  const { isLoaded, loadError } = useJsApiLoader({ googleMapsApiKey: GMAP_KEY });

  const [mapRef, setMapRef] = useState<google.maps.Map | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [popup, setPopup] = useState<ActivePopup | null>(null);
  const [locating, setLocating] = useState(false);

  // Desktop sidebar
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Mobile bottom sheet
  const [sheetExpanded, setSheetExpanded] = useState(false);

  // Expandable brand rows (multi-location)
  const [expandedBrands, setExpandedBrands] = useState<Set<number>>(new Set());

  const [searchQuery, setSearchQuery] = useState("");

  const { data: allBrands = [] } = useQuery({
    queryKey: ["public-brands"],
    queryFn: fetchAllBrands,
  });

  const physicalBrands = allBrands.filter(
    (b) => (b.Locations ?? []).some((l) => l.latitude && l.longitude)
  );
  const colorMap = buildColorMap(physicalBrands);

  const filteredBrands = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return physicalBrands;
    return physicalBrands.filter(
      (b) =>
        (b.brand_name ?? "").toLowerCase().includes(q) ||
        (CATEGORY_LABEL[b.brand_category ?? ""] ?? "").toLowerCase().includes(q) ||
        b.Locations.some(
          (l) =>
            (l.city ?? "").toLowerCase().includes(q) ||
            (l.state ?? "").toLowerCase().includes(q)
        )
    );
  }, [physicalBrands, searchQuery]);

  // ── Actions ────────────────────────────────────────────────────────────────

  const panToLocAndSelect = (brand: BrandWithDetails, loc: DBLocation) => {
    if (!loc.latitude || !loc.longitude || !mapRef) return;
    const lat = parseFloat(loc.latitude);
    const lng = parseFloat(loc.longitude);
    mapRef.panTo({ lat, lng });
    mapRef.setZoom(16);
    setSelectedId(brand.brand_id);
    setPopup({ brandId: brand.brand_id, locId: loc.location_id, lat, lng });
    setSheetExpanded(false); // collapse mobile sheet after selection
  };

  const toggleExpand = (brandId: number) => {
    setExpandedBrands((prev) => {
      const next = new Set(prev);
      if (next.has(brandId)) next.delete(brandId);
      else next.add(brandId);
      return next;
    });
  };

  const onLoad = useCallback(
    (map: google.maps.Map) => {
      setMapRef(map);
      const allLocs = physicalBrands.flatMap((b) =>
        (b.Locations ?? []).filter((l) => l.latitude && l.longitude)
      );
      if (allLocs.length > 1) {
        const bounds = new google.maps.LatLngBounds();
        allLocs.forEach((l) =>
          bounds.extend({ lat: parseFloat(l.latitude!), lng: parseFloat(l.longitude!) })
        );
        map.fitBounds(bounds, 80);
      } else if (allLocs.length === 1) {
        map.setCenter({ lat: parseFloat(allLocs[0].latitude!), lng: parseFloat(allLocs[0].longitude!) });
        map.setZoom(14);
      } else {
        map.setCenter({ lat: 3.9, lng: 108.0 });
        map.setZoom(6);
      }
    },
    [physicalBrands]
  );

  const handleLocate = () => {
    if (!mapRef || !navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        mapRef.panTo({ lat: coords.latitude, lng: coords.longitude });
        mapRef.setZoom(15);
        setLocating(false);
      },
      () => setLocating(false)
    );
  };

  // ── Shared brand list renderer ─────────────────────────────────────────────

  const renderBrandList = () => {
    if (filteredBrands.length === 0) {
      return (
        <div className="py-12 text-center text-sm text-muted-foreground px-4">
          Tiada brand dijumpai
        </div>
      );
    }

    return filteredBrands.map((brand) => {
      const locs = brand.Locations.filter((l) => l.latitude && l.longitude);
      if (locs.length === 0) return null;

      const isExpanded = expandedBrands.has(brand.brand_id);
      const isActive = selectedId === brand.brand_id;
      const color = colorMap.get(brand.brand_id) ?? "#888";
      const multiLoc = locs.length > 1;

      const brandHeader = (
        <div className="flex items-start gap-2.5">
          <span
            className="mt-1 w-2.5 h-2.5 rounded-full shrink-0 ring-2 ring-background shadow-sm"
            style={{ background: color }}
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-1">
              <p className="text-sm font-semibold truncate">{brand.brand_name}</p>
              {brand.price_range && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 font-semibold shrink-0">
                  {brand.price_range}
                </span>
              )}
            </div>
            {brand.brand_category && (
              <p className="text-[11px] text-muted-foreground">
                {CATEGORY_LABEL[brand.brand_category] ?? brand.brand_category}
              </p>
            )}
          </div>
        </div>
      );

      return (
        <div
          key={brand.brand_id}
          className={`border-b border-border/50 border-l-2 transition-colors ${
            isActive ? "border-l-primary" : "border-l-transparent"
          }`}
        >
          {multiLoc ? (
            <>
              {/* ── Expandable header ── */}
              <button
                onClick={() => toggleExpand(brand.brand_id)}
                className={`w-full text-left px-4 py-3 transition-colors ${
                  isActive ? "bg-primary/5" : "hover:bg-muted/40"
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className="flex-1 min-w-0">{brandHeader}</div>
                  <div className="shrink-0 flex items-center gap-1.5">
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-medium whitespace-nowrap">
                      {locs.length} lokasi
                    </span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 ${
                        isExpanded ? "rotate-180" : ""
                      }`}
                    />
                  </div>
                </div>
              </button>

              {/* ── Sub-location list ── */}
              {isExpanded && (
                <div className="border-t border-border/30 bg-muted/20">
                  {locs.map((loc, i) => {
                    const parts = [loc.city, loc.state].filter(Boolean);
                    const locLabel = parts.length > 0 ? parts.join(", ") : null;
                    const isLocActive =
                      popup?.locId === loc.location_id && selectedId === brand.brand_id;

                    return (
                      <button
                        key={loc.location_id}
                        onClick={() => panToLocAndSelect(brand, loc)}
                        className={`w-full text-left px-5 py-2.5 flex items-center gap-2.5 border-b border-border/20 last:border-b-0 transition-colors ${
                          isLocActive
                            ? "bg-primary/10 text-primary"
                            : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                        }`}
                      >
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ background: color, opacity: isLocActive ? 1 : 0.5 }}
                        />
                        <span className="text-xs flex-1 min-w-0 truncate">
                          <span
                            className={`font-semibold ${
                              isLocActive ? "text-primary" : "text-foreground/70"
                            }`}
                          >
                            Lokasi {i + 1}
                          </span>
                          {locLabel && <span className="ml-1 text-muted-foreground">— {locLabel}</span>}
                        </span>
                        <Navigation className="w-3 h-3 shrink-0 opacity-40" />
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            /* ── Single location — direct click ── */
            <button
              onClick={() => panToLocAndSelect(brand, locs[0])}
              className={`w-full text-left px-4 py-3 transition-colors ${
                isActive ? "bg-primary/5" : "hover:bg-muted/40"
              }`}
            >
              {brandHeader}
              {(() => {
                const locLabel = [locs[0].city, locs[0].state].filter(Boolean).join(", ");
                return locLabel ? (
                  <p className="text-[11px] text-muted-foreground mt-1 pl-5 truncate">
                    📍 {locLabel}
                  </p>
                ) : null;
              })()}
            </button>
          )}
        </div>
      );
    });
  };

  // ── Shared search bar ──────────────────────────────────────────────────────

  const renderSearch = (opts?: { onFocus?: () => void }) => (
    <>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={opts?.onFocus}
          placeholder="Cari brand, kategori, kawasan..."
          className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      <p className="text-[11px] text-muted-foreground mt-1.5">
        {filteredBrands.length} brand ditemui
      </p>
    </>
  );

  // ── InfoWindow content ─────────────────────────────────────────────────────

  const renderInfoWindow = () => {
    if (!popup) return null;
    const brand = physicalBrands.find((b) => b.brand_id === popup.brandId);
    const loc = brand?.Locations.find((l) => l.location_id === popup.locId);
    if (!brand || !loc) return null;

    const addressParts = [loc.lot_number, loc.street_address, loc.city, loc.state].filter(Boolean);
    const googleMapsUrl =
      loc.googlemap_link ||
      `https://www.google.com/maps/search/?api=1&query=${loc.latitude},${loc.longitude}`;
    const today = new Date()
      .toLocaleDateString("en-US", { weekday: "long" })
      .toLowerCase() as (typeof DAYS_OF_WEEK)[number];
    const todayHours = loc.operation_hours?.[today];
    const color = colorMap.get(brand.brand_id) ?? "#888";

    return (
      <InfoWindow
        position={{ lat: popup.lat, lng: popup.lng }}
        onCloseClick={() => { setPopup(null); setSelectedId(null); }}
        options={{ pixelOffset: new google.maps.Size(0, -38) }}
      >
        <div style={{ maxWidth: 240, fontFamily: "system-ui, -apple-system, sans-serif", padding: "2px 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: color, flexShrink: 0, border: "2px solid white", boxShadow: "0 0 0 1px rgba(0,0,0,0.12)" }} />
            <p style={{ fontWeight: 700, fontSize: 14, margin: 0, color: "#111827", lineHeight: 1.3 }}>
              {brand.brand_name}
            </p>
          </div>
          {brand.brand_category && (
            <p style={{ fontSize: 11, color: "#9ca3af", margin: "0 0 8px 18px" }}>
              {CATEGORY_LABEL[brand.brand_category] ?? brand.brand_category}
              {brand.price_range ? ` · ${brand.price_range}` : ""}
            </p>
          )}
          {addressParts.length > 0 && (
            <p style={{ fontSize: 12, color: "#374151", margin: "0 0 5px", lineHeight: 1.5 }}>
              📍 {addressParts.join(", ")}
            </p>
          )}
          {loc.phone_number && (
            <p style={{ fontSize: 12, color: "#374151", margin: "0 0 5px" }}>📞 {loc.phone_number}</p>
          )}
          {todayHours && (
            <p style={{ fontSize: 11, color: "#059669", margin: "0 0 5px" }}>🕐 Hari ini: {todayHours}</p>
          )}
          {loc.payment_methods && (
            <p style={{ fontSize: 11, color: "#6b7280", margin: "0 0 5px" }}>💳 {loc.payment_methods}</p>
          )}
          {loc.is_muslim_friendly && (
            <p style={{ fontSize: 11, color: "#7c3aed", margin: "0 0 8px" }}>✓ Muslim-Friendly</p>
          )}
          <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: 11, color: "white", background: "#4285f4", padding: "5px 10px", borderRadius: 6, textDecoration: "none", fontWeight: 600 }}
            >
              Google Maps ↗
            </a>
            <button
              onClick={() => navigate(`/brand/${brand.brand_id}`)}
              style={{ fontSize: 11, color: "#111827", background: "#f3f4f6", padding: "5px 10px", borderRadius: 6, border: "none", cursor: "pointer", fontWeight: 600 }}
            >
              Lihat profil →
            </button>
          </div>
        </div>
      </InfoWindow>
    );
  };

  if (loadError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground text-sm">Gagal memuatkan peta.</p>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">

      {/* ── Header ───────────────────────────────────────────── */}
      <header className="border-b border-border bg-card z-20 shrink-0">
        <div className="px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Kembali</span>
          </button>
          <div className="h-4 w-px bg-border" />
          <p className="font-display font-semibold text-sm">Peta Lokal Brand</p>
          <span className="text-xs text-muted-foreground ml-auto">
            {physicalBrands.length} brand
          </span>
        </div>
      </header>

      {/* ── Body ─────────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden min-h-0 relative">

        {/* ════════════════════════════════════════
            DESKTOP SIDEBAR (md+)
        ════════════════════════════════════════ */}
        <div
          className={`
            hidden md:flex flex-col bg-card border-r border-border shrink-0 overflow-hidden
            transition-[width] duration-300 ease-in-out
            ${sidebarOpen ? "w-80" : "w-0"}
          `}
        >
          {/* Search */}
          <div className="p-3 border-b border-border shrink-0">
            {renderSearch()}
          </div>

          {/* Brand list */}
          <div className="overflow-y-auto flex-1">
            {renderBrandList()}
          </div>
        </div>

        {/* ════════════════════════════════════════
            MAP (always full height)
        ════════════════════════════════════════ */}
        <div className="flex-1 relative min-h-0">

          {/* Desktop sidebar toggle */}
          <button
            onClick={() => setSidebarOpen((o) => !o)}
            title={sidebarOpen ? "Tutup panel" : "Buka panel"}
            className="hidden md:flex absolute top-3 left-3 z-20 w-8 h-8 rounded-lg bg-white shadow-md border border-gray-200 items-center justify-center hover:bg-gray-50 transition-colors"
          >
            {sidebarOpen
              ? <ChevronLeft className="w-4 h-4 text-gray-600" />
              : <ChevronRight className="w-4 h-4 text-gray-600" />}
          </button>

          {!isLoaded ? (
            <div className="flex items-center justify-center h-full bg-muted/30 text-sm text-muted-foreground">
              Memuatkan peta...
            </div>
          ) : (
            <GoogleMap
              mapContainerStyle={{ width: "100%", height: "100%" }}
              center={{ lat: 3.9, lng: 108.0 }}
              zoom={6}
              onLoad={onLoad}
              options={{
                zoomControl: true,
                mapTypeControl: false,
                streetViewControl: false,
                fullscreenControl: false,
                gestureHandling: "greedy",
                clickableIcons: false,
              }}
            >
              {physicalBrands.map((brand) => {
                const color = colorMap.get(brand.brand_id)!;
                const locs = (brand.Locations ?? []).filter((l) => l.latitude && l.longitude);
                return locs.map((loc) => (
                  <Marker
                    key={`${brand.brand_id}-${loc.location_id}`}
                    position={{ lat: parseFloat(loc.latitude!), lng: parseFloat(loc.longitude!) }}
                    icon={makePinMarker(
                      color,
                      selectedId === brand.brand_id && popup?.locId === loc.location_id
                    )}
                    zIndex={selectedId === brand.brand_id ? 10 : 1}
                    onClick={() => {
                      setSelectedId(brand.brand_id);
                      setPopup({
                        brandId: brand.brand_id,
                        locId: loc.location_id,
                        lat: parseFloat(loc.latitude!),
                        lng: parseFloat(loc.longitude!),
                      });
                      // Auto-expand multi-location brands in sidebar when pin clicked
                      const hasMulti =
                        brand.Locations.filter((l) => l.latitude && l.longitude).length > 1;
                      if (hasMulti) {
                        setExpandedBrands((prev) => new Set(prev).add(brand.brand_id));
                      }
                    }}
                  />
                ));
              })}

              {renderInfoWindow()}
            </GoogleMap>
          )}

          {/* Locate me — pushed up on mobile to clear bottom sheet peek */}
          <button
            onClick={handleLocate}
            disabled={locating}
            title="Lokasi saya"
            className="absolute right-4 z-10 w-11 h-11 rounded-xl bg-white shadow-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 transition-colors"
            style={{ bottom: `calc(${PEEK_PX}px + 1rem)` }}
          >
            <Locate className={`w-5 h-5 ${locating ? "animate-pulse text-gray-400" : "text-gray-600"}`} />
          </button>
        </div>
      </div>

      {/* ════════════════════════════════════════
          MOBILE BOTTOM SHEET (< md)
          Always peek PEEK_PX from bottom.
          Expanded → full 65vh.
      ════════════════════════════════════════ */}
      <div
        className="md:hidden fixed bottom-0 left-0 right-0 z-30 flex flex-col bg-card border-t border-border rounded-t-2xl shadow-2xl transition-transform duration-300 ease-out"
        style={{
          height: "65vh",
          transform: sheetExpanded ? "translateY(0)" : `translateY(calc(100% - ${PEEK_PX}px))`,
        }}
      >
        {/* ── Sheet handle + search (always visible in peek) ── */}
        <div className="shrink-0 px-4 pt-3 pb-2">
          {/* Drag handle */}
          <button
            onClick={() => setSheetExpanded((e) => !e)}
            className="w-full flex justify-center mb-3"
            aria-label={sheetExpanded ? "Tutup senarai" : "Buka senarai"}
          >
            <div className="w-10 h-1 rounded-full bg-muted-foreground/25" />
          </button>

          {/* Search */}
          {renderSearch({ onFocus: () => setSheetExpanded(true) })}

          {/* Close pill (only when expanded) */}
          {sheetExpanded && (
            <button
              onClick={() => setSheetExpanded(false)}
              className="mt-2 flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronDown className="w-3 h-3" />
              Tutup
            </button>
          )}
        </div>

        {/* ── Scrollable brand list ── */}
        <div className="overflow-y-auto flex-1 min-h-0 border-t border-border/40">
          {renderBrandList()}
        </div>
      </div>
    </div>
  );
}
