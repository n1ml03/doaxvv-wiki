import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Header } from "@/shared/layouts";
import { Breadcrumb, LocalizedText, ResponsiveContainer, DatasetImage, UniqueKeyDisplay, ScrollToTop } from "@/shared/components";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Clock, Gift, Lightbulb, CheckCircle, Calendar, Sparkles } from "lucide-react";
import { contentLoader } from "@/content";
import type { Event } from "@/content";
import { useLanguage } from "@/shared/contexts/language-hooks";
import { getLocalizedValue } from "@/shared/utils/localization";

import { useTranslation } from "@/shared/hooks/useTranslation";

const FestivalDetailPage = () => {
  const { unique_key } = useParams<{ unique_key: string }>();
  const [festival, setFestival] = useState<Event | null>(null);
  const [relatedFestivals, setRelatedFestivals] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [time, setTime] = useState(new Date());
  const { currentLanguage } = useLanguage();
  const { t } = useTranslation();

  useEffect(() => {
    async function loadContent() {
      await contentLoader.initialize();
      const foundEvent = contentLoader.getEventByUniqueKey(unique_key || "");
      // Only set if it's a Festival type
      if (foundEvent && foundEvent.type === "Festival") {
        setFestival(foundEvent);
        // Get other festivals for related section
        const allEvents = contentLoader.getEvents();
        const otherFestivals = allEvents
          .filter(e => e.type === "Festival" && e.id !== foundEvent.id)
          .slice(0, 3);
        setRelatedFestivals(otherFestivals);
      }
      setLoading(false);
    }
    loadContent();
  }, [unique_key]);

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
    const seconds = Math.floor((difference / 1000) % 60);
    return { days, hours, minutes, seconds };
  };


  const formatDateRange = (startDate: string | Date, endDate: string | Date) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main id="main-content" className="py-6 sm:py-8" tabIndex={-1}>
          <ResponsiveContainer>
            <div className="text-center py-16">
              <p className="text-lg text-muted-foreground">{t('festivalDetail.loading')}</p>
            </div>
          </ResponsiveContainer>
        </main>
      </div>
    );
  }

  if (!festival) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main id="main-content" className="py-6 sm:py-8" tabIndex={-1}>
          <ResponsiveContainer>
            <div className="text-center py-16">
              <h1 className="text-2xl font-bold text-foreground mb-4">{t('festivalDetail.notFound')}</h1>
              <Link to="/festivals">
                <Button>{t('festivalDetail.backToFestivals')}</Button>
              </Link>
            </div>
          </ResponsiveContainer>
        </main>
      </div>
    );
  }

  const timeLeft = calculateTimeLeft(festival.end_date);

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
          <Breadcrumb 
            items={[
              { label: t('nav.festivals'), href: "/festivals" }, 
              { label: getLocalizedValue(festival.name, currentLanguage) }
            ]} 
          />

          <div className="animate-fade-in">
            {/* Hero Banner */}
            <div className="relative aspect-[21/9] rounded-xl sm:rounded-2xl overflow-hidden mb-6 sm:mb-8">
            <DatasetImage
              src={festival.image}
              alt={getLocalizedValue(festival.name, currentLanguage)}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-8">
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge className={getStatusColor(festival.event_status)}>{t(`status.${festival.event_status.toLowerCase().replace(" ", "")}`)}</Badge>
                <Badge variant="outline" className="bg-background/90 text-foreground border-0">
                  <Sparkles className="h-3 w-3 mr-1" />
                  {t('gachaType.festival')}
                </Badge>
              </div>
              <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">
                <LocalizedText localized={festival.name} showIndicator />
              </h1>
              
              {festival.event_status === "Active" && (
                <div className="flex flex-wrap gap-4">
                  <div className="bg-background/95 backdrop-blur rounded-lg px-4 py-2 shadow-lg">
                    <div className="text-xs text-muted-foreground mb-1">{t('festivalDetail.timeRemaining')}</div>
                    <div className="flex items-center gap-3 text-lg font-bold text-foreground">
                      <Clock className="h-5 w-5 text-primary" />
                      <span>{timeLeft.days}d</span>
                      <span>{timeLeft.hours}h</span>
                      <span>{timeLeft.minutes}m</span>
                      <span>{timeLeft.seconds}s</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Description */}
              <Card className="border-border/50 bg-card shadow-card">
                <CardHeader>
                  <CardTitle>{t('festivalDetail.about')}</CardTitle>
                </CardHeader>
                <CardContent>
                  {festival.description ? (
                    <p className="text-muted-foreground leading-relaxed">
                      <LocalizedText localized={festival.description} />
                    </p>
                  ) : (
                    <p className="text-muted-foreground leading-relaxed">{festival.summary}</p>
                  )}
                </CardContent>
              </Card>

              {/* How to Participate */}
              <Card className="border-border/50 bg-card shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-primary" />
                    {t('festivalDetail.howToParticipate')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {festival.how_to_participate.map((step, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium flex-shrink-0">
                          {index + 1}
                        </span>
                        <span className="text-muted-foreground">{step}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Tips */}
              <Card className="border-border/50 bg-card shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-primary" />
                    {t('festivalDetail.tips')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {festival.tips.map((tip, index) => (
                      <li key={index} className="flex items-start gap-2 text-muted-foreground">
                        <span className="text-primary">•</span>
                        {tip}
                      </li>
                    ))}
                  </ul>
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
                    {t('festivalDetail.rewards')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {festival.rewards.map((reward, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                        <div className="h-2 w-2 rounded-full bg-primary" />
                        <span className="text-sm text-foreground">{reward}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Festival Schedule */}
              <Card className="border-border/50 bg-card shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    {t('festivalDetail.schedule')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t('festivalDetail.duration')}</span>
                    <span className="font-medium">{formatDateRange(festival.start_date, festival.end_date)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t('festivalDetail.endDate')}</span>
                    <span className="font-medium">{new Date(festival.end_date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t('festivalDetail.status')}</span>
                    <Badge className={getStatusColor(festival.event_status)}>{t(`status.${festival.event_status.toLowerCase().replace(" ", "")}`)}</Badge>
                  </div>
                  <UniqueKeyDisplay uniqueKey={festival.unique_key} />
                </CardContent>
              </Card>
            </div>
          </div>


            {/* Related Festivals */}
            {relatedFestivals.length > 0 && (
              <section className="mt-8 sm:mt-12">
                <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-4 sm:mb-6">{t('festivalDetail.relatedFestivals')}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {relatedFestivals.map((relatedFestival) => (
                    <Link key={relatedFestival.id} to={`/festivals/${relatedFestival.unique_key}`}>
                      <Card className="group cursor-pointer overflow-hidden border-border/50 bg-card shadow-card hover:shadow-hover transition-all duration-300 hover:-translate-y-1">
                        <div className="relative aspect-video overflow-hidden">
                          <DatasetImage
                            src={relatedFestival.image}
                            alt={getLocalizedValue(relatedFestival.name, currentLanguage)}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                          />
                          <Badge className={`absolute top-2 right-2 ${getStatusColor(relatedFestival.event_status)}`}>
                            {t(`status.${relatedFestival.event_status.toLowerCase().replace(" ", "")}`)}
                          </Badge>
                        </div>
                        <CardContent className="p-3 sm:p-4">
                          <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors text-sm sm:text-base">
                            <LocalizedText localized={relatedFestival.name} />
                          </h3>
                          <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1">
                            <Sparkles className="h-3 w-3" />
                            {t('gachaType.festival')}
                          </p>
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

export default FestivalDetailPage;
