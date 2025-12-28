import { useState, useEffect } from "react";
import { Link, useLoaderData } from "react-router-dom";
import Header from "@/shared/layouts/Header";
import Footer from "@/shared/layouts/Footer";
import { Hero, WhatsNew, SiteOverview } from "../components";
import { VersionUpdatesWidget } from "@/features/changelog";
import { CurrentEvents } from "@/features/events";
import { FeaturedCharacters } from "@/features/characters";
import { PopularGuides } from "@/features/guides";
import { ResponsiveContainer } from "@/shared/components/responsive";
import { ScrollToTop } from "@/shared/components";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Shirt, Users, BookOpen, Calendar, Gift, Star, ArrowRight } from "lucide-react";
import { contentLoader } from "@/content";
import { useTranslation } from "@/shared/hooks/useTranslation";
import { useDocumentTitle } from "@/shared/hooks/useDocumentTitle";

const STATS_CONFIG = [
  { key: "characters", icon: Users, gradient: "from-primary to-primary/70", link: "/girls" },
  { key: "swimsuits", icon: Shirt, gradient: "from-secondary to-secondary/70", link: "/swimsuits" },
  { key: "activeEvents", icon: Calendar, gradient: "from-ssr to-cyan-400", link: "/events" },
  { key: "guides", icon: BookOpen, gradient: "from-stm to-emerald-400", link: "/guides" },
];

const HomePage = () => {
  const { t } = useTranslation();
  
  useLoaderData();
  useDocumentTitle('');
  
  const [statsValues, setStatsValues] = useState({
    characters: "0",
    swimsuits: "0",
    activeEvents: "0",
    guides: "0",
  });

  useEffect(() => {
    const characters = contentLoader.getCharacters();
    const events = contentLoader.getEvents();
    const guides = contentLoader.getGuides();
    const activeEvents = events.filter(e => ["Active", "Upcoming", "Ended"].includes(e.event_status));

    contentLoader.loadSwimsuits().then(swimsuits => {
      setStatsValues(prev => ({
        ...prev,
        swimsuits: swimsuits.length.toString(),
      }));
    });

    setStatsValues({
      characters: characters.length.toString(),
      swimsuits: "...",
      activeEvents: activeEvents.length.toString(),
      guides: guides.length.toString(),
    });
  }, []);

  return (
    <div className="min-h-screen bg-background relative">
      {/* Subtle background decoration - performance optimized */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-primary/[0.03] blur-3xl" />
        <div className="absolute top-1/3 -left-32 w-64 h-64 rounded-full bg-secondary/[0.03] blur-3xl" />
      </div>
      
      <Header />
      <main id="main-content" className="pb-16 relative" tabIndex={-1}>
        <Hero />
        
        <ResponsiveContainer>
          {/* Quick Stats */}
          <div className="mt-8 sm:mt-12 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {STATS_CONFIG.map((stat) => {
              const Icon = stat.icon;
              return (
                <Link to={stat.link} key={stat.key}>
                  <Card className="group relative overflow-hidden border-border/50 bg-card shadow-card hover:shadow-hover transition-all duration-200 hover:-translate-y-0.5">
                    <CardContent className="relative p-4 sm:p-6 text-center">
                      <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${stat.gradient} shadow-md mb-3 group-hover:scale-105 transition-transform duration-200`}>
                        <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                      </div>
                      <div className="text-2xl sm:text-3xl font-bold text-foreground mb-1 group-hover:text-primary transition-colors">
                        {statsValues[stat.key as keyof typeof statsValues]}
                      </div>
                      <div className="text-xs sm:text-sm text-muted-foreground">
                        {t(`home.stats.${stat.key}`)}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>

          <div className="mt-10 sm:mt-14">
            <SiteOverview />
          </div>

          <div className="mt-10 sm:mt-14">
            <VersionUpdatesWidget />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 mt-10 sm:mt-14">
            <WhatsNew />
            <FeaturedCharacters />
          </div>

          <div className="mt-10 sm:mt-14">
            <CurrentEvents />
          </div>

          <div className="mt-10 sm:mt-14">
            <PopularGuides />
          </div>

          {/* Quick Links Section */}
          <div className="mt-10 sm:mt-14">
            <Card className="border-border/50 bg-card shadow-card overflow-hidden">
              <CardHeader className="pb-3 sm:pb-6 relative">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/15 to-secondary/10">
                    <Star className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-lg sm:text-xl">{t('home.quickLinks.title')}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="relative">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                  <Link to="/events">
                    <Button variant="outline" className="w-full justify-start h-11 sm:h-12 text-sm sm:text-base hover:border-primary/50 hover:bg-primary/5 transition-colors">
                      <Calendar className="h-4 w-4 mr-2 text-primary" />
                      {t('home.quickLinks.viewAllEvents')}
                    </Button>
                  </Link>
                  <Link to="/gachas">
                    <Button variant="outline" className="w-full justify-start h-11 sm:h-12 text-sm sm:text-base hover:border-secondary/50 hover:bg-secondary/5 transition-colors">
                      <Gift className="h-4 w-4 mr-2 text-secondary" />
                      {t('home.quickLinks.currentGachas')}
                    </Button>
                  </Link>
                  <Link to="/girls">
                    <Button variant="outline" className="w-full justify-start h-11 sm:h-12 text-sm sm:text-base hover:border-ssr/50 hover:bg-ssr/5 transition-colors">
                      <Star className="h-4 w-4 mr-2 text-ssr" />
                      {t('home.quickLinks.characterGallery')}
                    </Button>
                  </Link>
                  <Link to="/swimsuits">
                    <Button variant="outline" className="w-full justify-start h-11 sm:h-12 text-sm sm:text-base hover:border-apl/50 hover:bg-apl/5 transition-colors">
                      <Shirt className="h-4 w-4 mr-2 text-apl" />
                      {t('home.quickLinks.swimsuitCollection')}
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Latest Updates Banner */}
          <div className="mt-10 sm:mt-14 relative overflow-hidden rounded-2xl sm:rounded-3xl">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-secondary/5 to-primary/10" />
            
            <div className="relative p-6 sm:p-10 border border-border/30 rounded-2xl sm:rounded-3xl">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex-1 text-center md:text-left">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-4">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    <span className="text-xs font-medium text-primary">New Content Available</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-2">{t('home.stayUpdated.title')}</h3>
                  <p className="text-sm sm:text-base text-muted-foreground max-w-lg">
                    {t('home.stayUpdated.desc')}
                  </p>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                  <Link to="/guides" className="w-full md:w-auto">
                    <Button size="lg" className="w-full md:w-auto shadow-md hover:shadow-lg transition-shadow group">
                      <BookOpen className="h-5 w-5 mr-2" />
                      {t('home.browseGuides')}
                      <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
                    </Button>
                  </Link>
                </div>
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
