import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/shared/layouts";
import { Breadcrumb, ResponsiveContainer, DatasetImage, PaginatedGrid, ScrollToTop, UnifiedFilterUI, PageLoadingState } from "@/shared/components";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Alert, AlertDescription } from "@/shared/components/ui/alert";
import { Calendar, Gift } from "lucide-react";
import { useEvents } from "@/content/hooks";
import { useTranslation } from "@/shared/hooks/useTranslation";
import { useDocumentTitle } from "@/shared/hooks/useDocumentTitle";
import { useUnifiedFilter } from "@/shared/hooks/useUnifiedFilter";
import type { Event } from "@/content";

const ITEMS_PER_PAGE = 12;

const EventsPage = () => {
  const { t } = useTranslation();
  const { data: events = [], isLoading: loading, error, refetch } = useEvents();
  
  // Set dynamic page title (Requirements: 9.1, 9.2)
  useDocumentTitle(t('events.title'));

  // Custom search function for events
  const customSearchFn = useMemo(() => {
    return (item: Event, searchTerm: string): boolean => {
      if (!searchTerm || searchTerm.trim() === '') return true;
      const searchLower = searchTerm.toLowerCase();
      return item.title.toLowerCase().includes(searchLower) ||
        item.unique_key.toLowerCase().includes(searchLower);
    };
  }, []);

  // Custom sort functions for event-specific sorting
  const customSortFunctions = useMemo(() => ({
    'newest': (a: Event, b: Event) => 
      new Date(b.start_date).getTime() - new Date(a.start_date).getTime(),
    'ending-soon': (a: Event, b: Event) => 
      new Date(a.end_date).getTime() - new Date(b.end_date).getTime(),
    'a-z': (a: Event, b: Event) => a.title.localeCompare(b.title),
    'z-a': (a: Event, b: Event) => b.title.localeCompare(a.title),
  }), []);

  // Use unified filter hook with events preset
  const {
    state,
    handlers,
    filteredData: filteredEvents,
    activeFilterCount,
    config,
  } = useUnifiedFilter<Event>({
    preset: 'events',
    data: events,
    customSearchFn,
    customSortFunctions,
    statusField: 'event_status',
    typeField: 'type',
    defaultSort: 'newest',
  });

  const formatDate = (date: Date | string) => {
    const eventDate = date instanceof Date ? date : new Date(date);
    return eventDate.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
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
            <PageLoadingState variant="grid" columns={3} itemCount={6} />
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

          <UnifiedFilterUI
            state={state}
            handlers={handlers}
            config={config}
            activeFilterCount={activeFilterCount}
            placeholder={t('events.searchPlaceholder')}
            showResultCount={filteredEvents.length}
          />

          <PaginatedGrid
            items={filteredEvents}
            itemsPerPage={ITEMS_PER_PAGE}
            getKey={(event) => event.id}
            gridClassName="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6"
            resetDeps={[state.search, state.status, state.type, state.sort]}
            emptyState={
              <div className="text-center py-12 sm:py-16">
                <p className="text-base sm:text-lg text-muted-foreground">{t('events.noResults')}</p>
              </div>
            }
            renderItem={(event, index) => {
              return (
                <Link to={`/events/${event.unique_key}`}>
                  <Card
                    className="group cursor-pointer overflow-hidden border-border/50 bg-card shadow-card hover:shadow-hover transition-all duration-200 hover:-translate-y-0.5 h-full"
                  >
                    <div className="relative aspect-video overflow-hidden">
                      <DatasetImage
                        src={event.image}
                        alt={event.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
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
                    </div>
                    
                    <CardHeader>
                      <CardTitle className="text-xl group-hover:text-primary transition-colors">
                        {event.title}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {formatDate(event.start_date)}
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
