import { useState, useEffect } from "react";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Users, Shirt, Calendar, BookOpen, Target, TrendingUp, Waves } from "lucide-react";
import { contentLoader } from "@/content";
import { useTranslation } from "@/shared/hooks/useTranslation";

const STATS_CONFIG = [
  { key: "characters", icon: Users, gradient: "from-primary to-cyan-400" },
  { key: "swimsuits", icon: Shirt, gradient: "from-secondary to-pink-400" },
  { key: "activeEvents", icon: Calendar, gradient: "from-ssr to-cyan-400" },
  { key: "guides", icon: BookOpen, gradient: "from-stm to-emerald-400" },
];

const SiteOverview = () => {
  const { t } = useTranslation();
  const [statsValues, setStatsValues] = useState({
    characters: 0,
    swimsuits: 0,
    activeEvents: 0,
    guides: 0,
  });

  useEffect(() => {
    async function loadContent() {
      await contentLoader.initialize();
      const characters = contentLoader.getCharacters();
      const swimsuits = contentLoader.getSwimsuits();
      const events = contentLoader.getEvents();
      const guides = contentLoader.getGuides();
      const activeEvents = events.filter(e => e.event_status === "Active").length;

      setStatsValues({
        characters: characters.length,
        swimsuits: swimsuits.length,
        activeEvents: activeEvents,
        guides: guides.length,
      });
    }
    loadContent();
  }, []);

  return (
    <section>
      <Card className="relative overflow-hidden border-border/50 bg-card shadow-card">
        <CardContent className="relative p-6 md:p-8">
          <div className="flex flex-col lg:flex-row gap-8 items-center">
            <div className="flex-1 text-center lg:text-left">
              <div className="inline-flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/15 to-secondary/10">
                  <Waves className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                  {t('home.overview.title')}
                </h2>
              </div>
              
              <p className="text-muted-foreground mb-5 max-w-2xl text-sm md:text-base">
                {t('home.overview.desc')}
              </p>
              
              <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-sm">
                  <Target className="h-3.5 w-3.5 text-primary" />
                  <span className="text-foreground/80">{t('home.overview.updatedDaily')}</span>
                </span>
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/10 border border-secondary/20 text-sm">
                  <TrendingUp className="h-3.5 w-3.5 text-secondary" />
                  <span className="text-foreground/80">{t('home.overview.communityDriven')}</span>
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4 gap-4">
              {STATS_CONFIG.map((stat) => (
                <div 
                  key={stat.key} 
                  className="group text-center p-4 rounded-xl bg-background/60 border border-border/40 hover:border-primary/30 transition-colors duration-200"
                >
                  <div className={`inline-flex p-2 rounded-lg bg-gradient-to-br ${stat.gradient} mb-2`}>
                    <stat.icon className="h-4 w-4 text-white" />
                  </div>
                  <div className="text-2xl font-bold text-foreground group-hover:text-primary transition-colors">
                    {statsValues[stat.key as keyof typeof statsValues]}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {t(`home.stats.${stat.key}`)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
};

export default SiteOverview;
