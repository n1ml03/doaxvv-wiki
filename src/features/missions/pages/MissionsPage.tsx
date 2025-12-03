import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/shared/layouts";
import { Breadcrumb, LocalizedText, ResponsiveContainer, DatasetImage, PaginatedGrid, ScrollToTop, UnifiedFilterUI } from "@/shared/components";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Target, Gift, CheckCircle } from "lucide-react";
import { contentLoader } from "@/content";
import type { Mission } from "@/content";
import { getLocalizedValue } from "@/shared/utils/localization";
import { useLanguage } from "@/shared/contexts/language-hooks";
import { useTranslation } from "@/shared/hooks/useTranslation";
import { useDocumentTitle } from "@/shared/hooks/useDocumentTitle";
import { useUnifiedFilter } from "@/shared/hooks/useUnifiedFilter";

const ITEMS_PER_PAGE = 12;

const MissionsPage = () => {
  const { currentLanguage } = useLanguage();
  const { t } = useTranslation();
  
  // Set dynamic page title
  useDocumentTitle(t('missions.title'));
  
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadContent() {
      await contentLoader.initialize();
      setMissions(contentLoader.getMissions());
      setLoading(false);
    }
    loadContent();
  }, []);

  // Custom search function for missions
  const customSearchFn = useMemo(() => {
    return (item: Mission, searchTerm: string): boolean => {
      if (!searchTerm || searchTerm.trim() === '') return true;
      const localizedName = getLocalizedValue(item.name, currentLanguage);
      return localizedName.toLowerCase().includes(searchTerm.toLowerCase());
    };
  }, [currentLanguage]);

  // Custom sort functions for mission-specific sorting
  const customSortFunctions = useMemo(() => ({
    'newest': () => 0, // Default order
    'a-z': (a: Mission, b: Mission) => 
      getLocalizedValue(a.name, currentLanguage).localeCompare(getLocalizedValue(b.name, currentLanguage)),
    'z-a': (a: Mission, b: Mission) => 
      getLocalizedValue(b.name, currentLanguage).localeCompare(getLocalizedValue(a.name, currentLanguage)),
  }), [currentLanguage]);

  // Use unified filter hook with missions preset
  const {
    state,
    handlers,
    filteredData: filteredMissions,
    activeFilterCount,
    config,
  } = useUnifiedFilter<Mission>({
    preset: 'missions',
    data: missions,
    customSearchFn,
    customSortFunctions,
    typeField: 'type',
    defaultSort: 'newest',
  });

  const getTypeColor = (type: string) => {
    switch (type) {
      case "Daily": return "bg-blue-500/80 text-white";
      case "Weekly": return "bg-purple-500/80 text-white";
      case "Event": return "bg-pink-500/80 text-white";
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
              <p className="text-lg text-muted-foreground">{t('missions.loading')}</p>
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
          <Breadcrumb items={[{ label: t('nav.missions') }]} />

          <div className="mb-6 sm:mb-8 animate-fade-in">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-2">{t('missions.title')}</h1>
            <p className="text-base sm:text-lg text-muted-foreground">
              {t('missions.subtitle').replace('{count}', missions.length.toString())}
            </p>
          </div>

          <UnifiedFilterUI
            state={state}
            handlers={handlers}
            config={config}
            activeFilterCount={activeFilterCount}
            placeholder={t('missions.searchPlaceholder')}
            showResultCount={filteredMissions.length}
          />

          <PaginatedGrid
            items={filteredMissions}
            itemsPerPage={ITEMS_PER_PAGE}
            getKey={(mission) => mission.id}
            resetDeps={[state.search, state.type, state.sort]}
            emptyState={
              <div className="text-center py-12 sm:py-16">
                <p className="text-base sm:text-lg text-muted-foreground">{t('missions.noResults')}</p>
              </div>
            }
            renderItem={(mission, index) => (
              <Link to={`/missions/${mission.unique_key}`}>
                <Card
                  className="group cursor-pointer overflow-hidden border-border/50 bg-card shadow-card hover:shadow-hover transition-all duration-300 hover:-translate-y-1 animate-fade-in h-full"
                  style={{ animationDelay: `${Math.min(index, 8) * 0.03}s` }}
                >
                  {mission.image && (
                    <div className="relative aspect-video overflow-hidden">
                      <DatasetImage
                        src={mission.image}
                        alt={getLocalizedValue(mission.name, currentLanguage)}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute top-3 left-3 flex gap-2">
                        <Badge className={getTypeColor(mission.type)}>
                          {t(`missionType.${mission.type.toLowerCase()}`)}
                        </Badge>
                      </div>
                    </div>
                  )}

                  <CardContent className="p-4 space-y-3">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                        <LocalizedText localized={mission.name} />
                      </h3>
                      {mission.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          <LocalizedText localized={mission.description} />
                        </p>
                      )}
                    </div>

                    {!mission.image && (
                      <div className="flex gap-2 flex-wrap">
                        <Badge className={getTypeColor(mission.type)}>
                          {t(`missionType.${mission.type.toLowerCase()}`)}
                        </Badge>
                      </div>
                    )}

                    {/* Objectives preview */}
                    {mission.objectives.length > 0 && (
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Target className="h-3 w-3" />
                          <span>{t('missions.objectives')}</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {mission.objectives.slice(0, 2).map((obj, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              {obj.length > 25 ? obj.substring(0, 25) + '...' : obj}
                            </Badge>
                          ))}
                          {mission.objectives.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{mission.objectives.length - 2}
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Rewards preview */}
                    {mission.rewards.length > 0 && (
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Gift className="h-3 w-3" />
                          <span>{t('missions.rewards')}</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {mission.rewards.slice(0, 2).map((reward, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {reward}
                            </Badge>
                          ))}
                          {mission.rewards.length > 2 && (
                            <Badge variant="secondary" className="text-xs">
                              +{mission.rewards.length - 2}
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="pt-2 border-t border-border/50">
                      <p className="text-xs text-muted-foreground">
                        {t('missions.updated').replace('{date}', mission.updated_at)}
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

export default MissionsPage;
