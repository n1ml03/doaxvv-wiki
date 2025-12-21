import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { ChevronRight, Users } from "lucide-react";
import { contentLoader } from "@/content";
import type { Character } from "@/content";
import { DatasetImage } from "@/shared/components";

const FeaturedCharacters = () => {
  const [featuredGirls, setFeaturedGirls] = useState<Character[]>([]);

  useEffect(() => {
    // Try to use cached data first, then load if needed
    const cachedCharacters = contentLoader.getCharacters();
    if (cachedCharacters.length > 0) {
      setFeaturedGirls(cachedCharacters.slice(0, 3));
    } else {
      contentLoader.loadCharacters().then(characters => {
        setFeaturedGirls(characters.slice(0, 3));
      });
    }
  }, []);

  return (
    <section className="animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-bold text-foreground">Featured Girls</h2>
        </div>
        <Link to="/girls">
          <Button variant="ghost" size="sm" className="gap-1 text-xs">
            View All
            <ChevronRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
      
      <div className="grid grid-cols-1 gap-3">
        {featuredGirls.map((girl) => (
          <Link key={girl.id} to={`/girls/${girl.unique_key}`}>
            <Card 
              className="group cursor-pointer overflow-hidden border-border/50 bg-card shadow-card hover:shadow-hover transition-all duration-300 hover:-translate-y-1"
            >
              <div className="flex gap-3 p-3">
                <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 ring-2 ring-primary/20 group-hover:ring-primary/40 transition-all">
                  <DatasetImage 
                    src={girl.image} 
                    alt={girl.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1 mb-1">
                    {girl.title}
                  </h3>

                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default FeaturedCharacters;
