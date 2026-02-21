import { useState, useMemo } from "react";
import { Search, MapPin, Filter, X } from "lucide-react";
import { brands, STYLE_TAGS, GENDER_OPTIONS, AREAS } from "@/data/brands";
import BrandCard from "@/components/BrandCard";
import BrandDetail from "@/components/BrandDetail";
import type { Brand } from "@/data/brands";
import heroBanner from "@/assets/hero-banner.jpg";

const Index = () => {
  const [search, setSearch] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedGenders, setSelectedGenders] = useState<string[]>([]);
  const [selectedArea, setSelectedArea] = useState("");
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const toggleGender = (g: string) => {
    setSelectedGenders((prev) =>
      prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]
    );
  };

  const filtered = useMemo(() => {
    return brands.filter((b) => {
      const matchSearch =
        !search ||
        b.name.toLowerCase().includes(search.toLowerCase()) ||
        b.description.toLowerCase().includes(search.toLowerCase()) ||
        b.styleTags.some((t) => t.toLowerCase().includes(search.toLowerCase()));
      const matchTags =
        selectedTags.length === 0 ||
        selectedTags.some((t) => b.styleTags.includes(t));
      const matchGender =
        selectedGenders.length === 0 ||
        selectedGenders.some((g) => b.genderCategory.includes(g as any));
      const matchArea = !selectedArea || b.area === selectedArea;
      return matchSearch && matchTags && matchGender && matchArea;
    });
  }, [search, selectedTags, selectedGenders, selectedArea]);

  const hasActiveFilters = selectedTags.length > 0 || selectedGenders.length > 0 || !!selectedArea;

  const clearFilters = () => {
    setSelectedTags([]);
    setSelectedGenders([]);
    setSelectedArea("");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <header className="relative h-[70vh] min-h-[500px] flex items-center justify-center overflow-hidden">
        <img
          src={heroBanner}
          alt="Malaysian local fashion brands"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-[hsl(var(--hero-overlay)/0.75)]" />
        <div className="relative z-10 text-center px-4 max-w-3xl mx-auto">
          <h1 className="font-display text-5xl md:text-7xl font-bold text-primary-foreground mb-4 animate-fade-in-up">
            Lokal-lah
            <span className="block text-accent text-3xl md:text-4xl mt-2">Discover Local Fashion Brands</span>
          </h1>
          <p className="text-lg md:text-xl text-primary-foreground/80 mb-8 animate-fade-in-up font-body" style={{ animationDelay: "0.15s" }}>
            Your go-to directory untuk cari brand baju lokal Malaysia yang best. Dari streetwear sampai batik moden.
          </p>
          {/* Search */}
          <div className="relative max-w-xl mx-auto animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Cari brand, style, atau lokasi..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-4 rounded-2xl bg-background/95 backdrop-blur-md border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent shadow-lg text-base"
            />
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-4 py-12">
        {/* Filter bar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h2 className="font-display text-2xl font-bold">
              {filtered.length} Brand{filtered.length !== 1 ? "s" : ""}
            </h2>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-sm text-accent hover:underline flex items-center gap-1"
              >
                <X className="w-3 h-3" /> Clear filters
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-colors ${
              showFilters || hasActiveFilters
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card border-border hover:border-primary/50"
            }`}
          >
            <Filter className="w-4 h-4" />
            <span className="text-sm font-medium">Filter</span>
          </button>
        </div>

        {/* Filter panel */}
        {showFilters && (
          <div className="mb-8 p-6 rounded-2xl glass-card animate-fade-in space-y-5">
            {/* Style tags */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-3">Style / Niche</h3>
              <div className="flex flex-wrap gap-2">
                {STYLE_TAGS.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      selectedTags.includes(tag)
                        ? "bg-primary text-primary-foreground"
                        : "bg-tag text-tag-foreground hover:bg-primary/10"
                    }`}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>
            {/* Gender */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-3">Gender</h3>
              <div className="flex flex-wrap gap-2">
                {GENDER_OPTIONS.map((g) => (
                  <button
                    key={g}
                    onClick={() => toggleGender(g)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      selectedGenders.includes(g)
                        ? "bg-primary text-primary-foreground"
                        : "bg-tag text-tag-foreground hover:bg-primary/10"
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
            {/* Area */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-3">Area</h3>
              <div className="flex flex-wrap gap-2">
                {AREAS.map((a) => (
                  <button
                    key={a}
                    onClick={() => setSelectedArea(selectedArea === a ? "" : a)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-1 ${
                      selectedArea === a
                        ? "bg-primary text-primary-foreground"
                        : "bg-tag text-tag-foreground hover:bg-primary/10"
                    }`}
                  >
                    <MapPin className="w-3 h-3" />
                    {a}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Brand grid */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((brand, i) => (
              <BrandCard
                key={brand.id}
                brand={brand}
                index={i}
                onClick={() => setSelectedBrand(brand)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-xl font-display text-muted-foreground">Tak jumpa brand 😢</p>
            <p className="text-muted-foreground mt-2">Cuba tukar filter atau search keyword lain</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-primary text-primary-foreground py-6">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-primary-foreground/70 text-sm">© 2026 Lokal-lah</p>
        </div>
      </footer>

      {/* Detail modal */}
      {selectedBrand && (
        <BrandDetail brand={selectedBrand} onClose={() => setSelectedBrand(null)} />
      )}
    </div>
  );
};

export default Index;
