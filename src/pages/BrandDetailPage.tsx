import { useParams, useNavigate } from "react-router-dom";
import {
  MapPin, Clock, Phone, Car, CreditCard, ExternalLink,
  Navigation, ShieldCheck, Calendar, ArrowLeft, Store,
  MessageSquarePlus, Lock,
} from "lucide-react";
import { brands } from "@/data/brands";
import type { Store as StoreType } from "@/data/brands";

// ── helpers ──────────────────────────────────────────────────────────────────

const priceColors: Record<string, string> = {
  "$": "text-green-600",
  "$$": "text-accent",
  "$$$": "text-orange-600",
};

const InfoRow = ({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) => (
  <div className="flex gap-3">
    <div className="w-8 h-8 rounded-lg bg-tag flex items-center justify-center text-tag-foreground shrink-0">
      {icon}
    </div>
    <div className="flex-1">
      <p className="text-xs text-muted-foreground font-medium mb-0.5">{label}</p>
      {children}
    </div>
  </div>
);

// ── StoreCard ─────────────────────────────────────────────────────────────────

const StoreCard = ({ store }: { store: StoreType }) => (
  <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
    <div className="flex items-start justify-between gap-2">
      <div>
        <h4 className="font-display font-semibold text-base">{store.label}</h4>
        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
          <MapPin className="w-3 h-3" /> {store.location}
        </p>
      </div>
      <a
        href={store.googleMapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 shrink-0 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-opacity"
      >
        <Navigation className="w-3 h-3" /> Navigate
      </a>
    </div>

    <div className="text-sm text-muted-foreground">{store.address}</div>

    <div className="flex flex-wrap gap-3 text-sm">
      <span className="flex items-center gap-1 text-muted-foreground">
        <Clock className="w-3.5 h-3.5" /> {store.operatingHours}
      </span>
      {store.contactWhatsApp && (
        <a
          href={`https://wa.me/${store.contactWhatsApp}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-green-600 text-white text-xs font-medium hover:opacity-90 transition-opacity"
        >
          <Phone className="w-3 h-3" /> WhatsApp
        </a>
      )}
    </div>

    {store.parkingInfo && (
      <p className="text-xs text-muted-foreground flex items-start gap-1.5">
        <Car className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        {store.parkingInfo}
      </p>
    )}
  </div>
);

// ── Main page ─────────────────────────────────────────────────────────────────

const BrandDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const brand = brands.find((b) => b.id === id);

  if (!brand) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-xl font-display text-muted-foreground">Brand tidak dijumpai 😢</p>
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <ArrowLeft className="w-4 h-4" /> Balik ke Home
        </button>
      </div>
    );
  }

  const hasStores = brand.stores && brand.stores.length > 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-xl border border-border flex items-center justify-center hover:bg-muted transition-colors"
            aria-label="Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="font-display font-bold text-sm truncate">{brand.name}</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">

        {/* ── Brand header ──────────────────────────────── */}
        <section>
          <div className="flex items-start justify-between gap-4 mb-2">
            <div>
              <h1 className="font-display text-3xl md:text-4xl font-bold">{brand.name}</h1>
              {!hasStores && (
                <p className="flex items-center gap-1.5 text-muted-foreground text-sm mt-1">
                  <MapPin className="w-3.5 h-3.5" /> {brand.location}
                </p>
              )}
            </div>
            <span className={`font-display font-bold text-2xl shrink-0 ${priceColors[brand.priceRange] || ""}`}>
              {brand.priceRange}
            </span>
          </div>

          <p className="text-muted-foreground mb-4 leading-relaxed">{brand.description}</p>

          {/* Style + gender tags */}
          <div className="flex flex-wrap gap-1.5">
            {brand.styleTags.map((tag) => (
              <span key={tag} className="text-xs px-2.5 py-1 rounded-full bg-tag text-tag-foreground font-medium">
                {tag}
              </span>
            ))}
            {brand.genderCategory.map((g) => (
              <span key={g} className="text-xs px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground font-medium">
                {g}
              </span>
            ))}
            {brand.muslimFriendly && (
              <span className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-medium">
                ☪ Muslim-Friendly
              </span>
            )}
          </div>
        </section>

        {/* ── Store locations ────────────────────────────── */}
        {hasStores ? (
          <section>
            <h2 className="font-display text-xl font-bold mb-4 flex items-center gap-2">
              <Store className="w-5 h-5" /> Lokasi Store ({brand.stores!.length})
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {brand.stores!.map((store) => (
                <StoreCard key={store.id} store={store} />
              ))}
            </div>
          </section>
        ) : (
          /* Single store info */
          <section className="space-y-4 rounded-2xl border border-border bg-card p-6">
            <h2 className="font-display text-lg font-bold">Info Store</h2>
            <InfoRow icon={<MapPin className="w-4 h-4" />} label="Alamat">
              <p className="text-sm">{brand.address}</p>
              <a
                href={brand.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 mt-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-opacity"
              >
                <Navigation className="w-3 h-3" /> Navigate
              </a>
            </InfoRow>

            <InfoRow icon={<Clock className="w-4 h-4" />} label="Waktu Operasi">
              <p className="text-sm">{brand.operatingHours}</p>
            </InfoRow>

            <InfoRow icon={<Phone className="w-4 h-4" />} label="WhatsApp">
              <a
                href={`https://wa.me/${brand.contactWhatsApp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-medium hover:opacity-90 transition-opacity"
              >
                <Phone className="w-3 h-3" /> Chat di WhatsApp
              </a>
            </InfoRow>

            <InfoRow icon={<Car className="w-4 h-4" />} label="Parking">
              <p className="text-sm">{brand.parkingInfo}</p>
            </InfoRow>
          </section>
        )}

        {/* ── Extra brand info ───────────────────────────── */}
        <section className="space-y-4 rounded-2xl border border-border bg-card p-6">
          <h2 className="font-display text-lg font-bold">Maklumat Lain</h2>

          <InfoRow icon={<CreditCard className="w-4 h-4" />} label="Payment">
            <div className="flex flex-wrap gap-1.5">
              {brand.paymentMethods.map((m) => (
                <span key={m} className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground font-medium">
                  {m}
                </span>
              ))}
            </div>
          </InfoRow>

          {brand.muslimFriendly && brand.muslimFriendlyInfo && (
            <InfoRow icon={<ShieldCheck className="w-4 h-4" />} label="Muslim-Friendly">
              <p className="text-sm text-primary font-medium">☪ {brand.muslimFriendlyInfo}</p>
            </InfoRow>
          )}

          {brand.onlineStoreUrl && (
            <InfoRow icon={<ExternalLink className="w-4 h-4" />} label="Online Store">
              <a
                href={brand.onlineStoreUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-accent hover:underline font-medium"
              >
                {brand.onlineStorePlatform || "Visit Store"} <ExternalLink className="w-3 h-3" />
              </a>
            </InfoRow>
          )}

          <InfoRow icon={<Calendar className="w-4 h-4" />} label="Last Verified">
            <p className="text-xs text-muted-foreground">Last updated: {brand.lastVerified}</p>
          </InfoRow>
        </section>

        {/* ── Reviews ────────────────────────────────────── */}
        <section>
          <h2 className="font-display text-xl font-bold mb-4 flex items-center gap-2">
            <MessageSquarePlus className="w-5 h-5" /> Reviews
          </h2>
          <div className="rounded-2xl border-2 border-dashed border-border bg-muted/30 p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto">
              <Lock className="w-5 h-5 text-muted-foreground" />
            </div>
            <p className="font-display font-semibold text-foreground">Reviews Coming Soon</p>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Nak elak spam dan review palsu — semua reviews akan diverifikasi sebelum publish.
              Login untuk dapat notifikasi bila feature ni ready!
            </p>
            <div className="flex items-center justify-center gap-2 pt-1">
              <button
                disabled
                className="px-4 py-2 rounded-xl bg-muted text-muted-foreground text-sm font-medium cursor-not-allowed opacity-60"
              >
                Tulis Review
              </button>
            </div>
          </div>
        </section>

      </div>

      {/* Footer */}
      <footer className="bg-primary text-primary-foreground py-6 mt-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-primary-foreground/70 text-sm">© 2026 Lokal-Map</p>
        </div>
      </footer>
    </div>
  );
};

export default BrandDetailPage;
