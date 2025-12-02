import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Header from "@/shared/layouts/Header";
import Footer from "@/shared/layouts/Footer";
import { Hero, WhatsNew, SiteOverview, VersionUpdates } from "../components";
import { CurrentEvents } from "@/features/events";
import { FeaturedCharacters } from "@/features/characters";
import { PopularGuides } from "@/features/guides";
import { ResponsiveContainer } from "@/shared/components/responsive";
import { ScrollToTop } from "@/shared/components";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Sparkles, Users, BookOpen, Calendar, Gift, Star } from "lucide-react";
import { contentLoader } from "@/content";
import { useTranslation } from "@/shared/hooks/useTranslation";
import { useDocumentTitle } from "@/shared/hooks/useDocumentTitle";

const STATS_CONFIG = [
  { key: "characters", icon: Users, color: "text-tec" },
  { key: "swimsuits", icon: Sparkles, color: "text-secondary" },
  { key: "activeEvents", icon: Calendar, color: "text-ssr" },
  { key: "guides", icon: BookOpen, color: "text-stm" },
];

const HomePage = () => {
  const { t } = useTranslation();
  
  // Set dynamic page title - use default for home page (Requirements: 9.1, 9.5)
  useDocumentTitle('');
  
  const [statsValues, setStatsValues] = useState({
    characters: "0",
    swimsuits: "0",
    activeEvents: "0",
    guides: "0",
  });

  useEffect(() => {
    async function loadStats() {
      await contentLoader.initialize();
      const characters = contentLoader.getCharacters();
      const swimsuits = contentLoader.getSwimsuits();
      const events = contentLoader.getEvents();
      const guides = contentLoader.getGuides();
      const activeEvents = events.filter(e => e.event_status === "Active");

      setStatsValues({
        characters: characters.length.toString(),
        swimsuits: swimsuits.length.toString(),
        activeEvents: activeEvents.length.toString(),
        guides: guides.length.toString(),
      });
    }
    loadStats();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main id="main-content" className="pb-16" tabIndex={-1}>
        <Hero />
        
        <ResponsiveContainer>
          {/* Quick Stats - 1 col mobile, 2 col tablet, 4 col desktop */}
          <div className="mt-8 sm:mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {STATS_CONFIG.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Card 
                  key={stat.key}
                  className="border-border/50 bg-card shadow-card hover:shadow-hover transition-all duration-300 hover:-translate-y-1 animate-fade-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <CardContent className="p-4 sm:p-6 text-center">
                    <Icon className={`h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 sm:mb-3 ${stat.color}`} />
                    <div className="text-2xl sm:text-3xl font-bold text-foreground mb-1">
                      {statsValues[stat.key as keyof typeof statsValues]}
                    </div>
                    <div className="text-xs sm:text-sm text-muted-foreground">
                      {t(`home.stats.${stat.key}`)}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Site Overview */}
          <div className="mt-8 sm:mt-12">
            <SiteOverview />
          </div>

          {/* Version Updates */}
          <div className="mt-8 sm:mt-12">
            <VersionUpdates />
          </div>

          {/* What's New and Featured Girls - Side by Side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 mt-8 sm:mt-12">
            <WhatsNew />
            <FeaturedCharacters />
          </div>

          {/* Current Events */}
          <div className="mt-8 sm:mt-12">
            <CurrentEvents />
          </div>

          {/* Full Width Sections */}
          <div className="mt-8 sm:mt-12">
            <PopularGuides />
          </div>

                    {/* Quick Links Section */}
          <div className="mt-8 sm:mt-12">
            <Card className="border-border/50 bg-card shadow-card">
              <CardHeader className="pb-3 sm:pb-6">
                <CardTitle className="text-lg sm:text-xl">{t('home.quickLinks.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                  <Link to="/events">
                    <Button variant="outline" className="w-full justify-start h-10 sm:h-11 text-sm sm:text-base">
                      <Calendar className="h-4 w-4 mr-2" />
                      {t('home.quickLinks.viewAllEvents')}
                    </Button>
                  </Link>
                  <Link to="/gachas">
                    <Button variant="outline" className="w-full justify-start h-10 sm:h-11 text-sm sm:text-base">
                      <Gift className="h-4 w-4 mr-2" />
                      {t('home.quickLinks.currentGachas')}
                    </Button>
                  </Link>
                  <Link to="/girls">
                    <Button variant="outline" className="w-full justify-start h-10 sm:h-11 text-sm sm:text-base">
                      <Star className="h-4 w-4 mr-2" />
                      {t('home.quickLinks.characterGallery')}
                    </Button>
                  </Link>
                  <Link to="/swimsuits">
                    <Button variant="outline" className="w-full justify-start h-10 sm:h-11 text-sm sm:text-base">
                      <Sparkles className="h-4 w-4 mr-2" />
                      {t('home.quickLinks.swimsuitCollection')}
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Latest Updates Banner */}
          <div className="mt-8 sm:mt-12 p-4 sm:p-8 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 rounded-xl sm:rounded-2xl border border-border/50">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6">
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-2">{t('home.stayUpdated.title')}</h3>
                <p className="text-sm sm:text-base text-muted-foreground">
                  {t('home.stayUpdated.desc')}
                </p>
              </div>
              <div className="flex gap-3 w-full md:w-auto">
                <Link to="/guides" className="w-full md:w-auto">
                  <Button size="lg" className="shadow-lg w-full md:w-auto">
                    <BookOpen className="h-5 w-5 mr-2" />
                    {t('home.browseGuides')}
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          <ScrollToTop />
        </ResponsiveContainer>
      </main>
      <Footer />
    </div>
  );
};

export default HomePage;
