import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import { Card, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Clock, ChevronRight, Flame } from "lucide-react";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { contentLoader } from "@/content";
import type { Event } from "@/content";
import { DatasetImage } from "@/shared/components";

const ITEM_WIDTH = 350;
const GAP = 24;
const CARD_WIDTH = ITEM_WIDTH + GAP;

const CurrentEvents = () => {
  const [time, setTime] = useState(new Date());
  const [events, setEvents] = useState<Event[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isScrollingRef = useRef(false);
  const rafRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const cachedEvents = contentLoader.getEvents();
    if (cachedEvents.length > 0) {
      setEvents(cachedEvents.filter(e => e.event_status === "Active").slice(0, 10));
    } else {
      contentLoader.loadEvents().then(allEvents => {
        setEvents(allEvents.filter(e => e.event_status === "Active").slice(0, 10));
      });
    }
  }, []);

  const loopedEvents = useMemo(
    () => (events.length > 0 ? [...events, ...events, ...events] : []),
    [events]
  );

  const totalWidth = useMemo(() => CARD_WIDTH * events.length, [events.length]);

  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer || events.length === 0) return;
    scrollContainer.scrollLeft = totalWidth;
  }, [events.length, totalWidth]);

  const handleScroll = useCallback(() => {
    if (isScrollingRef.current) return;
    const scrollContainer = scrollRef.current;
    if (!scrollContainer || events.length === 0) return;
    const { scrollLeft } = scrollContainer;

    if (scrollLeft >= totalWidth * 2) {
      isScrollingRef.current = true;
      rafRef.current = requestAnimationFrame(() => {
        scrollContainer.scrollLeft = scrollLeft - totalWidth;
        isScrollingRef.current = false;
      });
    } else if (scrollLeft <= 0) {
      isScrollingRef.current = true;
      rafRef.current = requestAnimationFrame(() => {
        scrollContainer.scrollLeft = scrollLeft + totalWidth;
        isScrollingRef.current = false;
      });
    }
  }, [events.length, totalWidth]);

  const handleWheel = useCallback((e: WheelEvent) => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      e.preventDefault();
      scrollContainer.scrollLeft += e.deltaY;
    }
  }, []);

  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer || events.length === 0) return;
    scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
    scrollContainer.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      scrollContainer.removeEventListener('scroll', handleScroll);
      scrollContainer.removeEventListener('wheel', handleWheel);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [events.length, handleScroll, handleWheel]);

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
    return `${days}d ${hours}h ${minutes}m`;
  };

  return (
    <section className="px-4 md:px-8 mt-12">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-ssr/15 to-cyan-500/10">
            <Flame className="h-5 w-5 text-ssr" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Current Events</h2>
        </div>
        <Link to="/events">
          <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80 group">
            View All
            <ChevronRight className="ml-1 h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
          </Button>
        </Link>
      </div>
      
      <div ref={scrollRef} className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
        {loopedEvents.map((event, index) => (
          <Link key={`${event.id}-${index}`} to={`/events/${event.unique_key}`} className="flex-shrink-0 w-[300px] md:w-[350px]">
            <Card className="group cursor-pointer overflow-hidden border-border/50 bg-card shadow-card hover:shadow-hover transition-all duration-200 hover:-translate-y-0.5 h-full">
              <div className="aspect-video overflow-hidden relative">
                <DatasetImage 
                  src={event.image} 
                  alt={event.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                
                <Badge className="absolute top-3 right-3 bg-background/90 backdrop-blur-sm text-foreground border border-border/50">
                  {event.type}
                </Badge>
                
                <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2 py-1 rounded-full bg-green-500/90">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  <span className="text-xs font-medium text-white">Live</span>
                </div>
              </div>
              
              <CardHeader className="relative">
                <CardTitle className="text-lg sm:text-xl group-hover:text-primary transition-colors line-clamp-1">
                  {event.title}
                </CardTitle>
                <CardDescription className="flex items-center gap-2 text-muted-foreground">
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-destructive/10">
                    <Clock className="h-3.5 w-3.5 text-destructive" />
                    <span className="text-xs font-medium text-destructive">Ends: {event.end_date.toLocaleDateString()}</span>
                  </div>
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default CurrentEvents;
