import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Calendar, Sparkles, BookOpen, ChevronRight, Zap } from "lucide-react";
import { contentLoader } from "@/content";
import type { Event, Guide, Swimsuit } from "@/content";
import { useTranslation } from "@/shared/hooks/useTranslation";

function getDateTimestamp(date: Date | string | undefined): number {
  if (!date) return 0;
  if (date instanceof Date) return date.getTime();
  const parsed = new Date(date);
  return isNaN(parsed.getTime()) ? 0 : parsed.getTime();
}

const BADGE_STYLES = {
  event: { gradient: "from-primary to-cyan-400", bg: "bg-primary/10", text: "text-primary" },
  swimsuit: { gradient: "from-secondary to-pink-400", bg: "bg-secondary/10", text: "text-secondary" },
  guide: { gradient: "from-stm to-emerald-400", bg: "bg-stm/10", text: "text-stm" },
};

const WhatsNew = () => {
  const { t } = useTranslation();
  const [events, setEvents] = useState<Event[]>([]);
  const [guides, setGuides] = useState<Guide[]>([]);
  const [swimsuits, setSwimsuits] = useState<Swimsuit[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadContent() {
      setIsLoading(true);
      await contentLoader.initialize();
      setEvents(contentLoader.getEvents());
      setGuides(contentLoader.getGuides());
      setSwimsuits(contentLoader.getSwimsuits());
      setIsLoading(false);
    }
    loadContent();
  }, []);

  const latestEvent = useMemo(() => {
    if (events.length === 0) return null;
    return [...events].sort((a, b) => {
      const dateA = getDateTimestamp(a.start_date) || getDateTimestamp(a.updated_at);
      const dateB = getDateTimestamp(b.start_date) || getDateTimestamp(b.updated_at);
      return dateB - dateA;
    })[0];
  }, [events]);

  const latestGuide = useMemo(() => {
    if (guides.length === 0) return null;
    return [...guides].sort((a, b) => {
      const dateA = getDateTimestamp(a.updated_at);
      const dateB = getDateTimestamp(b.updated_at);
      return dateB - dateA;
    })[0];
  }, [guides]);

  const latestSwimsuit = useMemo(() => {
    if (swimsuits.length === 0) return null;
    return [...swimsuits].sort((a, b) => {
      const dateA = getDateTimestamp(a.updated_at);
      const dateB = getDateTimestamp(b.updated_at);
      return dateB - dateA;
    })[0];
  }, [swimsuits]);

  const updates = useMemo(() => {
    const items = [];
    if (latestEvent) {
      items.push({
        icon: Calendar,
        title: latestEvent.title,
        description: latestEvent.type,
        image: latestEvent.image,
        link: `/events/${latestEvent.unique_key}`,
        badge: t('home.whatsNew.event'),
        type: 'event' as const
      });
    }
    if (latestSwimsuit) {
      items.push({
        icon: Sparkles,
        title: latestSwimsuit.title,
        description: `${latestSwimsuit.rarity} - ${latestSwimsuit.character}`,
        image: latestSwimsuit.image,
        link: `/swimsuits/${latestSwimsuit.unique_key}`,
        badge: t('home.whatsNew.swimsuit'),
        type: 'swimsuit' as const
      });
    }
    if (latestGuide) {
      items.push({
        icon: BookOpen,
        title: latestGuide.title,
        description: `${latestGuide.category} • ${latestGuide.read_time}`,
        image: latestGuide.image,
        link: `/guides/${latestGuide.unique_key}`,
        badge: t('home.whatsNew.guide'),
        type: 'guide' as const
      });
    }
    return items;
  }, [latestEvent, latestSwimsuit, latestGuide, t]);

  if (isLoading) {
    return (
      <section>
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/15 to-secondary/10">
            <Zap className="h-5 w-5 text-primary" />
          </div>
          <h2 className="text-xl font-bold text-foreground">{t('home.whatsNew.title')}</h2>
        </div>
        <div className="grid grid-cols-1 gap-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="overflow-hidden border-border/50 bg-card">
              <div className="flex gap-4 p-4">
                <div className="w-20 h-20 rounded-xl bg-muted animate-pulse" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-4 bg-muted rounded animate-pulse w-1/4" />
                  <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
                  <div className="h-3 bg-muted rounded animate-pulse w-1/2" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>
    );
  }

  if (updates.length === 0) return null;

  return (
    <section>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/15 to-secondary/10">
            <Zap className="h-5 w-5 text-primary" />
          </div>
          <h2 className="text-xl font-bold text-foreground">{t('home.whatsNew.title')}</h2>
        </div>
        <Link to="/events">
          <Button variant="ghost" size="sm" className="gap-1 text-xs group">
            {t('home.viewAll')}
            <ChevronRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
          </Button>
        </Link>
      </div>
      
      <div className="grid grid-cols-1 gap-3">
        {updates.map((update, index) => {
          const Icon = update.icon;
          const style = BADGE_STYLES[update.type];
          
          return (
            <Link key={index} to={update.link}>
              <Card className="group cursor-pointer overflow-hidden border-border/50 bg-card shadow-card hover:shadow-hover transition-all duration-200 hover:-translate-y-0.5">
                <div className="relative flex gap-4 p-4">
                  <div className="relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
                    <img 
                      src={update.image} 
                      alt={update.title}
                      className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                  
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className={`p-1.5 rounded-lg ${style.bg}`}>
                        <Icon className={`h-3.5 w-3.5 ${style.text}`} />
                      </div>
                      <span className={`text-xs font-medium ${style.text}`}>{update.badge}</span>
                    </div>
                    
                    <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1 mb-1">
                      {update.title}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {update.description}
                    </p>
                  </div>
                  
                  <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <ChevronRight className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </section>
  );
};

export default WhatsNew;
