import {
  Users,
  Heart,
  Sparkles,
  Calendar,
  PartyPopper,
  Gift,
  BookOpen,
  Package,
  Film,
  Wrench,
  Gem,
  Target,
  HelpCircle,
} from "lucide-react";
import { NavGroup } from "@/shared/types/navigation";

/**
 * Navigation groups configuration
 * Organizes navigation items into logical categories:
 * - Characters: Girls, Swimsuits
 * - Contents: Events, Festivals, Gachas, Items
 * - Resources: Guides
 */
export const navigationGroups: NavGroup[] = [
  {
    label: "Characters",
    icon: Users,
    items: [
      { path: "/girls", label: "Girls", icon: Heart },
      { path: "/swimsuits", label: "Swimsuits", icon: Sparkles },
      { path: "/accessories", label: "Accessories", icon: Gem },
    ],
  },
  {
    label: "Contents",
    icon: Calendar,
    items: [
      { path: "/events", label: "Events", icon: Calendar },
      { path: "/festivals", label: "Festivals", icon: PartyPopper },
      { path: "/gachas", label: "Gachas", icon: Gift },
      { path: "/episodes", label: "Episodes", icon: Film },
      { path: "/items", label: "Items", icon: Package },
      { path: "/missions", label: "Missions", icon: Target },
    ],
  },
  {
    label: "Resources",
    icon: BookOpen,
    items: [
      { path: "/guides", label: "Guides", icon: BookOpen },
      { path: "/tools", label: "Tools", icon: Wrench },
      { path: "/quizzes", label: "Quizzes", icon: HelpCircle },
    ],
  },
];

/**
 * Helper function to check if a path is active
 * Only matches exact path (not child routes like detail pages)
 */
export const isPathActive = (currentPath: string, targetPath: string): boolean => {
  return currentPath === targetPath;
};

/**
 * Helper function to check if a path belongs to a section
 * Matches exact path or child routes (for group highlighting)
 */
export const isPathInSection = (currentPath: string, targetPath: string): boolean => {
  return currentPath === targetPath || currentPath.startsWith(targetPath + "/");
};

/**
 * Helper function to check if any item in a group is active
 */
export const isGroupActive = (currentPath: string, group: NavGroup): boolean => {
  return group.items.some((item) => isPathInSection(currentPath, item.path));
};
