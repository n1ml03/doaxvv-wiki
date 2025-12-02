import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/shared/layouts";
import { Breadcrumb, SearchFilter, ResponsiveContainer, DatasetImage, PaginatedGrid, ScrollToTop } from "@/shared/components";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Alert, AlertDescription } from "@/shared/components/ui/alert";
import { Clock, Gift } from "lucide-react";
import { useEvents } from "@/content/hooks";
import { useTranslation } from "@/shared/hooks/useTranslation";
import { useDocumentTitle } from "@/shared/hooks/useDocumentTitle";

const ITEMS_PER_PAGE = 12;

const EventsPage = () => {
  const { t } = useTranslation();
  const { data: events = [], isLoading: loading, error, refetch } = useEvents();
  
  // Set dynamic page title (Requirements: 9.1, 9.2)
  useDocumentTitle(t('events.title'));
  const [time, setTime] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState("newest");

  const categories = [
    { value: "Match", label: t('eventType.match') },
    { value: "Festival", label: t('eventType.festival') },
    { value: "Ranking", label: t('eventType.ranking') },
  ];

  const filteredEvents = useMemo(() => {
    let result = events.filter(event => {
      const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = selectedCategory === "All" || event.type === selectedCategory;
      return matchesSearch && matchesType;
    });

    switch (sortBy) {
      case "a-z":
        result = [...result].sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "z-a":
        result = [...result].sort((a, b) => b.title.localeCompare(a.title));
        break;
      default:
        break;
    }

    return result;
  }, [searchTerm, selectedCategory, sortBy, events]);


  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const calculateTimeLeft = (endDate: Date | string) => {
    const eventDate = endDate instanceof Date ? endDate : new Date(endDate);
    const difference = eventDate.getTime() - time.getTime();
    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((difference / 1000 / 60) % 60);
    return { days, hours, minutes };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active": return "bg-accent text-accent-foreground";
      case "Upcoming": return "bg-secondary text-secondary-foreground";
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
              <p className="text-lg text-muted-foreground">{t('events.loading')}</p>
            </div>
          </ResponsiveContainer>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main id="main-content" className="py-6 sm:py-8" tabIndex={-1}>
          <ResponsiveContainer>
            <div className="py-16">
              <Alert variant="destructive">
                <AlertDescription>
                  {t('events.error')}: {error.message}
                </AlertDescription>
              </Alert>
              <div className="text-center mt-4">
                <Button onClick={() => refetch()}>{t('events.retry')}</Button>
              </div>
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
          <Breadcrumb items={[{ label: t('nav.events') }]} />

          <div className="mb-6 sm:mb-8 animate-fade-in">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-2">{t('events.title')}</h1>
            <p className="text-base sm:text-lg text-muted-foreground">{t('events.subtitle')}</p>
          </div>

          <SearchFilter
            placeholder={t('events.searchPlaceholder')}
            categories={categories}
            onSearchChange={setSearchTerm}
            onCategoryChange={setSelectedCategory}
            onSortChange={setSortBy}
          />

          <PaginatedGrid
            items={filteredEvents}
            itemsPerPage={ITEMS_PER_PAGE}
            getKey={(event) => event.id}
            gridClassName="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6"
            resetDeps={[searchTerm, selectedCategory, sortBy]}
            emptyState={
              <div className="text-center py-12 sm:py-16">
                <p className="text-base sm:text-lg text-muted-foreground">{t('events.noResults')}</p>
              </div>
            }
            renderItem={(event, index) => {
              const timeLeft = calculateTimeLeft(event.end_date);
              return (
                <Link to={`/events/${event.unique_key}`}>
                  <Card
                    className="group cursor-pointer overflow-hidden border-border/50 bg-card shadow-card hover:shadow-hover transition-all duration-300 hover:-translate-y-1 animate-fade-in h-full"
                    style={{ animationDelay: `${Math.min(index, 8) * 0.03}s` }}
                  >
                    <div className="relative aspect-video overflow-hidden">
                      <DatasetImage
                        src={event.image}
                        alt={event.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute top-3 left-3 flex gap-2">
                        <Badge className={getStatusColor(event.event_status)}>
                          {t(`status.${event.event_status.toLowerCase()}`)}
                        </Badge>
                        <Badge variant="outline" className="bg-background/90 text-foreground border-0">
                          {t(`eventType.${event.type.toLowerCase()}`)}
                        </Badge>
                      </div>
                      {event.event_status === "Active" && (
                        <div className="absolute bottom-3 right-3 bg-background/95 backdrop-blur rounded-lg px-4 py-2 shadow-lg">
                          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                            <Clock className="h-4 w-4 text-primary" />
                            <span>
                              {t('events.endsIn')
                                .replace('{days}', timeLeft.days.toString())
                                .replace('{hours}', timeLeft.hours.toString())
                              }
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <CardHeader>
                      <CardTitle className="text-xl group-hover:text-primary transition-colors">
                        {event.title}
                      </CardTitle>
                      <CardDescription>
                        {event.event_status === "Active" 
                          ? t('events.endsIn')
                              .replace('{days}', timeLeft.days.toString())
                              .replace('{hours}', timeLeft.hours.toString())
                          : t('events.comingSoon')}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                          <Gift className="h-4 w-4 text-primary" />
                          <span>{t('events.rewards')}</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {event.rewards.slice(0, 3).map((reward, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {reward}
                            </Badge>
                          ))}
                          {event.rewards.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              {t('events.more').replace('{count}', (event.rewards.length - 3).toString())}
                            </Badge>
                          )}
                        </div>
                      </div>

                      <Button className="w-full mt-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        {t('events.viewDetails')}
                      </Button>
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

export default EventsPage;
