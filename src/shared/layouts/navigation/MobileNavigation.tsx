import { Link, useLocation } from "react-router-dom";
import { useEffect, useRef, memo, useCallback } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/shared/components/ui/sheet";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/shared/components/ui/accordion";
import { Button } from "@/shared/components/ui/button";
import { Menu, Home, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { NavGroup } from "@/shared/types/navigation";
import { isPathActive, isPathInSection, isGroupActive } from "@/shared/config/navigation";
import { useTranslation } from "@/shared/hooks/useTranslation";

interface MobileNavigationProps {
  groups: NavGroup[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function getAccordionContentId(groupLabel: string): string {
  return `mobile-nav-content-${groupLabel.toLowerCase().replace(/\s+/g, "-")}`;
}

/**
 * Mobile navigation with Premium Ocean & Sunset Theme
 * Features glassmorphism sheet and enhanced visual hierarchy
 */
export const MobileNavigation = memo(function MobileNavigation({
  groups,
  open,
  onOpenChange,
}: MobileNavigationProps) {
  const { t } = useTranslation();
  const location = useLocation();
  const currentPath = location.pathname;
  const announcerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (announcerRef.current) {
      announcerRef.current.textContent = open
        ? t('a11y.navOpened')
        : t('a11y.navClosed');
    }
  }, [open, t]);

  const handleLinkClick = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  return (
    <>
      <div
        ref={announcerRef}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />
      
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetTrigger asChild className="lg:hidden">
          <Button
            size="icon"
            variant="ghost"
            className={cn(
              "min-h-[44px] min-w-[44px] rounded-xl",
              "hover:bg-primary/10 hover:text-primary",
              "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2",
              "transition-all duration-200"
            )}
            aria-label={open ? t('a11y.closeNav') : t('a11y.openNav')}
            aria-expanded={open}
            aria-controls="mobile-navigation-panel"
            aria-haspopup="dialog"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </Button>
        </SheetTrigger>
        <SheetContent
          side="right"
          className={cn(
            "w-80 overflow-y-auto border-l border-border/30",
            "bg-background/95 backdrop-blur-xl backdrop-saturate-150"
          )}
          id="mobile-navigation-panel"
          role="dialog"
          aria-modal="true"
          aria-label={t('a11y.mobileNav')}
        >
          <SheetHeader className="text-left pb-2">
            <SheetTitle id="mobile-nav-title" className="flex items-center gap-2">
              <div className={cn(
                "flex h-8 w-8 items-center justify-center rounded-lg",
                "bg-gradient-to-br from-primary to-secondary/80"
              )}>
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <span className="bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
                {t('nav.title')}
              </span>
            </SheetTitle>
          </SheetHeader>

          {/* Gradient divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent mb-4" />

          <nav
            className="space-y-1"
            role="navigation"
            aria-label={t('a11y.mainNav')}
          >
            {/* Home link - Premium style */}
            <Link
              to="/"
              onClick={(e) => {
                if (currentPath === "/") {
                  e.preventDefault();
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                  window.location.reload();
                } else {
                  handleLinkClick();
                }
              }}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium",
                "min-h-[48px] transition-all duration-200",
                "hover:bg-primary/10",
                "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2",
                currentPath === "/"
                  ? "bg-gradient-to-r from-primary/15 to-secondary/10 text-primary"
                  : "text-foreground hover:text-primary"
              )}
              aria-current={currentPath === "/" ? "page" : undefined}
            >
              <div className={cn(
                "flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-200",
                currentPath === "/"
                  ? "bg-gradient-to-br from-primary to-primary/80 text-white shadow-md shadow-primary/20"
                  : "bg-muted/80 text-muted-foreground group-hover:bg-primary/15 group-hover:text-primary"
              )}>
                <Home className="h-4 w-4" aria-hidden="true" />
              </div>
              {t('nav.home')}
            </Link>

            {/* Navigation groups with accordion */}
            <Accordion
              type="multiple"
              defaultValue={groups
                .filter((g) => isGroupActive(currentPath, g))
                .map((g) => g.label)}
              className="mt-2 space-y-1"
            >
              {groups.map((group) => {
                const groupIsActive = isGroupActive(currentPath, group);
                const GroupIcon = group.icon;
                const contentId = getAccordionContentId(group.label);

                return (
                  <AccordionItem
                    key={group.label}
                    value={group.label}
                    className="border-0"
                  >
                    <AccordionTrigger
                      className={cn(
                        "px-3 py-3 min-h-[48px] rounded-xl",
                        "hover:no-underline hover:bg-primary/10",
                        "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2",
                        "transition-all duration-200",
                        "[&[data-state=open]]:bg-muted/50",
                        groupIsActive && "text-primary font-semibold"
                      )}
                      aria-controls={contentId}
                    >
                      <span className="flex items-center gap-3">
                        <div className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-200",
                          groupIsActive
                            ? "bg-gradient-to-br from-primary/20 to-secondary/15 text-primary"
                            : "bg-muted/80 text-muted-foreground"
                        )}>
                          <GroupIcon className="h-4 w-4" aria-hidden="true" />
                        </div>
                        <span>{group.label}</span>
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="pb-1 pt-1" id={contentId}>
                      <ul className="ml-2 space-y-0.5 border-l-2 border-border/50 pl-2" role="list">
                        {group.items.map((item) => {
                          const itemIsActive = isPathActive(currentPath, item.path);
                          const itemIsInSection = isPathInSection(currentPath, item.path);
                          const ItemIcon = item.icon;

                          return (
                            <li key={item.path}>
                              <Link
                                to={item.path}
                                onClick={(e) => {
                                  if (itemIsActive) {
                                    e.preventDefault();
                                    onOpenChange(false);
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                    window.location.reload();
                                  } else {
                                    handleLinkClick();
                                  }
                                }}
                                className={cn(
                                  "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm",
                                  "min-h-[44px] transition-all duration-200",
                                  "hover:bg-primary/10",
                                  "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2",
                                  itemIsInSection
                                    ? "bg-primary/10 text-primary font-medium"
                                    : "text-muted-foreground hover:text-primary"
                                )}
                                aria-current={itemIsActive ? "page" : undefined}
                              >
                                {ItemIcon && (
                                  <ItemIcon className={cn(
                                    "h-4 w-4 transition-colors duration-200",
                                    itemIsInSection ? "text-primary" : "group-hover:text-primary"
                                  )} aria-hidden="true" />
                                )}
                                {item.label}
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </nav>
        </SheetContent>
      </Sheet>
    </>
  );
});
