import { useParams, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { Header } from "@/shared/layouts";
import { Breadcrumb, LocalizedText, ResponsiveContainer, DatasetImage, UniqueKeyDisplay, ScrollToTop } from "@/shared/components";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Progress } from "@/shared/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { Heart, Calendar, Ruler, TrendingUp, Award, Zap, Shield, Target, BookOpen, Sparkles } from "lucide-react";
import { contentLoader } from "@/content";
import type { Character, Swimsuit, Guide } from "@/content";
import { getLocalizedValue } from "@/shared/utils/localization";
import { useLanguage } from "@/shared/contexts/language-hooks";
import { RelatedContent } from "@/shared/components";
import { useTranslation } from "@/shared/hooks/useTranslation";

const CharacterDetailPage = () => {
  const { t } = useTranslation();
  const { unique_key } = useParams<{ unique_key: string }>();
  const { currentLanguage } = useLanguage();
  const [character, setCharacter] = useState<Character | null>(null);
  const [characterSwimsuits, setCharacterSwimsuits] = useState<Swimsuit[]>([]);
  const [otherGirls, setOtherGirls] = useState<Character[]>([]);
  const [relatedGuides, setRelatedGuides] = useState<Guide[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    async function loadContent() {
      await contentLoader.initialize();
      const foundCharacter = contentLoader.getCharacterByUniqueKey(unique_key || "");
      setCharacter(foundCharacter || null);
      
      if (foundCharacter) {
        const allSwimsuits = contentLoader.getSwimsuits();
        const suits = allSwimsuits.filter(suit => suit.character_id === foundCharacter.unique_key);
        setCharacterSwimsuits(suits);
        
        const allCharacters = contentLoader.getCharacters();
        setOtherGirls(allCharacters.filter(c => c.id !== foundCharacter.id).slice(0, 4));
        
        const allGuides = contentLoader.getGuides();
        setRelatedGuides(allGuides.filter(g => 
          g.category === "Team Building" || g.topics.some(t => t.toLowerCase().includes("character"))
        ).slice(0, 4));
      }
      
      setLoading(false);
    }
    loadContent();
  }, [unique_key]);


  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main id="main-content" className="py-6 sm:py-8" tabIndex={-1}>
          <ResponsiveContainer>
            {/* Breadcrumb skeleton */}
            <div className="flex items-center gap-2 mb-6">
              <div className="h-4 w-16 bg-muted animate-pulse rounded" />
              <div className="h-4 w-4 bg-muted animate-pulse rounded" />
              <div className="h-4 w-24 bg-muted animate-pulse rounded" />
            </div>
            
            {/* Hero section skeleton */}
            <div className="relative mb-6 sm:mb-8 rounded-xl overflow-hidden bg-gradient-to-br from-primary/10 via-accent/5 to-background border border-border/50">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 p-4 sm:p-8">
                <div className="md:col-span-2 space-y-3 sm:space-y-4 order-2 md:order-1">
                  <div className="h-8 w-48 bg-muted animate-pulse rounded" />
                  <div className="h-12 sm:h-16 w-3/4 bg-muted animate-pulse rounded" />
                  <div className="h-5 w-full max-w-2xl bg-muted animate-pulse rounded" />
                  <div className="h-5 w-2/3 bg-muted animate-pulse rounded" />
                  <div className="flex gap-3 pt-2">
                    <div className="h-10 w-32 bg-muted animate-pulse rounded-lg" />
                    <div className="h-10 w-28 bg-muted animate-pulse rounded-lg" />
                  </div>
                </div>
                <div className="flex justify-center md:justify-end items-center order-1 md:order-2">
                  <div className="w-40 h-40 sm:w-64 sm:h-64 rounded-xl bg-muted animate-pulse" />
                </div>
              </div>
            </div>
            
            {/* Tabs skeleton */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-1 bg-muted/50 rounded-lg mb-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-10 bg-muted animate-pulse rounded-md" />
              ))}
            </div>
            
            {/* Content cards skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="rounded-lg border border-border/50 bg-card p-6 space-y-4">
                  <div className="h-6 w-32 bg-muted animate-pulse rounded" />
                  <div className="space-y-2">
                    <div className="h-4 w-full bg-muted animate-pulse rounded" />
                    <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
                    <div className="h-4 w-1/2 bg-muted animate-pulse rounded" />
                  </div>
                </div>
              ))}
            </div>
          </ResponsiveContainer>
        </main>
      </div>
    );
  }

  if (!character) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main id="main-content" className="py-6 sm:py-8" tabIndex={-1}>
          <ResponsiveContainer>
            <Breadcrumb items={[{ label: t('nav.girls'), href: "/girls" }, { label: t('characterDetail.notFound') }]} />
            <div className="flex flex-col items-center justify-center text-center py-16">
              <div className="w-24 h-24 rounded-full bg-muted/50 flex items-center justify-center mb-6">
                <Heart className="h-12 w-12 text-muted-foreground/50" />
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-2">{t('characterDetail.notFound')}</h1>
              <p className="text-muted-foreground mb-6 max-w-md">
                {t('characterDetail.notFoundDescription') || "The character you're looking for doesn't exist or may have been removed."}
              </p>
              <Link to="/girls">
                <Button>{t('characterDetail.backToGirls')}</Button>
              </Link>
            </div>
          </ResponsiveContainer>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main id="main-content" className="py-6 sm:py-8" tabIndex={-1}>
        <ResponsiveContainer>
          <Breadcrumb items={[{ label: t('nav.girls'), href: "/girls" }, { label: getLocalizedValue(character.name, currentLanguage) }]} />

          {/* Hero Section */}
          <div className="relative mb-6 sm:mb-8 rounded-xl overflow-hidden bg-gradient-to-br from-primary/10 via-accent/5 to-background border border-border/50">
            <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
            <div className="relative grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 p-4 sm:p-8">
              <div className="md:col-span-2 space-y-3 sm:space-y-4 order-2 md:order-1">
                <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                  
                </div>
                <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold text-foreground tracking-tight">
                  <LocalizedText localized={character.name} showIndicator />
                </h1>
                <p className="text-base sm:text-xl text-muted-foreground leading-relaxed max-w-2xl">
                  {character.summary}
                </p>
                <div className="flex flex-wrap gap-2 sm:gap-3 pt-2">
                  <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-background/80 border border-border/50">
                    <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                    <span className="text-xs sm:text-sm font-medium">
                      {t('characterDetail.totalStats').replace('{value}', (character.stats.POW + character.stats.TEC + character.stats.STM).toString())}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-background/80 border border-border/50">
                    <Award className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                    <span className="text-xs sm:text-sm font-medium">
                      {t('characterDetail.swimsuitCount').replace('{count}', characterSwimsuits.length.toString())}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex justify-center md:justify-end items-center order-1 md:order-2">
                <div className="relative w-40 h-40 sm:w-64 sm:h-64 rounded-xl overflow-hidden border-4 border-primary/20 shadow-2xl">
                  <DatasetImage
                    src={character.image}
                    alt={character.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>


          {/* Main Content with Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto">
              <TabsTrigger value="overview" className="gap-1 sm:gap-2 text-xs sm:text-sm py-2">
                <BookOpen className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">{t('characterDetail.tabs.overview')}</span>
                <span className="sm:hidden">{t('characterDetail.tabs.info')}</span>
              </TabsTrigger>
              <TabsTrigger value="stats" className="gap-1 sm:gap-2 text-xs sm:text-sm py-2">
                <Target className="h-3 w-3 sm:h-4 sm:w-4" />
                {t('characterDetail.tabs.stats')}
              </TabsTrigger>
              <TabsTrigger value="collection" className="gap-1 sm:gap-2 text-xs sm:text-sm py-2">
                <Sparkles className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">{t('characterDetail.tabs.collection')}</span>
                <span className="sm:hidden">{t('characterDetail.tabs.suits')}</span>
              </TabsTrigger>
              <TabsTrigger value="profile" className="gap-1 sm:gap-2 text-xs sm:text-sm py-2">
                <Heart className="h-3 w-3 sm:h-4 sm:w-4" />
                {t('characterDetail.tabs.profile')}
              </TabsTrigger>
            </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Quick Stats Overview */}
              <Card className="border-border/50 bg-card shadow-card">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Zap className="h-5 w-5 text-primary" />
                    {t('characterDetail.quickStats')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="p-4 rounded-lg bg-pow/10 border border-pow/20">
                      <div className="text-3xl font-bold text-pow">{character.stats.POW}</div>
                      <div className="text-xs text-muted-foreground mt-1">POW</div>
                    </div>
                    <div className="p-4 rounded-lg bg-tec/10 border border-tec/20">
                      <div className="text-3xl font-bold text-tec">{character.stats.TEC}</div>
                      <div className="text-xs text-muted-foreground mt-1">TEC</div>
                    </div>
                    <div className="p-4 rounded-lg bg-stm/10 border border-stm/20">
                      <div className="text-3xl font-bold text-stm">{character.stats.STM}</div>
                      <div className="text-xs text-muted-foreground mt-1">STM</div>
                    </div>
                  </div>
                  {character.stats.APL && (
                    <div className="p-4 rounded-lg bg-apl/10 border border-apl/20 text-center">
                      <div className="text-3xl font-bold text-apl">{character.stats.APL}</div>
                      <div className="text-xs text-muted-foreground mt-1">APL</div>
                    </div>
                  )}
                  <div className="pt-3 border-t border-border/50">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">{t('characterDetail.totalCombatPower')}</span>
                      <span className="text-2xl font-bold text-primary">
                        {character.stats.POW + character.stats.TEC + character.stats.STM}
                      </span>
                    </div>
                  </div>
                  <UniqueKeyDisplay uniqueKey={character.unique_key} />
                </CardContent>
              </Card>

              {/* Personal Info - Basic */}
              <Card className="border-border/50 bg-card shadow-card">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Heart className="h-5 w-5 text-primary" />
                    {t('characterDetail.personalInfo')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <Calendar className="h-5 w-5 text-primary flex-shrink-0" />
                      <div className="flex-1">
                        <div className="text-xs text-muted-foreground">{t('characterDetail.birthday')}</div>
                        <div className="font-medium">
                          <LocalizedText localized={character.birthday} showIndicator />
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <Ruler className="h-5 w-5 text-primary flex-shrink-0" />
                      <div className="flex-1">
                        <div className="text-xs text-muted-foreground">{t('characterDetail.height')}</div>
                        <div className="font-medium">
                          <LocalizedText localized={character.height} showIndicator />
                        </div>
                      </div>
                    </div>
                    {character.job && (
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                        <Award className="h-5 w-5 text-primary flex-shrink-0" />
                        <div className="flex-1">
                          <div className="text-xs text-muted-foreground">{t('characterDetail.job')}</div>
                          <div className="font-medium">
                            <LocalizedText localized={character.job} showIndicator />
                          </div>
                        </div>
                      </div>
                    )}
                    {character.blood_type && (
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                        <Heart className="h-5 w-5 text-primary flex-shrink-0" />
                        <div className="flex-1">
                          <div className="text-xs text-muted-foreground">{t('characterDetail.bloodType')}</div>
                          <div className="font-medium">
                            <LocalizedText localized={character.blood_type} showIndicator />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Favorites & More */}
              <Card className="border-border/50 bg-card shadow-card">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    {t('characterDetail.favorites')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <Heart className="h-5 w-5 text-primary flex-shrink-0" />
                      <div className="flex-1">
                        <div className="text-xs text-muted-foreground">{t('characterDetail.hobby')}</div>
                        <div className="font-medium">
                          <LocalizedText localized={character.hobby} showIndicator />
                        </div>
                      </div>
                    </div>
                    {character.food && (
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                        <Sparkles className="h-5 w-5 text-primary flex-shrink-0" />
                        <div className="flex-1">
                          <div className="text-xs text-muted-foreground">{t('characterDetail.favoriteFood')}</div>
                          <div className="font-medium">
                            <LocalizedText localized={character.food} showIndicator />
                          </div>
                        </div>
                      </div>
                    )}
                    {character.color && (
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                        <Sparkles className="h-5 w-5 text-primary flex-shrink-0" />
                        <div className="flex-1">
                          <div className="text-xs text-muted-foreground">{t('characterDetail.favoriteColor')}</div>
                          <div className="font-medium">
                            <LocalizedText localized={character.color} showIndicator />
                          </div>
                        </div>
                      </div>
                    )}
                    {character.cast && (character.cast.en || character.cast.jp) && (
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                        <Target className="h-5 w-5 text-primary flex-shrink-0" />
                        <div className="flex-1">
                          <div className="text-xs text-muted-foreground">{t('characterDetail.voiceActor')}</div>
                          <div className="font-medium">
                            <LocalizedText localized={character.cast} showIndicator />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>


          {/* Stats & Build Tab */}
          <TabsContent value="stats" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Character Analysis */}
              <Card className="border-border/50 bg-card shadow-card">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    {t('characterDetail.analysis')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2 text-foreground">{t('characterDetail.strengths')}</h4>
                    <div className="space-y-2">
                      {character.stats.POW >= 900 && (
                        <div className="flex items-start gap-2">
                          <Badge variant="outline" className="mt-0.5">POW</Badge>
                          <p className="text-sm text-muted-foreground">Exceptional power makes her ideal for offensive strategies and spike-focused teams.</p>
                        </div>
                      )}
                      {character.stats.TEC >= 900 && (
                        <div className="flex items-start gap-2">
                          <Badge variant="outline" className="mt-0.5">TEC</Badge>
                          <p className="text-sm text-muted-foreground">High technique allows for precise plays and excellent ball control in critical moments.</p>
                        </div>
                      )}
                      {character.stats.STM >= 900 && (
                        <div className="flex items-start gap-2">
                          <Badge variant="outline" className="mt-0.5">STM</Badge>
                          <p className="text-sm text-muted-foreground">Outstanding stamina enables sustained performance throughout long matches.</p>
                        </div>
                      )}
                      {character.stats.APL && character.stats.APL >= 95 && (
                        <div className="flex items-start gap-2">
                          <Badge variant="outline" className="mt-0.5">APL</Badge>
                          <p className="text-sm text-muted-foreground">Exceptional appeal rating boosts team morale and unlocks special interactions.</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2 text-foreground">{t('characterDetail.playstyle')}</h4>
                    <p className="text-sm text-muted-foreground">
                      {character.stats.POW > character.stats.TEC && character.stats.POW > character.stats.STM
                        ? "Best suited for aggressive offensive play. Focus on powerful spikes and front-line dominance."
                        : character.stats.TEC > character.stats.POW && character.stats.TEC > character.stats.STM
                        ? "Excels in technical play. Utilize precise sets, strategic positioning, and skill-based tactics."
                        : "Ideal for defensive and endurance-based strategies. Can maintain consistent performance throughout extended matches."}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2 text-foreground">{t('characterDetail.synergy')}</h4>
                    <p className="text-sm text-muted-foreground">
                      Works well with characters that complement her stat distribution. Consider pairing with support-type characters for balanced team composition.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Stat Comparison */}
              <Card className="border-border/50 bg-card shadow-card">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    {t('characterDetail.statBreakdown')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium">Power (POW)</span>
                        <span className="text-sm font-bold text-pow">{character.stats.POW}</span>
                      </div>
                      <Progress value={(character.stats.POW / 1000) * 100} className="h-2 bg-pow/20" />
                      <p className="text-xs text-muted-foreground mt-1">Affects spike damage and offensive capabilities</p>
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium">Technique (TEC)</span>
                        <span className="text-sm font-bold text-tec">{character.stats.TEC}</span>
                      </div>
                      <Progress value={(character.stats.TEC / 1000) * 100} className="h-2 bg-tec/20" />
                      <p className="text-xs text-muted-foreground mt-1">Improves ball control and precision</p>
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium">Stamina (STM)</span>
                        <span className="text-sm font-bold text-stm">{character.stats.STM}</span>
                      </div>
                      <Progress value={(character.stats.STM / 1000) * 100} className="h-2 bg-stm/20" />
                      <p className="text-xs text-muted-foreground mt-1">Determines endurance in long matches</p>
                    </div>
                  </div>
                  <div className="pt-3 border-t border-border/50">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">{t('characterDetail.dominantStat')}</span>
                      <Badge className="bg-primary text-primary-foreground">
                        {character.stats.POW >= character.stats.TEC && character.stats.POW >= character.stats.STM
                          ? t('characterDetail.powerType')
                          : character.stats.TEC >= character.stats.POW && character.stats.TEC >= character.stats.STM
                          ? t('characterDetail.techniqueType')
                          : t('characterDetail.staminaType')}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Team Building Recommendations */}
            <Card className="border-border/50 bg-card shadow-card">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  {t('characterDetail.teamBuilding')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-muted/50 border border-border/50">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Award className="h-4 w-4 text-primary" />
                      {t('characterDetail.bestPartners')}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Pair with characters who have complementary stats. Balance power with technique for optimal team performance.
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50 border border-border/50">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Zap className="h-4 w-4 text-primary" />
                      {t('characterDetail.recommendedPosition')}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {character.stats.POW > character.stats.TEC
                        ? "Front court - Utilize her power for aggressive spikes"
                        : "Back court - Leverage technique for strategic plays"}
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50 border border-border/50">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Target className="h-4 w-4 text-primary" />
                      {t('characterDetail.skillPriority')}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Focus on skills that enhance her strongest stat for maximum effectiveness in matches.
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50 border border-border/50">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      {t('characterDetail.equipmentTips')}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Equip swimsuits that boost her primary stat to maximize her potential in competitive play.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>


          {/* Collection Tab */}
          <TabsContent value="collection" className="space-y-6">
            {characterSwimsuits.length > 0 ? (
              <>
                <Card className="border-border/50 bg-card shadow-card">
                  <CardHeader>
                    <CardTitle className="text-xl flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-primary" />
                      {t('characterDetail.collectionOverview')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
                        <div className="text-3xl font-bold text-primary">{characterSwimsuits.length}</div>
                        <div className="text-sm text-muted-foreground mt-1">{t('characterDetail.totalSuits')}</div>
                      </div>
                      <div className="text-center p-4 rounded-lg bg-ssr/10 border border-ssr/20">
                        <div className="text-3xl font-bold text-ssr">{characterSwimsuits.filter(s => s.rarity === 'SSR').length}</div>
                        <div className="text-sm text-muted-foreground mt-1">{t('characterDetail.ssrSuits')}</div>
                      </div>
                      <div className="text-center p-4 rounded-lg bg-sr/10 border border-sr/20">
                        <div className="text-3xl font-bold text-sr">{characterSwimsuits.filter(s => s.rarity === 'SR').length}</div>
                        <div className="text-sm text-muted-foreground mt-1">{t('characterDetail.srSuits')}</div>
                      </div>
                      <div className="text-center p-4 rounded-lg bg-r/10 border border-r/20">
                        <div className="text-3xl font-bold text-r">{characterSwimsuits.filter(s => s.rarity === 'R').length}</div>
                        <div className="text-sm text-muted-foreground mt-1">{t('characterDetail.rSuits')}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                  {characterSwimsuits.map((suit) => {
                    const getRarityColor = (rarity: string) => {
                      switch (rarity) {
                        case 'SSR': return 'bg-ssr text-ssr-foreground';
                        case 'SR': return 'bg-sr text-sr-foreground';
                        case 'R': return 'bg-r text-r-foreground';
                        default: return 'bg-muted text-muted-foreground';
                      }
                    };
                    return (
                      <Link key={suit.id} to={`/swimsuits/${suit.unique_key}`}>
                        <Card className="border-border/50 bg-card shadow-card hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 group cursor-pointer overflow-hidden">
                          <div className="relative aspect-square overflow-hidden">
                            <DatasetImage 
                              src={suit.image} 
                              alt={suit.title} 
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
                            />
                            <Badge className={`absolute top-2 right-2 text-xs ${getRarityColor(suit.rarity)}`}>
                              {suit.rarity}
                            </Badge>
                          </div>
                          <CardContent className="p-2 sm:p-3">
                            <h3 className="font-medium text-xs sm:text-sm text-foreground truncate group-hover:text-primary transition-colors">
                              <LocalizedText localized={suit.name} />
                            </h3>
                            <div className="flex items-center gap-3 mt-2 text-xs sm:text-sm">
                              <span className="px-2 py-1 rounded bg-pow/10 text-pow font-semibold">{suit.stats.POW}</span>
                              <span className="px-2 py-1 rounded bg-tec/10 text-tec font-semibold">{suit.stats.TEC}</span>
                              <span className="px-2 py-1 rounded bg-stm/10 text-stm font-semibold">{suit.stats.STM}</span>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    );
                  })}
                </div>
              </>
            ) : (
              <Card className="border-border/50 bg-card shadow-card">
                <CardContent className="py-16 text-center">
                  <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg text-muted-foreground">{t('characterDetail.noSuits')}</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>


          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Personal Details */}
              <Card className="border-border/50 bg-card shadow-card">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Heart className="h-5 w-5 text-primary" />
                    {t('characterDetail.personalDetails')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-muted/50">
                      <div className="text-xs text-muted-foreground mb-1">{t('characterDetail.birthday')}</div>
                      <div className="font-semibold">
                        <LocalizedText localized={character.birthday} showIndicator />
                      </div>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/50">
                      <div className="text-xs text-muted-foreground mb-1">{t('characterDetail.height')}</div>
                      <div className="font-semibold">
                        <LocalizedText localized={character.height} showIndicator />
                      </div>
                    </div>
                    {character.measurements && (
                      <div className="p-4 rounded-lg bg-muted/50">
                        <div className="text-xs text-muted-foreground mb-1">{t('characterDetail.measurements')}</div>
                        <div className="font-semibold text-sm">
                          <LocalizedText localized={character.measurements} showIndicator />
                        </div>
                      </div>
                    )}
                    {character.blood_type && (
                      <div className="p-4 rounded-lg bg-muted/50">
                        <div className="text-xs text-muted-foreground mb-1">{t('characterDetail.bloodType')}</div>
                        <div className="font-semibold">
                          <LocalizedText localized={character.blood_type} showIndicator />
                        </div>
                      </div>
                    )}
                    {character.job && (
                      <div className="p-4 rounded-lg bg-muted/50">
                        <div className="text-xs text-muted-foreground mb-1">{t('characterDetail.job')}</div>
                        <div className="font-semibold">
                          <LocalizedText localized={character.job} showIndicator />
                        </div>
                      </div>
                    )}
                    {character.cast && (character.cast.en || character.cast.jp) && (
                      <div className="p-4 rounded-lg bg-muted/50">
                        <div className="text-xs text-muted-foreground mb-1">{t('characterDetail.voiceActor')}</div>
                        <div className="font-semibold">
                          <LocalizedText localized={character.cast} showIndicator />
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Favorites */}
              <Card className="border-border/50 bg-card shadow-card">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    {t('characterDetail.favorites')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-muted/50">
                      <div className="text-xs text-muted-foreground mb-1">{t('characterDetail.hobby')}</div>
                      <div className="font-semibold">
                        <LocalizedText localized={character.hobby} showIndicator />
                      </div>
                    </div>
                    {character.food && (
                      <div className="p-4 rounded-lg bg-muted/50">
                        <div className="text-xs text-muted-foreground mb-1">{t('characterDetail.favoriteFood')}</div>
                        <div className="font-semibold">
                          <LocalizedText localized={character.food} showIndicator />
                        </div>
                      </div>
                    )}
                    {character.color && (
                      <div className="p-4 rounded-lg bg-muted/50">
                        <div className="text-xs text-muted-foreground mb-1">{t('characterDetail.favoriteColor')}</div>
                        <div className="font-semibold">
                          <LocalizedText localized={character.color} showIndicator />
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="border-border/50 bg-card shadow-card">
              <CardHeader>
                <CardTitle className="text-xl">{t('characterDetail.story')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  {character.summary}
                </p>
                <div className="mt-6 p-4 rounded-lg bg-muted/50 border border-border/50">
                  <h4 className="font-semibold mb-2">{t('characterDetail.personalityTraits')}</h4>
                  <div className="flex flex-wrap gap-2">
                    {character.hobby && (
                      <Badge variant="outline">{t('characterDetail.enjoys')} <LocalizedText localized={character.hobby} /></Badge>
                    )}
                    {character.stats.POW >= 900 && <Badge variant="outline">Strong</Badge>}
                    {character.stats.TEC >= 900 && <Badge variant="outline">Skilled</Badge>}
                    {character.stats.STM >= 900 && <Badge variant="outline">Enduring</Badge>}
                    {character.stats.APL && character.stats.APL >= 95 && <Badge variant="outline">Charming</Badge>}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Related Guides */}
        <RelatedContent
          title={t('characterDetail.relatedGuides')}
          items={relatedGuides.map(guide => ({
            id: guide.id,
            title: guide.title,
            image: guide.image,
            href: `/guides/${guide.unique_key}`,
            badge: guide.category,
            description: guide.summary,
            }))}
            viewAllHref="/guides"
            viewAllLabel={t('characterDetail.viewAllGuides')}
          />

          {/* Other Girls */}
          <RelatedContent
            title={t('characterDetail.otherGirls')}
            items={otherGirls.map(girl => ({
              id: girl.id,
              title: getLocalizedValue(girl.name, currentLanguage),
              image: girl.image,
              href: `/girls/${girl.unique_key}`,
            }))}
            viewAllHref="/girls"
            viewAllLabel={t('characterDetail.viewAllGirls')}
          />

          <ScrollToTop />
        </ResponsiveContainer>
      </main>
    </div>
  );
};

export default CharacterDetailPage;
