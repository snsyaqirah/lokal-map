import {
  MapPin, Clock, Phone, Car, CreditCard, ExternalLink, X, Navigation, ShieldCheck, Calendar
} from "lucide-react";
import type { Brand } from "@/data/brands";

interface BrandDetailProps {
  brand: Brand;
  onClose: () => void;
}

const BrandDetail = ({ brand, onClose }: BrandDetailProps) => {
  const whatsAppUrl = `https://wa.me/${brand.contactWhatsApp}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-foreground/50 backdrop-blur-sm animate-fade-in" />

      {/* Modal */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative z-10 bg-background rounded-t-3xl sm:rounded-2xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto animate-fade-in-up shadow-2xl"
      >
        {/* Header gradient */}
        <div className="h-3 bg-gradient-to-r from-primary to-accent rounded-t-3xl sm:rounded-t-2xl" />

        <div className="p-6">
          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-6 right-5 w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Brand name */}
          <h2 className="font-display text-2xl font-bold pr-10 mb-1">{brand.name}</h2>
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-4">
            <MapPin className="w-3.5 h-3.5" />
            {brand.location}
            <span className="font-display font-bold text-accent">{brand.priceRange}</span>
          </div>

          <p className="text-sm text-muted-foreground mb-6">{brand.description}</p>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 mb-6">
            {brand.styleTags.map((tag) => (
              <span key={tag} className="text-xs px-2.5 py-1 rounded-full bg-tag text-tag-foreground font-medium">
                #{tag}
              </span>
            ))}
            {brand.genderCategory.map((g) => (
              <span key={g} className="text-xs px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground font-medium">
                {g}
              </span>
            ))}
          </div>

          {/* Info grid */}
          <div className="space-y-4">
            {/* Address + Navigate */}
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
                href={whatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-600 text-primary-foreground text-xs font-medium hover:opacity-90 transition-opacity"
              >
                <Phone className="w-3 h-3" /> Chat di WhatsApp
              </a>
            </InfoRow>

            <InfoRow icon={<Car className="w-4 h-4" />} label="Parking">
              <p className="text-sm">{brand.parkingInfo}</p>
            </InfoRow>

            <InfoRow icon={<CreditCard className="w-4 h-4" />} label="Payment">
              <div className="flex flex-wrap gap-1.5">
                {brand.paymentMethods.map((m) => (
                  <span key={m} className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground font-medium">
                    {m}
                  </span>
                ))}
              </div>
            </InfoRow>

            {brand.muslimFriendly && (
              <InfoRow icon={<ShieldCheck className="w-4 h-4" />} label="Muslim-Friendly">
                <p className="text-sm text-primary font-medium">
                  ☪ {brand.muslimFriendlyInfo || "Yes"}
                </p>
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
          </div>
        </div>
      </div>
    </div>
  );
};

const InfoRow = ({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) => (
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

export default BrandDetail;
