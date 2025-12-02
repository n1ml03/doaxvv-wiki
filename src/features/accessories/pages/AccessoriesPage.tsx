import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/shared/layouts";
import { Breadcrumb, SearchFilter, LocalizedText, ResponsiveContainer, DatasetImage, PaginatedGrid, ScrollToTop } from "@/shared/components";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Gem } from "lucide-react";
import { contentLoader } from "@/content";
import type { Accessory, Character } from "@/content";
import { getLocalizedValue } from "@/shared/utils/localization";
import { useLanguage } from "@/shared/contexts/language-hooks";
import { useTranslation } from "@/shared/hooks/useTranslation";
import { useDocumentTitle } from "@/shared/hooks/useDocumentTitle";

const ITEMS_PER_PAGE = 24;

const AccessoriesPage = () => {
  const { currentLanguage } = useLanguage();
  const { t } = useTranslation();
  
  // Set dynamic page title
  useDocumentTitle(t('accessories.title'));
  
  const [accessories, setAccessories] = useState<Accessory[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState("newest");

  useEffect(() => {
    async function loadContent() {
      await contentLoader.initialize();
      setAccessories(contentLoader.getAccessories());
      setCharacters(contentLoader.getCharacters());
      setLoading(false);
    }
    loadContent();
  }, []);

  // Rarity filter categories
  const categories = [
    { value: "SSR", label: t('rarity.ssr') },
    { value: "SR", label: t('rarity.sr') },
    { value: "R", label: t('rarity.r') },
    { value: "N", label: t('rarity.n') },
  ];

  // Character tags for filtering
  const characterTags = characters.map(c => ({ 
    value: c.unique_key, 
    label: getLocalizedValue(c.name, currentLanguage) 
  }));

  const filteredAccessories = useMemo(() => {
    let result = accessories.filter(accessory => {
      const localizedName = getLocalizedValue(accessory.name, currentLanguage);
      const matchesSearch = localizedName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRarity = selectedCategory === "All" || accessory.rarity === selectedCategory;
      const matchesCharacter = selectedTags.length === 0 || 
        accessory.character_ids.some(charId => selectedTags.includes(charId));
      return matchesSearch && matchesRarity && matchesCharacter;
    });

    switch (sortBy) {
      case "a-z":
        result = [...result].sort((a, b) => 
          getLocalizedValue(a.name, currentLanguage).localeCompare(getLocalizedValue(b.name, currentLanguage))
        );
        break;
      case "z-a":
        result = [...result].sort((a, b) => 
          getLocalizedValue(b.name, currentLanguage).localeCompare(getLocalizedValue(a.name, currentLanguage))
        );
        break;
      default:
        break;
    }

    return result;
  }, [searchTerm, selectedCategory, selectedTags, sortBy, accessories, currentLanguage]);

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "SSR": return "bg-ssr text-ssr-foreground";
      case "SR": return "bg-sr text-sr-foreground";
      case "R": return "bg-r text-r-foreground";
      case "N": return "bg-muted text-muted-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main id="main-content" className="py-6 sm:py-8" tabIndex={-1}>
          <ResponsiveContainer>
            <div className="text-center py-16">
              <p className="text-lg text-muted-foreground">{t('accessories.loading')}</p>
            </div>
          </ResponsiveContainer>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main id="main-content" className="py-6 sm:py-8" tabIndex={-1}>
        <ResponsiveContainer>
          <Breadcrumb items={[{ label: t('nav.accessories') }]} />

          <div className="mb-6 sm:mb-8 animate-fade-in">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-2">{t('accessories.title')}</h1>
            <p className="text-base sm:text-lg text-muted-foreground">
              {t('accessories.subtitle').replace('{count}', accessories.length.toString())}
            </p>
          </div>

          <SearchFilter
            placeholder={t('accessories.searchPlaceholder')}
            categories={categories}
            tags={characterTags}
            onSearchChange={setSearchTerm}
            onCategoryChange={setSelectedCategory}
            onTagsChange={setSelectedTags}
            onSortChange={setSortBy}
          />

          <PaginatedGrid
            items={filteredAccessories}
            itemsPerPage={ITEMS_PER_PAGE}
            getKey={(accessory) => accessory.id}
            resetDeps={[searchTerm, selectedCategory, selectedTags, sortBy]}
            emptyState={
              <div className="text-center py-12 sm:py-16">
                <p className="text-base sm:text-lg text-muted-foreground">{t('accessories.noResults')}</p>
              </div>
            }
            renderItem={(accessory, index) => (
              <Link to={`/accessories/${accessory.unique_key}`}>
                <Card
                  className="group cursor-pointer overflow-hidden border-border/50 bg-card shadow-card hover:shadow-hover transition-all duration-300 hover:-translate-y-2 animate-fade-in h-full"
                  style={{ animationDelay: `${Math.min(index, 8) * 0.03}s` }}
                >
                  <div className="relative aspect-square overflow-hidden">
                    <DatasetImage
                      src={accessory.image}
                      alt={getLocalizedValue(accessory.name, currentLanguage)}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    
                    <div className="absolute top-3 left-3 flex flex-col gap-2">
                      <Badge className={getRarityColor(accessory.rarity)}>
                        {accessory.rarity}
                      </Badge>
                      <Badge className="bg-primary/80 text-primary-foreground">
                        <Gem className="h-3 w-3 mr-1" />
                        {t(`obtainMethod.${accessory.obtain_method.toLowerCase()}`)}
                      </Badge>
                    </div>
                  </div>

                  <CardContent className="p-4 space-y-3">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                        <LocalizedText localized={accessory.name} />
                      </h3>
                      {accessory.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          <LocalizedText localized={accessory.description} />
                        </p>
                      )}
                    </div>

                    {accessory.character_ids.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {accessory.character_ids.slice(0, 3).map(charId => {
                          const char = characters.find(c => c.unique_key === charId);
                          return char ? (
                            <Badge key={charId} variant="outline" className="text-xs">
                              {getLocalizedValue(char.name, currentLanguage)}
                            </Badge>
                          ) : null;
                        })}
                        {accessory.character_ids.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{accessory.character_ids.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}

                    <div className="pt-2 border-t border-border/50">
                      <p className="text-xs text-muted-foreground">
                        {t('accessories.updated').replace('{date}', accessory.updated_at)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )}
          />
          <ScrollToTop />
        </ResponsiveContainer>
      </main>
    </div>
  );
};

export default AccessoriesPage;
