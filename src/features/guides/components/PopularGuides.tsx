import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import { Card, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { ChevronRight, BookOpen, Compass } from "lucide-react";
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
    const cachedGuides = contentLoader.getGuides();
    if (cachedGuides.length > 0) {
      setAllGuides(cachedGuides.slice(0, 10));
    } else {
      contentLoader.loadGuides().then(guides => {
        setAllGuides(guides.slice(0, 10));
      });
    }
  }, []);

  const loopedGuides = useMemo(
    () => (allGuides.length > 0 ? [...allGuides, ...allGuides, ...allGuides] : []),
    [allGuides]
  );

  const totalWidth = useMemo(() => CARD_WIDTH * allGuides.length, [allGuides.length]);

  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer || allGuides.length === 0) return;
    scrollContainer.scrollLeft = totalWidth;
  }, [allGuides.length, totalWidth]);

  const handleScroll = useCallback(() => {
    if (isScrollingRef.current) return;
    const scrollContainer = scrollRef.current;
    if (!scrollContainer || allGuides.length === 0) return;
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
  }, [allGuides.length, totalWidth]);

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
    if (!scrollContainer || allGuides.length === 0) return;
    scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
    scrollContainer.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      scrollContainer.removeEventListener('scroll', handleScroll);
      scrollContainer.removeEventListener('wheel', handleWheel);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [allGuides.length, handleScroll, handleWheel]);

  return (
    <section className="px-4 md:px-8 mt-12 mb-16">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-stm/15 to-emerald-500/10">
            <Compass className="h-5 w-5 text-stm" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Popular Guides</h2>
        </div>
        <Link to="/guides">
          <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80 group">
            View All
            <ChevronRight className="ml-1 h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
          </Button>
        </Link>
      </div>
      
      <div ref={scrollRef} className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
        {loopedGuides.map((guide, index) => (
          <Link key={`${guide.id}-${index}`} to={`/guides/${guide.unique_key}`} className="flex-shrink-0 w-[300px] md:w-[350px]">
            <Card className="group cursor-pointer overflow-hidden border-border/50 bg-card shadow-card hover:shadow-hover transition-all duration-200 hover:-translate-y-0.5 h-full">
              <div className="aspect-video overflow-hidden relative">
                <DatasetImage 
                  src={guide.image} 
                  alt={guide.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                
                <div className="absolute bottom-4 left-4">
                  <div className="p-3 rounded-xl bg-background/90 backdrop-blur-sm border border-border/50">
                    <BookOpen className="h-5 w-5 text-stm" />
                  </div>
                </div>
                
                {guide.category && (
                  <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-stm/90">
                    <span className="text-xs font-medium text-white">{guide.category}</span>
                  </div>
                )}
              </div>
              
              <CardHeader className="relative">
                <CardTitle className="text-lg sm:text-xl group-hover:text-stm transition-colors line-clamp-1">
                  {guide.title}
                </CardTitle>
                <CardDescription className="text-muted-foreground line-clamp-2">
                  {guide.summary}
                </CardDescription>
                
                {guide.read_time && (
                  <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
                    <div className="w-1 h-1 rounded-full bg-stm" />
                    <span>{guide.read_time}</span>
                  </div>
                )}
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default PopularGuides;
