import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import { Card, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { ChevronRight, BookOpen } from "lucide-react";
import { contentLoader } from "@/content";
import type { Guide } from "@/content";
import { DatasetImage } from "@/shared/components";

const ITEM_WIDTH = 350;
const GAP = 24;
const CARD_WIDTH = ITEM_WIDTH + GAP;

const PopularGuides = () => {
  const [allGuides, setAllGuides] = useState<Guide[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isScrollingRef = useRef(false);
  const rafRef = useRef<number>();

  useEffect(() => {
    async function loadContent() {
      await contentLoader.initialize();
      setAllGuides(contentLoader.getGuides().slice(0, 10));
    }
    loadContent();
  }, []);

  // Memoize looped guides to prevent recreation on every render
  const loopedGuides = useMemo(
    () => (allGuides.length > 0 ? [...allGuides, ...allGuides, ...allGuides] : []),
    [allGuides]
  );

  // Memoize total width calculation
  const totalWidth = useMemo(() => CARD_WIDTH * allGuides.length, [allGuides.length]);

  // Initialize scroll position to middle set
  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer || allGuides.length === 0) return;

    scrollContainer.scrollLeft = totalWidth; // Start at middle set
  }, [allGuides.length, totalWidth]);

  // Optimized scroll handler with RAF for smooth repositioning
  const handleScroll = useCallback(() => {
    if (isScrollingRef.current) return;
    
    const scrollContainer = scrollRef.current;
    if (!scrollContainer || allGuides.length === 0) return;

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
  }, [allGuides.length, totalWidth]);

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
    if (!scrollContainer || allGuides.length === 0) return;

    scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
    scrollContainer.addEventListener('wheel', handleWheel, { passive: false });
    
    return () => {
      scrollContainer.removeEventListener('scroll', handleScroll);
      scrollContainer.removeEventListener('wheel', handleWheel);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [allGuides.length, handleScroll, handleWheel]);

  return (
    <section className="px-4 md:px-8 mt-12 mb-16">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold text-foreground">Popular Guides</h2>
        <Link to="/guides">
          <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
            View All
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </Link>
      </div>
      <div ref={scrollRef} className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide" style={{ willChange: 'scroll-position' }}>
        {loopedGuides.map((guide, index) => {
          return (
            <Link key={`${guide.id}-${index}`} to={`/guides/${guide.unique_key}`} className="flex-shrink-0 w-[300px] md:w-[350px]">
              <Card 
                className="group cursor-pointer overflow-hidden border-border/50 bg-card shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 h-full"
              >
                <div className="aspect-video overflow-hidden relative">
                  <DatasetImage 
                    src={guide.image} 
                    alt={guide.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-4 left-4">
                    <div className="p-3 rounded-lg bg-background/90 backdrop-blur">
                      <BookOpen className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                </div>
                <CardHeader>
                  <CardTitle className="text-xl group-hover:text-primary transition-colors">
                    {guide.title}
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    {guide.summary}
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          );
        })}
      </div>
    </section>
  );
};

export default PopularGuides;
