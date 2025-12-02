import { Link, useLocation } from "react-router-dom";
import { useEffect, useRef } from "react";
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
import { Menu, Home } from "lucide-react";
import { cn } from "@/lib/utils";
import { NavGroup } from "@/shared/types/navigation";
import { isPathActive, isGroupActive } from "@/shared/config/navigation";
import { useTranslation } from "@/shared/hooks/useTranslation";

interface MobileNavigationProps {
  groups: NavGroup[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Helper to generate consistent IDs for ARIA relationships
 */
function getAccordionContentId(groupLabel: string): string {
  return `mobile-nav-content-${groupLabel.toLowerCase().replace(/\s+/g, "-")}`;
}

/**
 * Mobile navigation component with slide-out sheet and accordion sections
 * Uses Sheet component for slide-out menu
 * Uses Accordion for expandable navigation groups
 * 
 * Accessibility features:
 * - aria-expanded and aria-controls on menu trigger
 * - aria-label on navigation landmarks
 * - aria-current="page" on active links
 * - Screen reader announcements for menu state changes
 * - aria-hidden on decorative icons
 */
export function MobileNavigation({
  groups,
  open,
  onOpenChange,
}: MobileNavigationProps) {
  const { t } = useTranslation();
  const location = useLocation();
  const currentPath = location.pathname;
  const announcerRef = useRef<HTMLDivElement>(null);

  // Announce menu state changes to screen readers
  useEffect(() => {
    if (announcerRef.current) {
      announcerRef.current.textContent = open
        ? t('a11y.navOpened')
        : t('a11y.navClosed');
    }
  }, [open, t]);

  const handleLinkClick = () => {
    onOpenChange(false);
  };

  return (
    <>
      {/* Screen reader announcer for menu state changes */}
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
            className="min-h-[44px] min-w-[44px] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
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
          className="w-72 overflow-y-auto"
          id="mobile-navigation-panel"
          role="dialog"
          aria-modal="true"
          aria-label={t('a11y.mobileNav')}
        >
          <SheetHeader className="text-left">
            <SheetTitle id="mobile-nav-title">{t('nav.title')}</SheetTitle>
          </SheetHeader>

          <nav
            className="mt-6"
            role="navigation"
            aria-label={t('a11y.mainNav')}
          >
            {/* Home link */}
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
                "flex items-center gap-3 rounded-md px-3 py-3 text-sm font-medium",
                "min-h-[44px] transition-colors",
                "hover:bg-primary/10 hover:text-primary",
                "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                currentPath === "/"
                  ? "bg-primary/10 text-primary"
                  : "text-foreground"
              )}
              aria-current={currentPath === "/" ? "page" : undefined}
            >
              <Home className="h-4 w-4" aria-hidden="true" />
              {t('nav.home')}
            </Link>

            {/* Navigation groups with accordion */}
            <Accordion
              type="multiple"
              defaultValue={groups
                .filter((g) => isGroupActive(currentPath, g))
                .map((g) => g.label)}
              className="mt-2"
            >
              {groups.map((group) => {
                const groupIsActive = isGroupActive(currentPath, group);
                const GroupIcon = group.icon;
                const contentId = getAccordionContentId(group.label);

                return (
                  <AccordionItem
                    key={group.label}
                    value={group.label}
                    className="border-b-0"
                  >
                    <AccordionTrigger
                      className={cn(
                        "px-3 py-3 min-h-[44px] hover:no-underline",
                        "hover:bg-primary/10 hover:text-primary rounded-md",
                        "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                        groupIsActive && "text-primary font-semibold"
                      )}
                      aria-controls={contentId}
                    >
                      <span className="flex items-center gap-3">
                        <GroupIcon className="h-4 w-4" aria-hidden="true" />
                        <span>{group.label}</span>
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="pb-0" id={contentId}>
                      <ul className="ml-4 space-y-1" role="list">
                        {group.items.map((item) => {
                          const itemIsActive = isPathActive(currentPath, item.path);
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
                                  "flex items-center gap-3 rounded-md px-3 py-3 text-sm",
                                  "min-h-[44px] transition-colors",
                                  "hover:bg-primary/10 hover:text-primary",
                                  "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                                  itemIsActive
                                    ? "bg-primary/10 text-primary font-semibold"
                                    : "text-muted-foreground"
                                )}
                                aria-current={itemIsActive ? "page" : undefined}
                              >
                                {ItemIcon && (
                                  <ItemIcon className="h-4 w-4" aria-hidden="true" />
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
}
