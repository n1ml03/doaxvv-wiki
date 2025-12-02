import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/shared/layouts";
import { Breadcrumb, DatasetImage, PaginatedGrid, ScrollToTop } from "@/shared/components";
import { SearchFilter } from "@/shared/components";
import { ResponsiveContainer } from "@/shared/components/responsive";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Sparkles, Percent, Clock, Star } from "lucide-react";
import { Progress } from "@/shared/components/ui/progress";
import { contentLoader } from "@/content";
import { useLanguage } from "@/shared/contexts/language-hooks";
import { getLocalizedValue } from "@/shared/utils/localization";
import { calculateTimeRemaining, formatTimeRemaining } from "@/shared/utils/countdown";
import type { Gacha } from "@/content/schemas/content.schema";
import { useTranslation } from "@/shared/hooks/useTranslation";
import { useDocumentTitle } from "@/shared/hooks/useDocumentTitle";

const ITEMS_PER_PAGE = 12;

const GachasPage = () => {
  const { t } = useTranslation();
  
  // Set dynamic page title (Requirements: 9.1, 9.2)
  useDocumentTitle(t('gachas.title'));
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState("newest");
  const [gachas, setGachas] = useState<Gacha[]>([]);
  const [loading, setLoading] = useState(true);
  const [time, setTime] = useState(new Date());
  const { currentLanguage } = useLanguage();

  const categories = [
    { value: "Active", label: t('filters.active') },
    { value: "Coming Soon", label: t('filters.comingSoon') },
    { value: "Ended", label: t('filters.ended') },
  ];

  useEffect(() => {
    async function loadContent() {
      await contentLoader.initialize();
      const loadedGachas = contentLoader.getGachas();
      setGachas(loadedGachas);
      setLoading(false);
    }
    loadContent();
  }, []);

  // Update countdown timer every second
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);


  const getTimeDisplay = (gacha: Gacha) => {
    if (gacha.gacha_status === 'Coming Soon') {
      const timeToStart = calculateTimeRemaining(new Date(gacha.start_date), time);
      return timeToStart.isExpired ? t('gachas.startingSoon') : t('gachas.startsIn').replace('{time}', formatTimeRemaining(timeToStart));
    }
    if (gacha.gacha_status === 'Active') {
      const timeRemaining = calculateTimeRemaining(new Date(gacha.end_date), time);
      return timeRemaining.isExpired ? t('gachas.endingSoon') : formatTimeRemaining(timeRemaining);
    }
    return t('gachas.ended');
  };

  const filteredGachas = useMemo(() => {
    let result = gachas.filter(gacha => {
      const name = getLocalizedValue(gacha.name, currentLanguage);
      const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = selectedCategory === "All" || gacha.gacha_status === selectedCategory;
      return matchesSearch && matchesStatus;
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
        // Sort by end date (newest first)
        result = [...result].sort((a, b) => 
          new Date(b.end_date).getTime() - new Date(a.end_date).getTime()
        );
        break;
    }

    return result;
  }, [searchTerm, selectedCategory, sortBy, gachas, currentLanguage]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active": return "bg-accent text-accent-foreground";
      case "Coming Soon": return "bg-secondary text-secondary-foreground";
      case "Ended": return "bg-muted text-muted-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "Active": return t('status.active');
      case "Coming Soon": return t('status.comingSoon');
      case "Ended": return t('status.ended');
      default: return status;
    }
  };

  const getGachaType = (name: string): string => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes("premium")) return t('gachaType.premium');
    if (lowerName.includes("nostalgia")) return t('gachaType.nostalgia');
    if (lowerName.includes("festival")) return t('gachaType.festival');
    if (lowerName.includes("special")) return t('gachaType.special');
    return t('gachaType.standard');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main id="main-content" className="py-6 sm:py-8" tabIndex={-1}>
          <ResponsiveContainer>
            <div className="text-center py-16">
              <p className="text-lg text-muted-foreground">{t('gachas.loading')}</p>
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
          <Breadcrumb items={[{ label: t('nav.gachas') }]} />

          <div className="mb-6 sm:mb-8 animate-fade-in">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-2">{t('gachas.title')}</h1>
            <p className="text-base sm:text-lg text-muted-foreground">{t('gachas.subtitle')}</p>
          </div>

          <SearchFilter
            placeholder={t('gachas.searchPlaceholder')}
            categories={categories}
            onSearchChange={setSearchTerm}
            onCategoryChange={setSelectedCategory}
            onSortChange={setSortBy}
          />

          <PaginatedGrid
            items={filteredGachas}
            itemsPerPage={ITEMS_PER_PAGE}
            getKey={(gacha) => gacha.unique_key}
            gridClassName="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6"
            resetDeps={[searchTerm, selectedCategory, sortBy]}
            emptyState={
              <div className="text-center py-12 sm:py-16">
                <p className="text-base sm:text-lg text-muted-foreground">{t('gachas.noResults')}</p>
              </div>
            }
            renderItem={(gacha, index) => {
              const gachaName = getLocalizedValue(gacha.name, currentLanguage);
              const gachaType = getGachaType(gachaName);
              
              return (
                <Link to={`/gachas/${gacha.unique_key}`}>
                  <Card
                    className="group cursor-pointer overflow-hidden border-border/50 bg-card shadow-card hover:shadow-hover transition-all duration-300 hover:-translate-y-1 animate-fade-in"
                    style={{ animationDelay: `${Math.min(index, 8) * 0.03}s` }}
                  >
                  <div className="relative h-64 overflow-hidden">
                    <DatasetImage
                      src={gacha.image}
                      alt={gachaName}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                    
                    <div className="absolute top-3 left-3 flex flex-wrap gap-2">
                      <Badge className={getStatusColor(gacha.gacha_status)}>
                        {getStatusLabel(gacha.gacha_status)}
                      </Badge>
                      <Badge variant="outline" className="bg-background/90 text-foreground border-0">
                        {gachaType}
                      </Badge>
                      {gacha.step_up && (
                        <Badge className="bg-accent text-accent-foreground">
                          <Sparkles className="h-3 w-3 mr-1" />
                          {t('gachas.stepUp')}
                        </Badge>
                      )}
                    </div>

                    <div className="absolute bottom-3 right-3 bg-background/95 backdrop-blur rounded-lg px-3 py-2">
                      <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                        <Clock className="h-3 w-3 text-primary" />
                        <span>{getTimeDisplay(gacha)}</span>
                      </div>
                    </div>

                    <div className="absolute bottom-3 left-3">
                      <h3 className="text-xl font-bold text-white drop-shadow-lg">
                        {gachaName}
                      </h3>
                    </div>
                  </div>

                  <CardContent className="p-6 space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                        <Percent className="h-4 w-4 text-primary" />
                        <span>{t('gachas.pullRates')}</span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-2 text-muted-foreground">
                            <Star className="h-4 w-4 fill-primary text-primary" />
                            SSR
                          </span>
                          <span className="font-semibold text-primary">{gacha.rates.ssr}%</span>
                        </div>
                        <Progress value={gacha.rates.ssr} className="h-2" max={10} />
                        
                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-2 text-muted-foreground">
                            <Star className="h-4 w-4 fill-accent text-accent" />
                            SR
                          </span>
                          <span className="font-semibold text-accent">{gacha.rates.sr}%</span>
                        </div>
                        <Progress value={gacha.rates.sr} className="h-2" max={30} />
                      </div>
                    </div>

                    <div className="p-3 bg-muted/50 rounded-lg">
                      <div className="text-xs text-muted-foreground mb-1">{t('gachas.pitySystem')}</div>
                      <div className="text-sm font-semibold text-foreground">
                        {t('gachas.guaranteedSSR').replace('{count}', gacha.pity_at.toString())}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-sm font-medium text-foreground">{t('gachas.featuredCharacters')}</div>
                      <div className="space-y-1">
                        {gacha.featured_characters.slice(0, 3).map((charSlug, i) => (
                          <div key={i} className="text-sm text-muted-foreground flex items-center gap-2">
                            <Sparkles className="h-3 w-3 text-primary" />
                            {charSlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </div>
                        ))}
                      </div>
                    </div>  
                  </CardContent>
                  </Card>
                </Link>
              );
            }}
          />
          <ScrollToTop />
        </ResponsiveContainer>
      </main>
    </div>
  );
};

export default GachasPage;
