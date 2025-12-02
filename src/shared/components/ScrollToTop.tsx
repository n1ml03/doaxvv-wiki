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
      className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 p-2.5 sm:p-3 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-all animate-fade-in z-50"
      aria-label="Scroll to top"
    >
      <ChevronUp className="h-4 w-4 sm:h-5 sm:w-5" />
    </button>
  );
};
