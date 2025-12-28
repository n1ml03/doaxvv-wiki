import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { ChevronRight, Users, Heart } from "lucide-react";
import { contentLoader } from "@/content";
import type { Character } from "@/content";
import { DatasetImage } from "@/shared/components";

const FeaturedCharacters = () => {
  const [featuredGirls, setFeaturedGirls] = useState<Character[]>([]);

  useEffect(() => {
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
    <section>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-secondary/15 to-pink-500/10">
            <Users className="h-5 w-5 text-secondary" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Featured Girls</h2>
        </div>
        <Link to="/girls">
          <Button variant="ghost" size="sm" className="gap-1 text-xs group">
            View All
            <ChevronRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
          </Button>
        </Link>
      </div>
      
      <div className="grid grid-cols-1 gap-3">
        {featuredGirls.map((girl) => (
          <Link key={girl.id} to={`/girls/${girl.unique_key}`}>
            <Card className="group cursor-pointer overflow-hidden border-border/50 bg-card shadow-card hover:shadow-hover transition-all duration-200 hover:-translate-y-0.5">
              <div className="relative flex gap-4 p-4">
                <div className="relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 ring-2 ring-secondary/20 group-hover:ring-secondary/40 transition-colors">
                  <DatasetImage 
                    src={girl.image} 
                    alt={girl.title}
                    className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                  />
                </div>
                
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="p-1.5 rounded-lg bg-secondary/10">
                      <Heart className="h-3.5 w-3.5 text-secondary" />
                    </div>
                    <span className="text-xs font-medium text-secondary">Character</span>
                  </div>
                  
                  <h3 className="text-sm font-semibold text-foreground group-hover:text-secondary transition-colors line-clamp-1">
                    {girl.title}
                  </h3>
                </div>
                
                <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <ChevronRight className="h-5 w-5 text-secondary" />
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
