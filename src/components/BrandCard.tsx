import { MapPin, Clock } from "lucide-react";
import type { Brand } from "@/data/brands";

interface BrandCardProps {
  brand: Brand;
  index: number;
  onClick: () => void;
}

const priceColors: Record<string, string> = {
  "$": "text-green-600",
  "$$": "text-accent",
  "$$$": "text-orange-600",
};

const BrandCard = ({ brand, index, onClick }: BrandCardProps) => {
  return (
    <button
      onClick={onClick}
      className="group text-left w-full rounded-2xl bg-card border border-border hover:border-accent/50 hover:shadow-xl transition-all duration-300 overflow-hidden animate-fade-in-up"
      style={{ animationDelay: `${index * 0.06}s` }}
    >
      {/* Color accent bar */}
      <div className="h-2 bg-primary" />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-display text-lg font-bold group-hover:text-accent transition-colors">
              {brand.name}
            </h3>
            <div className="flex items-center gap-1 text-muted-foreground text-sm mt-0.5">
              <MapPin className="w-3 h-3" />
              {brand.location}
            </div>
          </div>
          <span className={`font-display font-bold text-lg ${priceColors[brand.priceRange] || ""}`}>
            {brand.priceRange}
          </span>
        </div>

        {/* Description */}
        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{brand.description}</p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {brand.styleTags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="text-xs px-2 py-0.5 rounded-full bg-tag text-tag-foreground font-medium"
            >
              #{tag}
            </span>
          ))}
        </div>

        {/* Bottom info */}
        <div className="flex items-center justify-between pt-3 border-t border-border">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            {brand.operatingHours.split(" - ")[0]} - {brand.operatingHours.split(" - ")[1]?.split(" (")[0]}
          </div>
          <div className="flex gap-1">
            {brand.genderCategory.map((g) => (
              <span
                key={g}
                className="text-xs px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground font-medium"
              >
                {g}
              </span>
            ))}
          </div>
        </div>

        {/* Muslim friendly badge */}
        {brand.muslimFriendly && (
          <div className="mt-3 flex items-center gap-1.5 text-xs text-primary font-medium">
            <span>☪</span> Muslim-Friendly
          </div>
        )}
      </div>
    </button>
  );
};

export default BrandCard;
