import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import { Card, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Clock, ChevronRight } from "lucide-react";
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
  const rafRef = useRef<number>();

  useEffect(() => {
    // Try to use cached data first, then load if needed
    const cachedEvents = contentLoader.getEvents();
    if (cachedEvents.length > 0) {
      setEvents(cachedEvents.filter(e => e.event_status === "Active").slice(0, 10));
    } else {
      // Load events if not cached
      contentLoader.loadEvents().then(allEvents => {
        setEvents(allEvents.filter(e => e.event_status === "Active").slice(0, 10));
      });
    }
  }, []);

  // Memoize looped events to prevent recreation on every render
  const loopedEvents = useMemo(
    () => (events.length > 0 ? [...events, ...events, ...events] : []),
    [events]
  );

  // Memoize total width calculation
  const totalWidth = useMemo(() => CARD_WIDTH * events.length, [events.length]);

  // Initialize scroll position to middle set
  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer || events.length === 0) return;

    scrollContainer.scrollLeft = totalWidth; // Start at middle set
  }, [events.length, totalWidth]);

  // Optimized scroll handler with RAF for smooth repositioning
  const handleScroll = useCallback(() => {
    if (isScrollingRef.current) return;
    
    const scrollContainer = scrollRef.current;
    if (!scrollContainer || events.length === 0) return;

    const { scrollLeft } = scrollContainer;

    // Loop back to middle when reaching the end
    if (scrollLeft >= totalWidth * 2) {
      isScrollingRef.current = true;
      rafRef.current = requestAnimationFrame(() => {
        scrollContainer.scrollLeft = scrollLeft - totalWidth;
        isScrollingRef.current = false;
      });
    }
    // Loop to middle when scrolling before start
    else if (scrollLeft <= 0) {
      isScrollingRef.current = true;
      rafRef.current = requestAnimationFrame(() => {
        scrollContainer.scrollLeft = scrollLeft + totalWidth;
        isScrollingRef.current = false;
      });
    }
  }, [events.length, totalWidth]);

  // Handle vertical mouse wheel to scroll horizontally
  const handleWheel = useCallback((e: WheelEvent) => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;
    
    // Only handle vertical scroll (deltaY) and convert to horizontal
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      e.preventDefault();
      scrollContainer.scrollLeft += e.deltaY;
    }
  }, []);

  // Infinite scroll loop handler with passive listener
  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer || events.length === 0) return;

    scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
    scrollContainer.addEventListener('wheel', handleWheel, { passive: false });
    
    return () => {
      scrollContainer.removeEventListener('scroll', handleScroll);
      scrollContainer.removeEventListener('wheel', handleWheel);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
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
        <h2 className="text-3xl font-bold text-foreground">Current Events</h2>
        <Link to="/events">
          <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
            View All
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </Link>
      </div>
      <div ref={scrollRef} className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide" style={{ willChange: 'scroll-position' }}>
        {loopedEvents.map((event, index) => (
          <Link key={`${event.id}-${index}`} to={`/events/${event.unique_key}`} className="flex-shrink-0 w-[300px] md:w-[350px]">
            <Card 
              className="group cursor-pointer overflow-hidden border-border/50 bg-card shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 h-full"
            >
              <div className="aspect-video overflow-hidden relative">
                <DatasetImage 
                  src={event.image} 
                  alt={event.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
                <Badge className="absolute top-3 right-3 bg-accent text-accent-foreground">
                  {event.type}
                </Badge>
              </div>
              <CardHeader>
                <CardTitle className="text-xl group-hover:text-primary transition-colors">
                  {event.title}
                </CardTitle>
                <CardDescription className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  Ends in {calculateTimeLeft(event.end_date)}
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
