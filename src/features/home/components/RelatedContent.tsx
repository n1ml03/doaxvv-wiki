import { Link } from "react-router-dom";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { ChevronRight, LucideIcon } from "lucide-react";
import { Button } from "@/shared/components/ui/button";

interface RelatedItem {
  id: string;
  title: string;
  image: string;
  href: string;
  badge?: string;
  description?: string;
  icon?: LucideIcon;
}

interface RelatedContentProps {
  title: string;
  items: RelatedItem[];
  viewAllHref?: string;
  viewAllLabel?: string;
}

const RelatedContent = ({ title, items, viewAllHref, viewAllLabel = "View All" }: RelatedContentProps) => {
  if (items.length === 0) return null;

  return (
    <section className="mt-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-foreground">{title}</h2>
        {viewAllHref && (
          <Link to={viewAllHref}>
            <Button variant="ghost" size="sm" className="gap-1">
              {viewAllLabel}
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        )}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {items.slice(0, 4).map((item) => (
          <Link key={item.id} to={item.href}>
            <Card className="group cursor-pointer overflow-hidden border-border/50 bg-card shadow-card hover:shadow-hover transition-all duration-200 hover:-translate-y-0.5 h-full">
              <div className="relative aspect-[4/3] overflow-hidden">
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                {item.badge && (
                  <Badge className="absolute top-2 right-2 bg-accent text-accent-foreground text-xs">
                    {item.badge}
                  </Badge>
                )}
                {item.icon && (
                  <div className="absolute bottom-2 left-2 p-1.5 rounded bg-background/90 backdrop-blur">
                    <item.icon className="h-4 w-4 text-primary" />
                  </div>
                )}
              </div>
              <CardContent className="p-3">
                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1 text-sm">
                  {item.title}
                </h3>
                {item.description && (
                  <p className="text-xs text-muted-foreground line-clamp-1 mt-1">{item.description}</p>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default RelatedContent;
