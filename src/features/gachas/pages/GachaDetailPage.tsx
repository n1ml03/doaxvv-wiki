import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import Header from "@/shared/layouts/Header";
import { Breadcrumb, LocalizedText, DatasetImage, UniqueKeyDisplay } from "@/shared/components";
import { ResponsiveContainer } from "@/shared/components/responsive";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Progress } from "@/shared/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { Separator } from "@/shared/components/ui/separator";
import { 
  Clock, Sparkles, Star, Percent, Users, Shirt, Gift, Info,
  Calendar, TrendingUp, AlertCircle,
  Calculator, ChevronRight, Copy, ExternalLink, Check
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/shared/components/ui/tooltip";
import { useLanguage } from "@/shared/contexts/language-hooks";
import { getLocalizedValue } from "@/shared/utils/localization";
import { calculateTimeRemaining, formatTimeRemaining } from "@/shared/utils/countdown";
import type { Gacha, Character, Swimsuit } from "@/content/schemas/content.schema";
import { contentLoader } from "@/content";

import { useTranslation } from "@/shared/hooks/useTranslation";

const GachaDetailPage = () => {
  const { unique_key } = useParams<{ unique_key: string }>();
  const [gacha, setGacha] = useState<Gacha | null>(null);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [swimsuits, setSwimsuits] = useState<Swimsuit[]>([]);
  const [loading, setLoading] = useState(true);
  const [time, setTime] = useState(new Date());
  const [copied, setCopied] = useState(false);
  const { currentLanguage } = useLanguage();
  const { t } = useTranslation();

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Link gốc đến trang gacha trên DOAXVV official (có thể thay đổi theo cấu trúc thực tế)
  const getOriginalGachaUrl = () => {
    return `https://doax-venusvacation.jp/info/gacha/${unique_key}/`;
  };


  useEffect(() => {
    async function loadContent() {
      await contentLoader.initialize();
      const foundGacha = contentLoader.getGachaByUniqueKey(unique_key || '');
      
      if (foundGacha) {
        setGacha(foundGacha);
        const allCharacters = contentLoader.getCharacters();
        const allSwimsuits = contentLoader.getSwimsuits();
        
        const featuredChars = allCharacters.filter(c => 
          foundGacha.featured_characters.includes(c.unique_key)
        );
        const featuredSuits = allSwimsuits.filter(s => 
          foundGacha.featured_swimsuits.includes(s.unique_key)
        );
        
        setCharacters(featuredChars);
        setSwimsuits(featuredSuits);
      }
      setLoading(false);
    }
    loadContent();
  }, [unique_key]);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active": return "bg-stm text-white";
      case "Coming Soon": return "bg-tec text-white";
      case "Ended": return "bg-muted-foreground text-white";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getTypeFromName = (name: string): string => {
    if (name.toLowerCase().includes("premium")) return t('gachaType.premium');
    if (name.toLowerCase().includes("nostalgia")) return t('gachaType.nostalgia');
    if (name.toLowerCase().includes("v-stone")) return "V-Stone";
    if (name.toLowerCase().includes("special")) return t('gachaType.special');
    return t('gachaType.standard');
  };

  const getBannerRating = () => {
    if (!gacha) return 3;
    if (gacha.rates.ssr >= 4 && gacha.step_up) return 5;
    if (gacha.rates.ssr >= 4) return 4;
    if (gacha.step_up) return 4;
    if (gacha.pity_at <= 80) return 4;
    return 3;
  };

  const getExpectedPulls = () => {
    if (!gacha) return 0;
    return Math.ceil(100 / gacha.rates.ssr);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main id="main-content" className="py-6 sm:py-8" tabIndex={-1}>
          <ResponsiveContainer>
            <div className="text-center py-16">
              <div className="animate-pulse space-y-4">
                <div className="h-48 bg-muted rounded-xl" />
                <div className="h-8 bg-muted rounded w-1/3 mx-auto" />
                <p className="text-lg text-muted-foreground">{t('gachaDetail.loading')}</p>
              </div>
            </div>
          </ResponsiveContainer>
        </main>
      </div>
    );
  }

  if (!gacha) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main id="main-content" className="py-6 sm:py-8" tabIndex={-1}>
          <ResponsiveContainer>
            <div className="text-center py-16">
              <h1 className="text-2xl font-bold text-foreground mb-4">{t('gachaDetail.notFound')}</h1>
              <Link to="/gachas">
                <Button>{t('gachaDetail.backToGachas')}</Button>
              </Link>
            </div>
          </ResponsiveContainer>
        </main>
      </div>
    );
  }

  const timeRemaining = calculateTimeRemaining(new Date(gacha.end_date), time);
  const gachaType = getTypeFromName(getLocalizedValue(gacha.name, "en"));
  const bannerRating = getBannerRating();
  const expectedPulls = getExpectedPulls();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main id="main-content" className="py-6 sm:py-8" tabIndex={-1}>
        <ResponsiveContainer>
          <Breadcrumb 
            items={[
              { label: t('nav.gachas'), href: "/gachas" }, 
              { label: getLocalizedValue(gacha.name, currentLanguage) }
            ]} 
          />

          <div className="animate-fade-in space-y-6">
            {/* Hero Banner */}
            <div className="relative aspect-[21/9] rounded-xl sm:rounded-2xl overflow-hidden">
              <DatasetImage
                src={gacha.image}
                alt={getLocalizedValue(gacha.name, currentLanguage)}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-8">
                <div className="flex flex-wrap gap-2 mb-3">
                  <Badge className={getStatusColor(gacha.gacha_status)}>{t(`status.${gacha.gacha_status.toLowerCase().replace(" ", "")}`)}</Badge>
                  <Badge variant="outline" className="bg-background/90 text-foreground border-0">
                    {gachaType}
                  </Badge>
                  {gacha.step_up && (
                    <Badge className="bg-apl text-white">
                      <Sparkles className="h-3 w-3 mr-1" />
                      {t('gachaDetail.stepUpBonus')}
                    </Badge>
                  )}
                </div>
                <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold text-white mb-3">
                  <LocalizedText localized={gacha.name} showIndicator />
                </h1>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={handleCopyLink}
                          className="bg-background/90 hover:bg-background text-foreground gap-2"
                        >
                          {copied ? <Check className="h-4 w-4 text-stm" /> : <Copy className="h-4 w-4" />}
                          {copied ? t('gachaDetail.copied') : t('gachaDetail.copyLink')}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{t('gachaDetail.copyLink')}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="secondary"
                          size="sm"
                          asChild
                          className="bg-background/90 hover:bg-background text-foreground gap-2"
                        >
                          <a href={getOriginalGachaUrl()} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4" />
                            {t('gachaDetail.officialPage')}
                          </a>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{t('gachaDetail.officialPage')}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                
                {gacha.gacha_status === "Active" && !timeRemaining.isExpired && (
                  <div className="inline-flex bg-background/95 backdrop-blur rounded-lg px-4 py-2 shadow-lg">
                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-primary" />
                      <div>
                        <div className="text-xs text-muted-foreground">{t('gachaDetail.endsIn')}</div>
                        <div className="text-lg font-bold text-foreground">{formatTimeRemaining(timeRemaining)}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Stats Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-primary">{gacha.rates.ssr}%</div>
                  <div className="text-xs text-muted-foreground">{t('gachaDetail.ssrRate')}</div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-apl/10 to-apl/5 border-apl/20">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-apl">{gacha.pity_at}</div>
                  <div className="text-xs text-muted-foreground">{t('gachaDetail.pityCount')}</div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-ssr/10 to-ssr/5 border-ssr/20">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-ssr">~{expectedPulls}</div>
                  <div className="text-xs text-muted-foreground">{t('gachaDetail.avgPulls')}</div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-stm/10 to-stm/5 border-stm/20">
                <CardContent className="p-4 text-center">
                  <div className="flex justify-center">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`h-4 w-4 ${i < bannerRating ? 'fill-ssr text-ssr' : 'fill-muted text-muted'}`} />
                    ))}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">{t('gachaDetail.valueRating')}</div>
                </CardContent>
              </Card>
            </div>


            {/* Main Content with Tabs */}
            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="overview" className="gap-2">
                  <Info className="h-4 w-4" />
                  <span className="hidden sm:inline">{t('gachaDetail.tabs.overview')}</span>
                </TabsTrigger>
                <TabsTrigger value="rates" className="gap-2">
                  <Percent className="h-4 w-4" />
                  <span className="hidden sm:inline">{t('gachaDetail.tabs.rates')}</span>
                </TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Column - Featured Items */}
                  <div className="lg:col-span-2 space-y-6">

                    {/* Featured Characters */}
                    {characters.length > 0 && (
                      <Card className="border-border/50 bg-card shadow-sm">
                        <CardHeader className="pb-3">
                          <CardTitle className="flex items-center gap-2 text-lg">
                            <Users className="h-5 w-5 text-primary" />
                            {t('gachaDetail.featuredCharacters')}
                            <Badge variant="secondary" className="ml-auto">{characters.length}</Badge>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {characters.map((character) => (
                              <Link key={character.id} to={`/girls/${character.unique_key}`}>
                                <div className="group relative rounded-lg overflow-hidden bg-muted/50 hover:bg-muted transition-all hover:shadow-md">
                                  <div className="aspect-square overflow-hidden">
                                    <DatasetImage
                                      src={character.image}
                                      alt={getLocalizedValue(character.name, currentLanguage)}
                                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                                    />
                                  </div>
                                  <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                  <div className="p-2">
                                    <p className="font-medium text-foreground text-sm truncate">
                                      <LocalizedText localized={character.name} />
                                    </p>
                                  </div>
                                  <ChevronRight className="absolute bottom-2 right-2 h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                              </Link>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Featured Swimsuits */}
                    {swimsuits.length > 0 && (
                      <Card className="border-border/50 bg-card shadow-sm">
                        <CardHeader className="pb-3">
                          <CardTitle className="flex items-center gap-2 text-lg">
                            <Shirt className="h-5 w-5 text-primary" />
                            {t('gachaDetail.featuredSwimsuits')}
                            <Badge variant="secondary" className="ml-auto">{swimsuits.length}</Badge>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {swimsuits.map((swimsuit) => (
                              <Link key={swimsuit.id} to={`/swimsuits/${swimsuit.unique_key}`}>
                                <div className="group relative rounded-lg overflow-hidden bg-muted/50 hover:bg-muted transition-all hover:shadow-md">
                                  <div className="aspect-square overflow-hidden">
                                    <DatasetImage
                                      src={swimsuit.image}
                                      alt={getLocalizedValue(swimsuit.name, currentLanguage)}
                                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                                    />
                                  </div>
                                  <div className="p-2">
                                    <p className="font-medium text-foreground text-sm truncate">
                                      <LocalizedText localized={swimsuit.name} />
                                    </p>
                                    <Badge variant="outline" className="mt-1 text-xs">
                                      {swimsuit.rarity}
                                    </Badge>
                                  </div>
                                </div>
                              </Link>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Fallback if no featured items loaded */}
                    {characters.length === 0 && swimsuits.length === 0 && (
                      <Card className="border-border/50 bg-card shadow-sm">
                        <CardHeader className="pb-3">
                          <CardTitle className="flex items-center gap-2 text-lg">
                            <Sparkles className="h-5 w-5 text-primary" />
                            {t('gachaDetail.featuredItems')}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {gacha.featured_characters.map((charKey, index) => (
                              <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                                <div className="p-2 rounded-full bg-primary/10">
                                  <Users className="h-4 w-4 text-primary" />
                                </div>
                                <span className="text-sm text-foreground capitalize font-medium">{charKey.replace(/-/g, ' ')}</span>
                              </div>
                            ))}
                            {gacha.featured_swimsuits.map((suitKey, index) => (
                              <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                                <div className="p-2 rounded-full bg-accent/10">
                                  <Shirt className="h-4 w-4 text-accent" />
                                </div>
                                <span className="text-sm text-foreground capitalize font-medium">{suitKey.replace(/-/g, ' ')}</span>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>

                  {/* Right Column - Info Cards */}
                  <div className="space-y-4">
                    {/* Schedule Card */}
                    <Card className="border-border/50 bg-card shadow-sm">
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-base">
                          <Calendar className="h-4 w-4 text-primary" />
                          {t('gachaDetail.schedule')}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">{t('gachaDetail.start')}</span>
                          <span className="font-medium">{new Date(gacha.start_date).toLocaleDateString()}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">{t('gachaDetail.end')}</span>
                          <span className="font-medium">{new Date(gacha.end_date).toLocaleDateString()}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">{t('gachaDetail.duration')}</span>
                          <span className="font-medium">
                            {Math.ceil((new Date(gacha.end_date).getTime() - new Date(gacha.start_date).getTime()) / (1000 * 60 * 60 * 24))} {t('gachaDetail.days')}
                          </span>
                        </div>
                        {gacha.gacha_status === "Active" && !timeRemaining.isExpired && (
                          <>
                            <Separator />
                            <div className="p-3 bg-primary/10 rounded-lg">
                              <div className="text-xs text-muted-foreground mb-1">{t('gachaDetail.timeRemaining')}</div>
                              <div className="text-lg font-bold text-primary">{formatTimeRemaining(timeRemaining)}</div>
                            </div>
                          </>
                        )}
                        <Separator />
                        <UniqueKeyDisplay uniqueKey={gacha.unique_key} />
                      </CardContent>
                    </Card>

                    {/* Pity System Card */}
                    <Card className="border-border/50 bg-card shadow-sm">
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-base">
                          <Gift className="h-4 w-4 text-primary" />
                          {t('gachaDetail.pitySystem')}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg text-center">
                          <div className="text-3xl font-bold text-primary">{gacha.pity_at}</div>
                          <div className="text-sm text-muted-foreground">{t('gachaDetail.pityText')}</div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {t('gachaDetail.pityDesc').replace('{count}', gacha.pity_at.toString())}
                        </p>
                      </CardContent>
                    </Card>

                    {/* Step-Up Details */}
                    {gacha.step_up && (
                      <Card className="border-apl/30 bg-gradient-to-br from-apl/5 to-transparent shadow-sm">
                        <CardHeader className="pb-3">
                          <CardTitle className="flex items-center gap-2 text-base">
                            <Sparkles className="h-4 w-4 text-apl" />
                            {t('gachaDetail.stepUpBonuses')}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                            <span className="text-sm font-medium">{t('gachaDetail.step').replace('{num}', '1')}</span>
                            <Badge variant="outline" className="text-stm border-stm/30">{t('gachaDetail.off').replace('{percent}', '50')}</Badge>
                          </div>
                          <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                            <span className="text-sm font-medium">{t('gachaDetail.step').replace('{num}', '3')}</span>
                            <Badge variant="outline" className="text-tec border-tec/30">{t('gachaDetail.srGuaranteed')}</Badge>
                          </div>
                          <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                            <span className="text-sm font-medium">{t('gachaDetail.step').replace('{num}', '5')}</span>
                            <Badge variant="outline" className="text-apl border-apl/30">{t('gachaDetail.ssrGuaranteed')}</Badge>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              </TabsContent>


              {/* Rates Tab */}
              <TabsContent value="rates" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Pull Rates Card */}
                  <Card className="border-border/50 bg-card shadow-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Percent className="h-5 w-5 text-primary" />
                        {t('gachaDetail.pullRates')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* SSR Rate */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-2 text-foreground font-medium">
                            <div className="flex">
                              {[1,2,3].map(i => <Star key={i} className="h-4 w-4 fill-ssr text-ssr" />)}
                            </div>
                            SSR
                          </span>
                          <span className="text-xl font-bold text-primary">{gacha.rates.ssr}%</span>
                        </div>
                        <Progress value={gacha.rates.ssr * 10} className="h-3" />
                        <p className="text-xs text-muted-foreground">
                          {t('gachaDetail.avgPullsDesc').replace('{count}', Math.round(100 / gacha.rates.ssr).toString())}
                        </p>
                      </div>

                      {/* SR Rate */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-2 text-foreground font-medium">
                            <div className="flex">
                              {[1,2].map(i => <Star key={i} className="h-4 w-4 fill-apl text-apl" />)}
                            </div>
                            SR
                          </span>
                          <span className="text-xl font-bold text-apl">{gacha.rates.sr}%</span>
                        </div>
                        <Progress value={gacha.rates.sr * 3.33} className="h-3" />
                      </div>

                      {/* R Rate */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-2 text-foreground font-medium">
                            <Star className="h-4 w-4 fill-muted-foreground text-muted-foreground" />
                            R
                          </span>
                          <span className="text-xl font-bold text-muted-foreground">{gacha.rates.r}%</span>
                        </div>
                        <Progress value={gacha.rates.r} className="h-3" />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Cost Calculator */}
                  <Card className="border-border/50 bg-card shadow-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Calculator className="h-5 w-5 text-primary" />
                        {t('gachaDetail.costEstimation')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="p-4 bg-muted/50 rounded-lg">
                        <div className="text-sm text-muted-foreground mb-1">{t('gachaDetail.expectedPulls')}</div>
                        <div className="text-2xl font-bold text-foreground">~{expectedPulls} {t('gachaDetail.pulls')}</div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-muted/30 rounded-lg text-center">
                          <div className="text-lg font-bold text-foreground">{expectedPulls * 100}</div>
                          <div className="text-xs text-muted-foreground">{t('gachaDetail.vstonesAvg')}</div>
                        </div>
                        <div className="p-3 bg-muted/30 rounded-lg text-center">
                          <div className="text-lg font-bold text-foreground">{gacha.pity_at * 100}</div>
                          <div className="text-xs text-muted-foreground">{t('gachaDetail.vstonesWorst')}</div>
                        </div>
                      </div>

                      <div className="p-3 bg-ssr/10 rounded-lg border border-ssr/20">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="h-4 w-4 text-ssr mt-0.5 flex-shrink-0" />
                          <p className="text-xs text-muted-foreground">
                            {t('gachaDetail.disclaimer')}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Rate Comparison */}
                <Card className="border-border/50 bg-card shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      {t('gachaDetail.rateAnalysis')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 rounded-lg bg-muted/50 text-center">
                        <div className={`text-lg font-bold ${gacha.rates.ssr >= 3.5 ? 'text-stm' : gacha.rates.ssr >= 3 ? 'text-ssr' : 'text-pow'}`}>
                          {gacha.rates.ssr >= 3.5 ? t('gachaDetail.aboveAverage') : gacha.rates.ssr >= 3 ? t('gachaDetail.average') : t('gachaDetail.belowAverage')}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">{t('gachaDetail.ssrRateVs')}</div>
                      </div>
                      <div className="p-4 rounded-lg bg-muted/50 text-center">
                        <div className={`text-lg font-bold ${gacha.pity_at <= 80 ? 'text-stm' : gacha.pity_at <= 100 ? 'text-ssr' : 'text-pow'}`}>
                          {gacha.pity_at <= 80 ? t('gachaDetail.generous') : gacha.pity_at <= 100 ? t('gachaDetail.standard') : t('gachaDetail.high')}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">{t('gachaDetail.pityCount')}</div>
                      </div>
                      <div className="p-4 rounded-lg bg-muted/50 text-center">
                        <div className={`text-lg font-bold ${gacha.step_up ? 'text-stm' : 'text-muted-foreground'}`}>
                          {gacha.step_up ? t('gachaDetail.yes') : t('gachaDetail.no')}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">{t('gachaDetail.stepUpBonus')}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </ResponsiveContainer>
      </main>
    </div>
  );
};

export default GachaDetailPage;
