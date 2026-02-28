import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, MapPin, Filter, X, Lock } from "lucide-react";
import { brands, CATEGORIES, CATEGORY_FILTERS } from "@/data/brands";
import type { Category } from "@/data/brands";
import BrandCard from "@/components/BrandCard";
import heroBanner from "@/assets/hero-banner.jpg";

const Index = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedGenders, setSelectedGenders] = useState<string[]>([]);
  const [selectedArea, setSelectedArea] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const categoryFilters = selectedCategory ? CATEGORY_FILTERS[selectedCategory] : null;

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

  const resetFilters = () => {
    setSelectedTags([]);
    setSelectedGenders([]);
    setSelectedArea("");
  };

  const handleCategorySelect = (cat: Category) => {
    if (selectedCategory === cat) {
      setSelectedCategory(null);
    } else {
      setSelectedCategory(cat);
    }
    resetFilters();
    setShowFilters(false);
  };

  const filtered = useMemo(() => {
    if (!selectedCategory) return [];
    return brands.filter((b) => {
      const matchCategory = b.category === selectedCategory;
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
      return matchCategory && matchSearch && matchTags && matchGender && matchArea;
    });
  }, [selectedCategory, search, selectedTags, selectedGenders, selectedArea]);

  const hasActiveFilters =
    selectedTags.length > 0 || selectedGenders.length > 0 || !!selectedArea;

  const activeFilterCount =
    selectedTags.length + selectedGenders.length + (selectedArea ? 1 : 0);

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

        {/* Auth buttons */}
        <div className="absolute top-5 right-5 z-20 flex items-center gap-2">
          <button className="px-4 py-2 rounded-xl text-sm font-medium text-primary-foreground border border-primary-foreground/40 hover:bg-primary-foreground/10 transition-colors backdrop-blur-sm">
            Log In
          </button>
          <button className="px-4 py-2 rounded-xl text-sm font-medium bg-accent text-accent-foreground hover:opacity-90 transition-opacity">
            Sign Up
          </button>
        </div>

        <div className="relative z-10 text-center px-4 max-w-3xl mx-auto">
          <h1 className="font-display text-5xl md:text-7xl font-bold text-primary-foreground mb-4 animate-fade-in-up">
            Lokal-Map
            <span className="block text-accent text-3xl md:text-4xl mt-2">
              Discover Local Brands
            </span>
          </h1>
          <p
            className="text-lg md:text-xl text-primary-foreground/80 mb-8 animate-fade-in-up font-body"
            style={{ animationDelay: "0.15s" }}
          >
            Your go-to directory untuk cari brand lokal Malaysia yang best.
          </p>
          <div
            className="relative max-w-xl mx-auto animate-fade-in-up"
            style={{ animationDelay: "0.3s" }}
          >
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

      <main className="max-w-7xl mx-auto px-4 py-12">
        {/* Category picker */}
        <section className="mb-10">
          <h2 className="font-display text-xl font-bold mb-4">Pilih Kategori</h2>
          <div className="flex flex-wrap gap-3">
            {CATEGORIES.map(({ id, label, emoji, available }) =>
              available ? (
                <button
                  key={id}
                  onClick={() => handleCategorySelect(id)}
                  className={`flex items-center gap-2 px-5 py-3 rounded-2xl border-2 font-medium text-sm transition-all ${
                    selectedCategory === id
                      ? "border-accent bg-accent text-accent-foreground shadow-md"
                      : "border-border bg-card hover:border-accent/60 hover:shadow-sm"
                  }`}
                >
                  <span className="text-lg">{emoji}</span>
                  {label}
                </button>
              ) : (
                <div
                  key={id}
                  className="flex items-center gap-2 px-5 py-3 rounded-2xl border-2 border-border/40 bg-muted/30 text-muted-foreground text-sm font-medium select-none cursor-not-allowed"
                >
                  <span className="text-lg opacity-40">{emoji}</span>
                  <span className="opacity-60">{label}</span>
                  <span className="ml-1 text-xs px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground/60 font-normal flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5" /> Coming Soon
                  </span>
                </div>
              )
            )}
          </div>
        </section>

        {selectedCategory && categoryFilters ? (
          <>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <h2 className="font-display text-2xl font-bold">
                  {filtered.length} Brand{filtered.length !== 1 ? "s" : ""}
                </h2>
                {hasActiveFilters && (
                  <button
                    onClick={resetFilters}
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
                {hasActiveFilters && (
                  <span className="w-5 h-5 rounded-full bg-accent text-accent-foreground text-xs flex items-center justify-center font-bold">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>

            {showFilters && (
              <div className="mb-8 p-6 rounded-2xl glass-card animate-fade-in space-y-5">
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-3">Style / Niche</h3>
                  <div className="flex flex-wrap gap-2">
                    {categoryFilters.styleTags.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                          selectedTags.includes(tag)
                            ? "bg-primary text-primary-foreground"
                            : "bg-tag text-tag-foreground hover:bg-primary/10"
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-3">Gender</h3>
                  <div className="flex flex-wrap gap-2">
                    {categoryFilters.genderOptions.map((g) => (
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
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-3">Area</h3>
                  <div className="flex flex-wrap gap-2">
                    {categoryFilters.areas.map((a) => (
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

            {filtered.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.map((brand, i) => (
                  <BrandCard
                    key={brand.id}
                    brand={brand}
                    index={i}
                    onClick={() => navigate(`/brand/${brand.id}`)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <p className="text-xl font-display text-muted-foreground">Tak jumpa brand 😢</p>
                <p className="text-muted-foreground mt-2">
                  Cuba tukar filter atau search keyword lain
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-lg">👆 Pilih kategori dulu untuk tunjuk brand</p>
          </div>
        )}
      </main>

      <footer className="bg-primary text-primary-foreground py-6">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-primary-foreground/70 text-sm">© 2026 Lokal-Map</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
