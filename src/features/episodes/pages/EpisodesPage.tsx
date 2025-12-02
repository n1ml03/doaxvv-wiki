import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/shared/layouts";
import { Breadcrumb, SearchFilter, LocalizedText, ResponsiveContainer, DatasetImage, PaginatedGrid, ScrollToTop } from "@/shared/components";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { BookOpen, Calendar, Play, Star, Users } from "lucide-react";
import { contentLoader } from "@/content";
import type { Episode } from "@/content";
import { useTranslation } from "@/shared/hooks/useTranslation";
import { useDocumentTitle } from "@/shared/hooks/useDocumentTitle";

const ITEMS_PER_PAGE = 24;

const EpisodesPage = () => {
  const { t } = useTranslation();
  
  // Set dynamic page title (Requirements: 9.1, 9.2)
  useDocumentTitle(t('episodes.title'));
  
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState("newest");

  useEffect(() => {
    async function loadContent() {
      await contentLoader.initialize();
      setEpisodes(contentLoader.getEpisodes());
      setLoading(false);
    }
    loadContent();
  }, []);

  const categories = [
    { value: "Character", label: t('filters.character') },
    { value: "Gravure", label: t('filters.gravure') },
    { value: "Event", label: t('filters.event') },
    { value: "Extra", label: t('filters.extra') },
    { value: "Bromide", label: t('filters.bromide') },
  ];

  const filteredEpisodes = useMemo(() => {
    let result = episodes.filter(episode => {
      const matchesSearch = episode.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = selectedCategory === "All" || episode.type === selectedCategory;
      return matchesSearch && matchesType;
    });

    switch (sortBy) {
      case "a-z":
        result = [...result].sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "z-a":
        result = [...result].sort((a, b) => b.title.localeCompare(a.title));
        break;
      case "newest":
        result = [...result].sort((a, b) => {
          const dateA = a.release_date ? new Date(a.release_date).getTime() : 0;
          const dateB = b.release_date ? new Date(b.release_date).getTime() : 0;
          return dateB - dateA;
        });
        break;
      default:
        break;
    }

    return result;
  }, [searchTerm, selectedCategory, sortBy, episodes]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Available": return "bg-accent text-accent-foreground";
      case "Coming Soon": return "bg-secondary text-secondary-foreground";
      case "Limited": return "bg-primary text-primary-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "Available": return t('status.available');
      case "Coming Soon": return t('status.comingSoon');
      case "Limited": return t('status.limited');
      default: return status;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "Character": return t('filters.character');
      case "Gravure": return t('filters.gravure');
      case "Event": return t('filters.event');
      case "Extra": return t('filters.extra');
      case "Bromide": return t('filters.bromide');
      default: return type;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "Character": return <Users className="h-4 w-4" />;
      case "Gravure": return <Star className="h-4 w-4" />;
      case "Event": return <Calendar className="h-4 w-4" />;
      case "Extra": return <Play className="h-4 w-4" />;
      case "Bromide": return <BookOpen className="h-4 w-4" />;
      default: return <BookOpen className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main id="main-content" className="py-6 sm:py-8" tabIndex={-1}>
          <ResponsiveContainer>
            <div className="text-center py-16">
              <p className="text-lg text-muted-foreground">{t('episodes.loading')}</p>
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
          <Breadcrumb items={[{ label: t('nav.episodes') }]} />

          <div className="mb-6 sm:mb-8 animate-fade-in">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-2">{t('episodes.title')}</h1>
            <p className="text-base sm:text-lg text-muted-foreground">{t('episodes.subtitle')}</p>
          </div>

          <SearchFilter
            placeholder={t('episodes.searchPlaceholder')}
            categories={categories}
            onSearchChange={setSearchTerm}
            onCategoryChange={setSelectedCategory}
            onSortChange={setSortBy}
          />

          <PaginatedGrid
            items={filteredEpisodes}
            itemsPerPage={ITEMS_PER_PAGE}
            getKey={(episode) => episode.id}
            gridClassName="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
            resetDeps={[searchTerm, selectedCategory, sortBy]}
            emptyState={
              <div className="text-center py-12 sm:py-16">
                <p className="text-base sm:text-lg text-muted-foreground">{t('episodes.noResults')}</p>
              </div>
            }
            renderItem={(episode, index) => (
              <Link to={`/episodes/${episode.unique_key}`}>
                <Card
                  className="group cursor-pointer overflow-hidden border-border/50 bg-card shadow-card hover:shadow-hover transition-all duration-300 hover:-translate-y-1 animate-fade-in h-full"
                  style={{ animationDelay: `${Math.min(index, 8) * 0.03}s` }}
                >
                  <div className="relative aspect-video overflow-hidden">
                    <DatasetImage
                      src={episode.image}
                      alt={episode.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute top-3 left-3 flex gap-2">
                      <Badge className={getStatusColor(episode.episode_status)}>
                        {getStatusLabel(episode.episode_status)}
                      </Badge>
                    </div>
                    <div className="absolute bottom-3 left-3 flex items-center gap-2">
                      <Badge variant="outline" className="bg-background/90 text-foreground border-0">
                        {getTypeIcon(episode.type)}
                        <span className="ml-1">{getTypeLabel(episode.type)}</span>
                      </Badge>
                    </div>
                  </div>
                  
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg group-hover:text-primary transition-colors line-clamp-2">
                      <LocalizedText localized={episode.name} />
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2 text-sm">
                      <Calendar className="h-3.5 w-3.5" />
                      {episode.release_date 
                        ? new Date(episode.release_date).toLocaleDateString()
                        : t('episodes.tba')}
                      {episode.release_version && (
                        <span className="text-xs text-muted-foreground">v{episode.release_version}</span>
                      )}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="pt-0">
                    {episode.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                        <LocalizedText localized={episode.description} />
                      </p>
                    )}
                    <Button className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <Play className="h-4 w-4 mr-2" />
                      {t('episodes.view')}
                    </Button>
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

export default EpisodesPage;
