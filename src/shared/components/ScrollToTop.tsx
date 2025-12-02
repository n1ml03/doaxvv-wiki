import { useState, useEffect } from "react";
import { ChevronUp } from "lucide-react";

interface ScrollToTopProps {
  threshold?: number;
}

export const ScrollToTop = ({ threshold = 400 }: ScrollToTopProps) => {
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > threshold);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [threshold]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (!showScrollTop) return null;

  return (
    <button
      onClick={scrollToTop}
      className="fixed bottom-6 right-4 sm:bottom-8 sm:right-6 md:bottom-8 md:right-8 p-3 sm:p-3.5 md:p-4 rounded-full bg-primary/90 backdrop-blur-sm text-primary-foreground shadow-xl hover:bg-primary hover:scale-105 active:scale-95 transition-all duration-200 animate-fade-in z-50 border border-primary-foreground/10"
      aria-label="Scroll to top"
    >
      <ChevronUp className="h-5 w-5 sm:h-6 sm:w-6 md:h-6 md:w-6" />
    </button>
  );
};
