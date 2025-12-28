import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { LucideIcon, ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface ContentCardProps {
  href: string;
  image: string;
  title: string;
  description?: string;
  badges?: { label: string; variant?: "default" | "secondary" | "outline" | "destructive" }[];
  icon?: LucideIcon;
  meta?: { icon?: LucideIcon; label: string }[];
  tags?: string[];
  variant?: "default" | "horizontal" | "featured";
  className?: string;
}

const CardImage = ({ 
  src, 
  alt, 
  className,
  aspectClass = "aspect-square"
}: { 
  src: string; 
  alt: string; 
  className?: string;
  aspectClass?: string;
}) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  const handleLoad = useCallback(() => {
    setLoaded(true);
    setError(false);
  }, []);

  const handleError = useCallback(() => {
    setError(true);
    setLoaded(false);
  }, []);

  if (error) {
    return (
      <div className={cn("flex items-center justify-center bg-muted", aspectClass, className)}>
        <ImageOff className="h-8 w-8 text-muted-foreground/50" />
      </div>
    );
  }

  return (
    <div className={cn("relative overflow-hidden", aspectClass, className)}>
      {!loaded && (
        <Skeleton className="absolute inset-0 w-full h-full" />
      )}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onLoad={handleLoad}
        onError={handleError}
        className={cn(
          "w-full h-full object-cover transition-transform duration-300 group-hover:scale-105",
          loaded ? "opacity-100" : "opacity-0"
        )}
      />
    </div>
  );
};

const ContentCard = ({
  href,
  image,
  title,
  description,
  badges = [],
  icon: Icon,
  meta = [],
  tags = [],
  variant = "default",
  className = "",
}: ContentCardProps) => {
  if (variant === "horizontal") {
    return (
      <Link to={href}>
        <Card className={cn("group cursor-pointer overflow-hidden border-border/50 bg-card shadow-card hover:shadow-hover transition-all duration-200 hover:-translate-y-0.5", className)}>
          <div className="flex flex-col sm:flex-row">
            <div className="relative w-full sm:w-48 h-48 sm:h-auto flex-shrink-0">
              <CardImage 
                src={image} 
                alt={title} 
                aspectClass="w-full h-full min-h-[120px]"
              />
              {badges.length > 0 && (
                <div className="absolute top-2 left-2 flex gap-2 z-10">
                  {badges.slice(0, 2).map((badge, i) => (
                    <Badge key={i} variant={badge.variant || "default"} className="text-xs">
                      {badge.label}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            <CardContent className="flex-1 p-4 sm:p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  {Icon && (
                    <div className="p-1.5 rounded bg-primary/10">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                    {title}
                  </h3>
                </div>
                {description && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{description}</p>
                )}
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {tags.slice(0, 3).map((tag, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {tags.length > 3 && (
                      <Badge variant="outline" className="text-xs">+{tags.length - 3}</Badge>
                    )}
                  </div>
                )}
              </div>
              {meta.length > 0 && (
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  {meta.map((item, i) => (
                    <span key={i} className="flex items-center gap-1">
                      {item.icon && <item.icon className="h-3 w-3" />}
                      {item.label}
                    </span>
                  ))}
                </div>
              )}
            </CardContent>
          </div>
        </Card>
      </Link>
    );
  }

  if (variant === "featured") {
    return (
      <Link to={href}>
        <Card className={cn("group cursor-pointer overflow-hidden border-border/50 bg-card shadow-card hover:shadow-hover transition-all duration-200 hover:-translate-y-0.5", className)}>
          <div className="relative aspect-[16/9]">
            <CardImage 
              src={image} 
              alt={title} 
              aspectClass="aspect-[16/9]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent pointer-events-none" />
            {badges.length > 0 && (
              <div className="absolute top-3 left-3 flex gap-2 z-10">
                {badges.map((badge, i) => (
                  <Badge key={i} variant={badge.variant || "default"} className="text-xs">
                    {badge.label}
                  </Badge>
                ))}
              </div>
            )}
            <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6">
              <div className="flex items-center gap-3 mb-2">
                {Icon && (
                  <div className="p-2 rounded-lg bg-background/90 backdrop-blur-sm">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                )}
                <h3 className="text-xl sm:text-2xl font-bold text-white drop-shadow-lg">
                  {title}
                </h3>
              </div>
              {description && (
                <p className="text-sm text-white/90 line-clamp-2">{description}</p>
              )}
            </div>
          </div>
          {(tags.length > 0 || meta.length > 0) && (
            <CardContent className="p-4">
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {tags.map((tag, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
              {meta.length > 0 && (
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  {meta.map((item, i) => (
                    <span key={i} className="flex items-center gap-1">
                      {item.icon && <item.icon className="h-3 w-3" />}
                      {item.label}
                    </span>
                  ))}
                </div>
              )}
            </CardContent>
          )}
        </Card>
      </Link>
    );
  }

  // Default variant
  return (
    <Link to={href}>
      <Card className={cn("group cursor-pointer overflow-hidden border-border/50 bg-card shadow-card hover:shadow-hover transition-all duration-200 hover:-translate-y-0.5 h-full", className)}>
        <div className="relative aspect-square">
          <CardImage 
            src={image} 
            alt={title} 
            aspectClass="aspect-square"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />
          {badges.length > 0 && (
            <div className="absolute top-3 right-3 flex gap-2 z-10">
              {badges.map((badge, i) => (
                <Badge key={i} variant={badge.variant || "default"} className="bg-background/90 backdrop-blur-sm text-foreground border border-border/50">
                  {badge.label}
                </Badge>
              ))}
            </div>
          )}
        </div>
        <CardContent className="p-4">
          <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
            {title}
          </h3>
          {description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{description}</p>
          )}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {tags.slice(0, 2).map((tag, i) => (
                <Badge key={i} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
};

export default ContentCard;
