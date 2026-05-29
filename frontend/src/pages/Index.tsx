import { useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Search, MapPin, SlidersHorizontal, X, Lock, Map, LayoutGrid } from "lucide-react";
import { CATEGORIES } from "@/data/brands";
import type { Category } from "@/data/brands";
import { supabase } from "@/lib/supabase";
import { MALAYSIAN_STATES } from "@/lib/database.types";
import type { BrandWithDetails } from "@/lib/database.types";
import { Helmet } from "react-helmet-async";
import BrandCard from "@/components/BrandCard";

async function fetchAllBrands(): Promise<BrandWithDetails[]> {
  const { data, error } = await supabase
    .from("Brand")
    .select("*, Locations(*), Products(*), Online(*)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as BrandWithDetails[];
}

const Index = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const search = searchParams.get("search") || "";
  const selectedCategory = (searchParams.get("category") as Category) || null;
  const selectedState = searchParams.get("state") || "";
  const muslimFriendlyOnly = searchParams.get("muslim") === "true";
  const showFilters = searchParams.get("filters") === "true";
  const selectedGender = searchParams.get("gender") || "";
  const storeType = searchParams.get("storeType") || "";

  const updateParams = (updates: Record<string, string | null>) => {
    setSearchParams(
      (prev) => {
        const p = new URLSearchParams(prev);
        Object.entries(updates).forEach(([k, v]) => {
          if (v === null || v === "") p.delete(k);
          else p.set(k, v);
        });
        return p;
      },
      { replace: true }
    );
  };

  const { data: allBrands = [], isLoading } = useQuery({
    queryKey: ["public-brands"],
    queryFn: fetchAllBrands,
  });

  const resetFilters = () => {
    updateParams({ state: null, muslim: null, gender: null, storeType: null });
  };

  const handleCategorySelect = (cat: Category) => {
    const next = selectedCategory === cat ? null : cat;
    updateParams({ category: next, state: null, muslim: null, gender: null, storeType: null, filters: null });
  };

  const filtered = useMemo(() => {
    return allBrands.filter((b) => {
      const matchCategory = !selectedCategory || b.brand_category === selectedCategory;
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        (b.brand_name ?? "").toLowerCase().includes(q) ||
        (b.brand_description ?? "").toLowerCase().includes(q) ||
        b.Products.some((p) => (p.product_type ?? "").toLowerCase().includes(q));
      const matchState =
        !selectedState ||
        storeType === "online" ||
        b.Locations.some((l) => l.state === selectedState);
      const matchMuslim = !muslimFriendlyOnly || b.Locations.some((l) => l.is_muslim_friendly);
      const matchGender =
        !selectedGender ||
        b.Products.some((p) => p.product_gender === selectedGender || p.product_gender === "unisex");
      const matchStoreType =
        !storeType ||
        (storeType === "online" ? b.Online && b.Online.length > 0 : b.Locations && b.Locations.length > 0);
      return matchCategory && matchSearch && matchState && matchMuslim && matchGender && matchStoreType;
    });
  }, [selectedCategory, allBrands, search, selectedState, muslimFriendlyOnly, selectedGender, storeType]);

  const hasActiveFilters = !!selectedState || muslimFriendlyOnly || !!selectedGender || !!storeType;
  const activeFilterCount =
    (selectedState ? 1 : 0) + (muslimFriendlyOnly ? 1 : 0) + (selectedGender ? 1 : 0) + (storeType ? 1 : 0);

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Lokal-Map — Direktori Brand Lokal Malaysia</title>
        <meta name="description" content="Jumpa brand lokal Malaysia — pakaian, bakeri, kafe, perkhidmatan tempatan & lebih. Terokai kedai fizikal dan online dalam satu direktori." />
        <meta name="keywords" content="brand lokal malaysia, lokal map, kedai lokal malaysia, fashion lokal, home bakery malaysia, kafe lokal, lokal-map" />
        <meta property="og:title" content="Lokal-Map — Direktori Brand Lokal Malaysia" />
        <meta property="og:description" content="Direktori brand lokal Malaysia. Cari pakaian, bakeri, kafe & lebih. Support local!" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://lokal-map.vercel.app" />
        <link rel="canonical" href="https://lokal-map.vercel.app" />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "Lokal-Map",
          "url": "https://lokal-map.vercel.app",
          "description": "Direktori brand lokal Malaysia",
          "potentialAction": {
            "@type": "SearchAction",
            "target": "https://lokal-map.vercel.app?search={search_term_string}",
            "query-input": "required name=search_term_string",
          },
        })}</script>
      </Helmet>

      {/* ── Navbar ────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-4">
          {/* Logo */}
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 font-display font-bold text-lg text-foreground hover:text-primary transition-colors"
          >
            <Map className="w-5 h-5 text-primary" />
            Lokal-Map
          </button>

          <div className="flex-1" />

          {/* Nav links */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => navigate("/")}
              className="px-3 py-1.5 rounded-lg text-sm font-medium bg-primary/10 text-primary"
            >
              Home
            </button>
            <button
              onClick={() => navigate("/map")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              <Map className="w-3.5 h-3.5" />
              Map
            </button>
          </div>
        </div>
      </nav>

      {/* ── Hero: tagline + poster placeholder ────────────────── */}
      <section className="max-w-6xl mx-auto px-4 pt-10 pb-8 md:pt-14 md:pb-10">
        <div className="grid md:grid-cols-2 gap-8 md:gap-16 items-center">
          {/* Left: tagline */}
          <div className="space-y-4">
            <p className="text-xs font-semibold text-primary uppercase tracking-widest">
              Direktori Brand Lokal
            </p>
            <h1 className="font-display text-3xl sm:text-4xl md:text-[2.75rem] font-bold leading-tight">
              Terokai brand<br />lokal Malaysia
            </h1>
            <p className="text-muted-foreground text-base leading-relaxed max-w-sm">
              Pakaian, bakeri, kafe &amp; lebih — semua brand lokal dalam satu direktori.
            </p>
          </div>

          {/* Right: monthly issue poster placeholder */}
          <div className="flex justify-center md:justify-end">
            <div className="w-full max-w-[260px] sm:max-w-[300px] aspect-square rounded-2xl border-2 border-dashed border-border bg-muted/20 flex flex-col items-center justify-center gap-3 text-center p-6 select-none">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-3xl">
                📌
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Brand of the Month</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Monthly feature — coming soon
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Main content ──────────────────────────────────────── */}
      <main className="max-w-6xl mx-auto px-4 pb-12">

        {/* Search */}
        <section className="mb-6">
          <div className="relative max-w-2xl">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="Cari brand atau produk..."
              value={search}
              onChange={(e) => updateParams({ search: e.target.value })}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm shadow-sm"
            />
          </div>
        </section>

        {/* Category picker */}
        <section className="mb-6">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Kategori</p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => updateParams({ category: null, state: null, muslim: null, gender: null, storeType: null, filters: null })}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                !selectedCategory
                  ? "border-primary bg-primary text-primary-foreground shadow-sm"
                  : "border-border bg-card hover:border-primary/50 hover:bg-muted/40"
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              Semua
            </button>
            {CATEGORIES.map(({ id, label, emoji, available }) =>
              available ? (
                <button
                  key={id}
                  onClick={() => handleCategorySelect(id)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                    selectedCategory === id
                      ? "border-primary bg-primary text-primary-foreground shadow-sm"
                      : "border-border bg-card hover:border-primary/50 hover:bg-muted/40"
                  }`}
                >
                  <span className="text-base">{emoji}</span>
                  {label}
                </button>
              ) : (
                <div
                  key={id}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-border/40 bg-muted/20 text-muted-foreground/50 text-sm font-medium cursor-not-allowed select-none"
                >
                  <span className="text-base opacity-30">{emoji}</span>
                  {label}
                  <span className="ml-1 flex items-center gap-0.5 text-[11px]">
                    <Lock className="w-2.5 h-2.5" /> Soon
                  </span>
                </div>
              )
            )}
          </div>
        </section>

        {/* Results header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">
              {isLoading ? "Loading..." : `${filtered.length} brand`}
            </span>
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-3 h-3" /> Clear
              </button>
            )}
          </div>
          <button
            onClick={() => updateParams({ filters: showFilters ? null : "true" })}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${
              showFilters || hasActiveFilters
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card border-border hover:border-primary/50"
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Filter
            {hasActiveFilters && (
              <span className="w-4 h-4 rounded-full bg-accent text-accent-foreground text-[10px] flex items-center justify-center font-bold">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Filter panel */}
        {showFilters && (
          <div className="mb-6 p-4 rounded-xl border border-border bg-card/80 backdrop-blur-sm space-y-4">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Negeri</p>
              <div className="flex flex-wrap gap-1.5">
                {MALAYSIAN_STATES.map((s) => (
                  <button
                    key={s}
                    onClick={() => updateParams({ state: selectedState === s ? null : s })}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                      selectedState === s
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    <MapPin className="w-2.5 h-2.5" />
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Platform</p>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { value: "fizikal", label: "Physical" },
                    { value: "online", label: "Online" },
                  ].map(({ value, label }) => (
                    <button
                      key={value}
                      onClick={() => updateParams({ storeType: storeType === value ? null : value })}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                        storeType === value
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Jantina</p>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { value: "lelaki", label: "Lelaki" },
                    { value: "perempuan", label: "Perempuan" },
                    { value: "unisex", label: "Unisex" },
                  ].map(({ value, label }) => (
                    <button
                      key={value}
                      onClick={() => updateParams({ gender: selectedGender === value ? null : value })}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                        selectedGender === value
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Lain-lain</p>
                <button
                  onClick={() => updateParams({ muslim: muslimFriendlyOnly ? null : "true" })}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                    muslimFriendlyOnly
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  Muslim-Friendly
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Brand grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-48 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((brand, i) => (
              <BrandCard
                key={brand.brand_id}
                brand={brand}
                index={i}
                onClick={() => navigate(`/brand/${brand.brand_id}`)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-base font-medium">Tiada brand dijumpai</p>
            <p className="text-sm mt-1">Cuba tukar filter atau keyword lain</p>
          </div>
        )}
      </main>

      <footer className="border-t border-border py-5">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-xs text-muted-foreground">© 2026 Lokal-Map</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
