import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Header } from "@/shared/layouts";
import { Breadcrumb, LocalizedText, ResponsiveContainer, DatasetImage, UniqueKeyDisplay, ScrollToTop } from "@/shared/components";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Clock, Gift, Lightbulb, CheckCircle, Calendar, Info, Target, Sparkles } from "lucide-react";
import { contentLoader } from "@/content";
import type { Event } from "@/content";
import { getLocalizedValue } from "@/shared/utils/localization";
import { RelatedContent } from "@/shared/components";
import { useTranslation } from "@/shared/hooks/useTranslation";
import { useLanguage } from "@/shared/contexts/language-hooks";

const EventDetailPage = () => {
  const { t } = useTranslation();
  const { unique_key } = useParams<{ unique_key: string }>();
  const { currentLanguage } = useLanguage();
  const [event, setEvent] = useState<Event | null>(null);
  const [otherEvents, setOtherEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    async function loadContent() {
      await contentLoader.initialize();
      const foundEvent = contentLoader.getEventByUniqueKey(unique_key || "");
      setEvent(foundEvent || null);
      const allEvents = contentLoader.getEvents();
      setOtherEvents(allEvents.filter(e => e.id !== foundEvent?.id).slice(0, 3));
      setLoading(false);
    }
    loadContent();
  }, [unique_key]);

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
    const seconds = Math.floor((difference / 1000) % 60);
    return { days, hours, minutes, seconds };
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main id="main-content" className="py-6 sm:py-8" tabIndex={-1}>
          <ResponsiveContainer>
            <div className="text-center py-16">
              <p className="text-lg text-muted-foreground">{t('eventDetail.loading')}</p>
            </div>
          </ResponsiveContainer>
        </main>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main id="main-content" className="py-6 sm:py-8" tabIndex={-1}>
          <ResponsiveContainer>
            <div className="text-center py-16">
              <h1 className="text-2xl font-bold text-foreground mb-4">{t('eventDetail.notFound')}</h1>
              <Link to="/events">
                <Button>{t('eventDetail.backToEvents')}</Button>
              </Link>
            </div>
          </ResponsiveContainer>
        </main>
      </div>
    );
  }

  const timeLeft = calculateTimeLeft(event.end_date);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active": return "bg-accent text-accent-foreground";
      case "Upcoming": return "bg-secondary text-secondary-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main id="main-content" className="py-6 sm:py-8" tabIndex={-1}>
        <ResponsiveContainer>
          <Breadcrumb items={[{ label: t('nav.events'), href: "/events" }, { label: getLocalizedValue(event.name, currentLanguage) }]} />

          <div className="animate-fade-in">
            {/* Hero Banner */}
            <div className="relative aspect-[21/9] sm:aspect-[21/9] rounded-xl sm:rounded-2xl overflow-hidden mb-6 sm:mb-8">
            <DatasetImage
              src={event.image}
              alt={event.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-8">
                <div className="flex flex-wrap gap-2 mb-3 sm:mb-4">
                  <Badge className={getStatusColor(event.event_status)}>{t(`status.${event.event_status.toLowerCase()}`)}</Badge>
                  <Badge variant="outline" className="bg-background/90 text-foreground border-0">{t(`filters.${event.type.toLowerCase()}`)}</Badge>
                </div>
                <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold text-white mb-2 sm:mb-4">
                  <LocalizedText localized={event.name} showIndicator />
                </h1>
                
                {event.event_status === "Active" && (
                  <div className="flex flex-wrap gap-2 sm:gap-4">
                    <div className="bg-background/95 backdrop-blur rounded-lg px-3 sm:px-4 py-1.5 sm:py-2 shadow-lg">
                      <div className="text-[10px] sm:text-xs text-muted-foreground mb-0.5 sm:mb-1">{t('eventDetail.timeRemaining')}</div>
                      <div className="flex items-center gap-1.5 sm:gap-3 text-sm sm:text-lg font-bold text-foreground">
                        <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                        <span>{timeLeft.days}d</span>
                        <span>{timeLeft.hours}h</span>
                        <span>{timeLeft.minutes}m</span>
                        <span className="hidden sm:inline">{timeLeft.seconds}s</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>


            {/* Main content grid - sidebar stacks below on mobile */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                {/* About Section */}
                <Card className="border-border/50 bg-card shadow-card">
                  <CardHeader>
                    <CardTitle className="text-xl flex items-center gap-2">
                      <Info className="h-5 w-5 text-primary" />
                      {t('eventDetail.about')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-muted-foreground leading-relaxed">
                      <LocalizedText localized={event.description} />
                    </p>
                    
                    <div className="mt-6">
                      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                        <Target className="h-4 w-4 text-primary" />
                        {t('eventDetail.howToParticipate')}
                      </h3>
                      <ul className="space-y-2">
                        {event.how_to_participate.map((step, index) => (
                          <li key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-bold">
                              {index + 1}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {step}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mt-6">
                      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-primary" />
                        {t('eventDetail.tips')}
                      </h3>
                      <div className="grid gap-3">
                        {event.tips.map((tip, index) => (
                          <div key={index} className="p-3 rounded-lg bg-accent/5 border border-accent/20">
                            <p className="text-sm text-muted-foreground">
                              {tip}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Rewards */}
                <Card className="border-border/50 bg-card shadow-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Gift className="h-5 w-5 text-primary" />
                      {t('eventDetail.rewards')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {event.rewards.map((reward, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                          <div className="h-2 w-2 rounded-full bg-primary" />
                          <span className="text-sm text-foreground">{reward}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Event Schedule */}
                <Card className="border-border/50 bg-card shadow-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-primary" />
                      {t('eventDetail.schedule')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-1">
                      <div className="text-sm text-muted-foreground">{t('eventDetail.endDate')}</div>
                      <div className="font-medium">
                        {new Date(event.end_date).toLocaleDateString(undefined, { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-sm text-muted-foreground">{t('eventDetail.status')}</div>
                      <Badge variant={event.event_status === "Active" ? "default" : "secondary"}>
                        {t(`status.${event.event_status.toLowerCase()}`)}
                      </Badge>
                    </div>
                    <UniqueKeyDisplay uniqueKey={event.unique_key} />
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Related Events */}
            <RelatedContent
              title={t('eventDetail.otherEvents')}
              items={otherEvents.map(evt => ({
                id: evt.id,
                title: getLocalizedValue(evt.name, currentLanguage),
                image: evt.image,
                href: `/events/${evt.unique_key}`,
                badge: evt.event_status,
                description: getLocalizedValue(evt.description, currentLanguage),
              }))}
              viewAllHref="/events"
              viewAllLabel={t('eventDetail.backToEvents')}
            />
          </div>

          <ScrollToTop />
        </ResponsiveContainer>
      </main>
    </div>
  );
};

export default EventDetailPage;
