import { Link, useLocation } from "react-router-dom";
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
import { isPathActive, isGroupActive } from "@/shared/config/navigation";
import { useTranslation } from "@/shared/hooks/useTranslation";

interface DesktopNavigationProps {
  groups: NavGroup[];
}

/**
 * Desktop navigation component with enhanced dropdown menus
 */
export function DesktopNavigation({ groups }: DesktopNavigationProps) {
  const { t } = useTranslation();
  const location = useLocation();
  const currentPath = location.pathname;

  const getDescription = (path: string, label: string) => {
    const key = path.replace('/', '');
    const translationKey = `nav.desc.${key}`;
    const translated = t(translationKey);
    
    // If translation is missing (returns key), fallback to generic message
    if (translated === translationKey) {
      return `View all ${label.toLowerCase()}`;
    }
    return translated;
  };

  return (
    <nav
      className="hidden lg:flex"
      role="navigation"
      aria-label="Main navigation"
    >
      <NavigationMenu>
        <NavigationMenuList>
          {groups.map((group) => {
            const groupIsActive = isGroupActive(currentPath, group);
            const GroupIcon = group.icon;
            
            // Determine grid layout based on item count
            // 1-2 items: 2 columns, 3-4 items: 2 columns, 5+ items: 3 columns
            let gridClass = "grid-cols-2 w-[480px]";
            if (group.items.length >= 5) {
              gridClass = "grid-cols-3 w-[680px]";
            }

            return (
              <NavigationMenuItem key={group.label}>
                <NavigationMenuTrigger
                  className={cn(
                    "bg-transparent hover:bg-primary/5 hover:text-primary transition-all duration-200 h-10 px-4 rounded-full",
                    "data-[state=open]:bg-primary/10 data-[state=open]:text-primary",
                    "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-2",
                    groupIsActive && "text-primary font-semibold bg-primary/5"
                  )}
                >
                  <GroupIcon className="mr-2 h-4 w-4" aria-hidden="true" />
                  {group.label}
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className={cn(
                    "grid gap-2 p-3",
                    gridClass
                  )}>
                    {/* Navigation Items */}
                    {group.items.map((item) => {
                      const itemIsActive = isPathActive(currentPath, item.path);
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
                                "flex items-start gap-3 rounded-xl p-3 transition-all duration-200",
                                "hover:bg-accent hover:shadow-sm group select-none",
                                "focus:outline-none focus:ring-2 focus:ring-primary/20",
                                itemIsActive && "bg-primary/5 ring-1 ring-primary/10"
                              )}
                              aria-current={itemIsActive ? "page" : undefined}
                            >
                              <div className={cn(
                                "flex h-8 w-8 items-center justify-center rounded-lg flex-shrink-0 transition-all duration-200 mt-0.5",
                                itemIsActive 
                                  ? "bg-primary text-primary-foreground shadow-sm" 
                                  : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                              )}>
                                {ItemIcon && <ItemIcon className="h-4 w-4" />}
                              </div>
                              <div className="flex-1 min-w-0 space-y-1">
                                <p className={cn(
                                  "text-sm font-semibold transition-colors leading-none",
                                  itemIsActive ? "text-primary" : "text-foreground group-hover:text-primary"
                                )}>
                                  {item.label}
                                </p>
                                <p className="text-[12px] text-muted-foreground line-clamp-2 leading-snug group-hover:text-muted-foreground/80">
                                  {description}
                                </p>
                              </div>
                            </Link>
                          </NavigationMenuLink>
                        </li>
                      );
                    })}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
            );
          })}
        </NavigationMenuList>
      </NavigationMenu>
    </nav>
  );
}
