import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/shared/layouts";
import { Breadcrumb, SearchFilter, LocalizedText, ResponsiveContainer, DatasetImage } from "@/shared/components";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Calendar, Clock, Gift, Sparkles } from "lucide-react";
import { contentLoader } from "@/content";
import type { Event } from "@/content";
import { useLanguage } from "@/shared/contexts/language-hooks";
import { getLocalizedValue } from "@/shared/utils/localization";
import { useTranslation } from "@/shared/hooks/useTranslation";
import { useDocumentTitle } from "@/shared/hooks/useDocumentTitle";

const FestivalsPage = () => {
  const { t } = useTranslation();
  
  // Set dynamic page title (Requirements: 9.1, 9.2)
  useDocumentTitle(t('festivals.title'));
  
  const [festivals, setFestivals] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [time, setTime] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState("newest");
  const { currentLanguage } = useLanguage();

  useEffect(() => {
    async function loadContent() {
      await contentLoader.initialize();
      // Filter events to only show Festival type
      const allEvents = contentLoader.getEvents();
      const festivalEvents = allEvents.filter(event => event.type === "Festival");
      setFestivals(festivalEvents);
      setLoading(false);
    }
    loadContent();
  }, []);

  const categories = [
    { value: "Active", label: t('filters.active') },
    { value: "Upcoming", label: t('filters.upcoming') },
    { value: "Ended", label: t('filters.ended') },
  ];

  const filteredFestivals = useMemo(() => {
    let result = festivals.filter(festival => {
      const festivalName = getLocalizedValue(festival.name, currentLanguage);
      const matchesSearch = festivalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           festival.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = selectedCategory === "All" || festival.event_status === selectedCategory;
      return matchesSearch && matchesStatus;
    });

    switch (sortBy) {
      case "a-z":
        result = [...result].sort((a, b) => {
          const nameA = getLocalizedValue(a.name, currentLanguage);
          const nameB = getLocalizedValue(b.name, currentLanguage);
          return nameA.localeCompare(nameB);
        });
        break;
      case "z-a":
        result = [...result].sort((a, b) => {
          const nameA = getLocalizedValue(a.name, currentLanguage);
          const nameB = getLocalizedValue(b.name, currentLanguage);
          return nameB.localeCompare(nameA);
        });
        break;
      default:
        break;
    }

    return result;
  }, [searchTerm, selectedCategory, sortBy, festivals, currentLanguage]);


  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const calculateTimeLeft = (endDate: string | Date) => {
    const eventDate = new Date(endDate);
    const difference = eventDate.getTime() - time.getTime();
    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((difference / 1000 / 60) % 60);
    return { days, hours, minutes };
  };

  const formatDateRange = (startDate: string | Date, endDate: string | Date) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active": return "bg-accent text-accent-foreground";
      case "Upcoming": return "bg-secondary text-secondary-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "Active": return t('status.active');
      case "Upcoming": return t('status.upcoming');
      case "Ended": return t('status.ended');
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main id="main-content" className="py-6 sm:py-8" tabIndex={-1}>
          <ResponsiveContainer>
            <div className="text-center py-16">
              <p className="text-lg text-muted-foreground">{t('festivals.loading')}</p>
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
          <Breadcrumb items={[{ label: t('nav.festivals') }]} />

          <div className="mb-6 sm:mb-8 animate-fade-in">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-2">{t('festivals.title')}</h1>
            <p className="text-base sm:text-lg text-muted-foreground">{t('festivals.subtitle')}</p>
          </div>

          <SearchFilter
            placeholder={t('festivals.searchPlaceholder')}
            categories={categories}
            onSearchChange={setSearchTerm}
            onCategoryChange={setSelectedCategory}
            onSortChange={setSortBy}
          />

          {/* Card grid: 1 col mobile, 2 col desktop */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredFestivals.map((festival, index) => {
            const timeLeft = calculateTimeLeft(festival.end_date);
            return (
              <Link key={festival.id} to={`/festivals/${festival.unique_key}`}>
                <Card
                  className="group cursor-pointer overflow-hidden border-border/50 bg-card shadow-card hover:shadow-hover transition-all duration-300 hover:-translate-y-1 animate-fade-in h-full"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="relative aspect-video overflow-hidden">
                    <DatasetImage
                      src={festival.image}
                      alt={getLocalizedValue(festival.name, currentLanguage)}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute top-3 left-3 flex gap-2">
                      <Badge className={getStatusColor(festival.event_status)}>
                        {getStatusLabel(festival.event_status)}
                      </Badge>
                      <Badge variant="outline" className="bg-background/90 text-foreground border-0">
                        <Sparkles className="h-3 w-3 mr-1" />
                        {t('festivals.badge')}
                      </Badge>
                    </div>
                    {festival.event_status === "Active" && (
                      <div className="absolute bottom-3 right-3 bg-background/95 backdrop-blur rounded-lg px-4 py-2 shadow-lg">
                        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                          <Clock className="h-4 w-4 text-primary" />
                          <span>{timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m</span>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <CardHeader>
                    <CardTitle className="text-xl group-hover:text-primary transition-colors">
                      <LocalizedText localized={festival.name} showIndicator />
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {formatDateRange(festival.start_date, festival.end_date)}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                        <Gift className="h-4 w-4 text-primary" />
                        <span>{t('festivals.rewards')}</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {festival.rewards.slice(0, 3).map((reward, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {reward}
                          </Badge>
                        ))}
                        {festival.rewards.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            {t('festivals.more').replace('{count}', (festival.rewards.length - 3).toString())}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <Button className="w-full mt-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      {t('festivals.viewDetails')}
                    </Button>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

          {filteredFestivals.length === 0 && (
            <div className="text-center py-12 sm:py-16">
              <p className="text-base sm:text-lg text-muted-foreground">{t('festivals.noResults')}</p>
            </div>
          )}
        </ResponsiveContainer>
      </main>
    </div>
  );
};

export default FestivalsPage;
