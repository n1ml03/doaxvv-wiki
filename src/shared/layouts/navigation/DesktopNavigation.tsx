import { Link, useLocation } from "react-router-dom";
import { memo, useMemo } from "react";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/shared/components/ui/navigation-menu";
import { cn } from "@/lib/utils";
import { NavGroup } from "@/shared/types/navigation";
import { isPathActive, isPathInSection, isGroupActive } from "@/shared/config/navigation";
import { useTranslation } from "@/shared/hooks/useTranslation";

interface DesktopNavigationProps {
  groups: NavGroup[];
}

/**
 * Desktop navigation component with Premium Ocean & Sunset Theme
 * Features enhanced glassmorphism dropdowns and gradient accents
 */
export const DesktopNavigation = memo(function DesktopNavigation({ groups }: DesktopNavigationProps) {
  const { t } = useTranslation();
  const location = useLocation();
  const currentPath = location.pathname;

  const getDescription = useMemo(() => (path: string, label: string) => {
    const key = path.replace('/', '');
    const translationKey = `nav.desc.${key}`;
    const translated = t(translationKey);
    
    if (translated === translationKey) {
      return `View all ${label.toLowerCase()}`;
    }
    return translated;
  }, [t]);

  return (
    <nav
      className="hidden lg:flex"
      role="navigation"
      aria-label="Main navigation"
    >
      <NavigationMenu>
        <NavigationMenuList className="gap-1">
          {groups.map((group) => {
            const groupIsActive = isGroupActive(currentPath, group);
            const GroupIcon = group.icon;
            
            // Responsive grid layout
            const gridClass = group.items.length >= 5 
              ? "grid-cols-3 w-[720px]" 
              : "grid-cols-2 w-[500px]";

            return (
              <NavigationMenuItem key={group.label}>
                <NavigationMenuTrigger
                  className={cn(
                    "bg-transparent h-10 px-4 rounded-xl",
                    "transition-all duration-200",
                    "hover:bg-primary/8 hover:text-primary",
                    "data-[state=open]:bg-primary/10 data-[state=open]:text-primary",
                    "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2",
                    groupIsActive && "text-primary font-semibold bg-primary/8"
                  )}
                >
                  <GroupIcon className="mr-2 h-4 w-4" aria-hidden="true" />
                  {group.label}
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  {/* Premium dropdown with glassmorphism */}
                  <div className={cn(
                    "relative overflow-hidden rounded-2xl",
                    "bg-popover/95 backdrop-blur-xl backdrop-saturate-150",
                    "border border-border/30",
                    "shadow-xl shadow-black/10"
                  )}>
                    {/* Subtle gradient accent at top */}
                    <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-primary/40 via-secondary/30 to-primary/40" />
                    
                    <ul className={cn("grid gap-1.5 p-3", gridClass)}>
                      {group.items.map((item) => {
                        const itemIsActive = isPathActive(currentPath, item.path);
                        const itemIsInSection = isPathInSection(currentPath, item.path);
                        const ItemIcon = item.icon;
                        const description = getDescription(item.path, item.label);

                        return (
                          <li key={item.path}>
                            <NavigationMenuLink asChild>
                              <Link
                                to={item.path}
                                onClick={(e) => {
                                  if (itemIsActive) {
                                    e.preventDefault();
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                    window.location.reload();
                                  }
                                }}
                                className={cn(
                                  "group flex items-start gap-3 rounded-xl p-3",
                                  "transition-all duration-200 select-none",
                                  "hover:bg-accent/80",
                                  "focus:outline-none focus:ring-2 focus:ring-primary/30",
                                  itemIsInSection && "bg-primary/8 ring-1 ring-primary/15"
                                )}
                                aria-current={itemIsActive ? "page" : undefined}
                              >
                                <div className={cn(
                                  "flex h-9 w-9 items-center justify-center rounded-xl flex-shrink-0",
                                  "transition-all duration-200",
                                  itemIsInSection 
                                    ? "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-md shadow-primary/20" 
                                    : "bg-muted/80 text-muted-foreground group-hover:bg-gradient-to-br group-hover:from-primary/15 group-hover:to-secondary/10 group-hover:text-primary"
                                )}>
                                  {ItemIcon && <ItemIcon className="h-4 w-4" />}
                                </div>
                                <div className="flex-1 min-w-0 space-y-0.5 pt-0.5">
                                  <p className={cn(
                                    "text-sm font-semibold leading-none",
                                    "transition-colors duration-200",
                                    itemIsInSection ? "text-primary" : "text-foreground group-hover:text-primary"
                                  )}>
                                    {item.label}
                                  </p>
                                  <p className="text-xs text-muted-foreground/80 line-clamp-2 leading-relaxed">
                                    {description}
                                  </p>
                                </div>
                              </Link>
                            </NavigationMenuLink>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>
            );
          })}
        </NavigationMenuList>
      </NavigationMenu>
    </nav>
  );
});
