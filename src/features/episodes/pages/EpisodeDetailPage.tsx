import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Header } from "@/shared/layouts";
import { Breadcrumb, LocalizedText, ResponsiveContainer, DatasetImage, UniqueKeyDisplay, ScrollToTop } from "@/shared/components";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { BookOpen, Calendar, Play, Star, Users, Info, Tag } from "lucide-react";
import { contentLoader } from "@/content";
import type { Episode, Character } from "@/content";
import { getLocalizedValue } from "@/shared/utils/localization";
import { useLanguage } from "@/shared/contexts/language-hooks";

import { useTranslation } from "@/shared/hooks/useTranslation";

const EpisodeDetailPage = () => {
  const { unique_key } = useParams<{ unique_key: string }>();
  const { currentLanguage } = useLanguage();
  const { t } = useTranslation();
  const [episode, setEpisode] = useState<Episode | null>(null);
  const [relatedCharacters, setRelatedCharacters] = useState<Character[]>([]);
  const [otherEpisodes, setOtherEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadContent() {
      await contentLoader.initialize();
      const foundEpisode = contentLoader.getEpisodeByUniqueKey(unique_key || "");
      setEpisode(foundEpisode || null);
      
      if (foundEpisode) {
        // Load related characters
        const allCharacters = contentLoader.getCharacters();
        const related = allCharacters.filter(c => 
          foundEpisode.character_ids?.includes(c.unique_key)
        );
        setRelatedCharacters(related);
        
        // Load other episodes of same type
        const allEpisodes = contentLoader.getEpisodes();
        const others = allEpisodes
          .filter(e => e.id !== foundEpisode.id && e.type === foundEpisode.type)
          .slice(0, 3);
        setOtherEpisodes(others);
      }
      
      setLoading(false);
    }
    loadContent();
  }, [unique_key]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Available": return "bg-accent text-accent-foreground";
      case "Coming Soon": return "bg-secondary text-secondary-foreground";
      case "Limited": return "bg-primary text-primary-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };


  const getTypeIcon = (type: string) => {
    switch (type) {
      case "Character": return <Users className="h-5 w-5" />;
      case "Gravure": return <Star className="h-5 w-5" />;
      case "Event": return <Calendar className="h-5 w-5" />;
      case "Extra": return <Play className="h-5 w-5" />;
      case "Bromide": return <BookOpen className="h-5 w-5" />;
      default: return <BookOpen className="h-5 w-5" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main id="main-content" className="py-6 sm:py-8" tabIndex={-1}>
          <ResponsiveContainer>
            <div className="text-center py-16">
              <p className="text-lg text-muted-foreground">{t('episodeDetail.loading')}</p>
            </div>
          </ResponsiveContainer>
        </main>
      </div>
    );
  }

  if (!episode) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main id="main-content" className="py-6 sm:py-8" tabIndex={-1}>
          <ResponsiveContainer>
            <div className="text-center py-16">
              <h1 className="text-2xl font-bold text-foreground mb-4">{t('episodeDetail.notFound')}</h1>
              <Link to="/episodes">
                <Button>{t('episodeDetail.backToEpisodes')}</Button>
              </Link>
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
          <Breadcrumb items={[{ label: t('nav.episodes'), href: "/episodes" }, { label: getLocalizedValue(episode.name, currentLanguage) }]} />

          <div className="animate-fade-in">
            {/* Hero Banner */}
            <div className="relative aspect-[21/9] sm:aspect-[21/9] rounded-xl sm:rounded-2xl overflow-hidden mb-6 sm:mb-8">
              <DatasetImage
                src={episode.image}
                alt={episode.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-8">
                <div className="flex flex-wrap gap-2 mb-3 sm:mb-4">
                  <Badge className={getStatusColor(episode.episode_status)}>{t(`status.${episode.episode_status.toLowerCase().replace(" ", "")}`)}</Badge>
                  <Badge variant="outline" className="bg-background/90 text-foreground border-0 flex items-center gap-1">
                    {getTypeIcon(episode.type)}
                    {t(`filters.${episode.type.toLowerCase()}`)}
                  </Badge>
                </div>
                <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold text-white mb-2 sm:mb-4">
                  <LocalizedText localized={episode.name} showIndicator />
                </h1>
                
                <div className="flex flex-wrap gap-2 sm:gap-4">
                  {episode.release_date && (
                    <div className="bg-background/95 backdrop-blur rounded-lg px-3 sm:px-4 py-1.5 sm:py-2 shadow-lg">
                      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                        <Calendar className="h-4 w-4 text-primary" />
                        <span>{t('episodeDetail.released').replace('{date}', new Date(episode.release_date).toLocaleDateString())}</span>
                      </div>
                    </div>
                  )}
                  {episode.release_version && (
                    <div className="bg-background/95 backdrop-blur rounded-lg px-3 sm:px-4 py-1.5 sm:py-2 shadow-lg">
                      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                        <Tag className="h-4 w-4 text-primary" />
                        <span>{t('episodeDetail.version').replace('{version}', episode.release_version)}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>


            {/* Main content grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                {/* Description */}
                <Card className="border-border/50 bg-card shadow-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Info className="h-5 w-5 text-primary" />
                      {t('episodeDetail.about')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {episode.description ? (
                      <p className="text-muted-foreground leading-relaxed">
                        <LocalizedText localized={episode.description} showIndicator />
                      </p>
                    ) : (
                      <p className="text-muted-foreground leading-relaxed">{episode.summary}</p>
                    )}
                  </CardContent>
                </Card>

                {/* Featured Characters */}
                {relatedCharacters.length > 0 && (
                  <Card className="border-border/50 bg-card shadow-card">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-primary" />
                        {t('episodeDetail.featuredCharacters')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {relatedCharacters.map((character) => (
                          <Link key={character.id} to={`/girls/${character.unique_key}`}>
                            <div className="group text-center">
                              <div className="relative aspect-square rounded-xl overflow-hidden mb-2">
                                <DatasetImage
                                  src={character.image}
                                  alt={character.title}
                                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                />
                              </div>
                              <p className="font-medium text-sm group-hover:text-primary transition-colors">
                                <LocalizedText localized={character.name} />
                              </p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Episode Info */}
                <Card className="border-border/50 bg-card shadow-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-primary" />
                      {t('episodeDetail.episodeInfo')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{t('episodeDetail.type')}</span>
                      <span className="font-medium flex items-center gap-1">
                        {getTypeIcon(episode.type)}
                        {t(`filters.${episode.type.toLowerCase()}`)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{t('episodeDetail.status')}</span>
                      <Badge className={getStatusColor(episode.episode_status)}>{t(`status.${episode.episode_status.toLowerCase().replace(" ", "")}`)}</Badge>
                    </div>
                    {episode.release_version && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{t('episodeDetail.version').split(' ')[0]}</span>
                        <span className="font-medium">{episode.release_version}</span>
                      </div>
                    )}
                    {episode.release_date && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{t('episodeDetail.releaseDate')}</span>
                        <span className="font-medium">{new Date(episode.release_date).toLocaleDateString()}</span>
                      </div>
                    )}
                    <UniqueKeyDisplay uniqueKey={episode.unique_key} />
                  </CardContent>
                </Card>

                {/* Tags */}
                {episode.tags && episode.tags.length > 0 && (
                  <Card className="border-border/50 bg-card shadow-card">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Tag className="h-5 w-5 text-primary" />
                        {t('episodeDetail.tags')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {episode.tags.map((tag, index) => (
                          <Badge key={index} variant="secondary">{tag}</Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>


            {/* Other Episodes */}
            {otherEpisodes.length > 0 && (
              <section className="mt-8 sm:mt-12">
                <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-4 sm:mb-6">{t('episodeDetail.moreEpisodes').replace('{type}', episode.type)}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {otherEpisodes.map((otherEpisode) => (
                    <Link key={otherEpisode.id} to={`/episodes/${otherEpisode.unique_key}`}>
                      <Card className="group cursor-pointer overflow-hidden border-border/50 bg-card shadow-card hover:shadow-hover transition-all duration-200 hover:-translate-y-0.5">
                        <div className="relative aspect-video overflow-hidden">
                          <DatasetImage
                            src={otherEpisode.image}
                            alt={otherEpisode.title}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                          <Badge className={`absolute top-2 right-2 ${getStatusColor(otherEpisode.episode_status)}`}>
                            {t(`status.${otherEpisode.episode_status.toLowerCase().replace(" ", "")}`)}
                          </Badge>
                        </div>
                        <CardContent className="p-3 sm:p-4">
                          <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors text-sm sm:text-base line-clamp-2">
                            <LocalizedText localized={otherEpisode.name} />
                          </h3>
                          <p className="text-xs sm:text-sm text-muted-foreground">{t(`filters.${otherEpisode.type.toLowerCase()}`)}</p>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>

          <ScrollToTop />
        </ResponsiveContainer>
      </main>
    </div>
  );
};

export default EpisodeDetailPage;
