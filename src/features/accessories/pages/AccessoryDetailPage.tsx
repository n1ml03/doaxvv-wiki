import { useParams, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { Header } from "@/shared/layouts";
import { Breadcrumb, RelatedContent, LocalizedText, ResponsiveContainer, DatasetImage, UniqueKeyDisplay, ScrollToTop } from "@/shared/components";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Progress } from "@/shared/components/ui/progress";
import { Gem, Info, Users, ShoppingBag, Sparkles, X, ZoomIn } from "lucide-react";
import { contentLoader } from "@/content";
import type { Accessory, Character, Event, Gacha } from "@/content";
import { getLocalizedValue } from "@/shared/utils/localization";
import { useLanguage } from "@/shared/contexts/language-hooks";
import { useTranslation } from "@/shared/hooks/useTranslation";

const AccessoryDetailPage = () => {
  const { unique_key } = useParams<{ unique_key: string }>();
  const { currentLanguage } = useLanguage();
  const { t } = useTranslation();
  const [accessory, setAccessory] = useState<Accessory | null>(null);
  const [associatedCharacters, setAssociatedCharacters] = useState<Character[]>([]);
  const [relatedAccessories, setRelatedAccessories] = useState<Accessory[]>([]);
  const [relatedEvent, setRelatedEvent] = useState<Event | null>(null);
  const [relatedGacha, setRelatedGacha] = useState<Gacha | null>(null);
  const [loading, setLoading] = useState(true);
  const [isImageEnlarged, setIsImageEnlarged] = useState(false);

  useEffect(() => {
    async function loadContent() {
      await contentLoader.initialize();
      const foundAccessory = contentLoader.getAccessoryByKey(unique_key || "");
      setAccessory(foundAccessory || null);
      
      if (foundAccessory) {
        // Get associated characters
        const chars = foundAccessory.character_ids
          .map(id => contentLoader.getCharacterByUniqueKey(id))
          .filter((c): c is Character => c !== undefined);
        setAssociatedCharacters(chars);
        
        // Get related accessories (same rarity or same obtain method)
        const allAccessories = contentLoader.getAccessories();
        const related = allAccessories.filter(a => 
          a.id !== foundAccessory.id && 
          (a.rarity === foundAccessory.rarity || a.obtain_method === foundAccessory.obtain_method)
        ).slice(0, 4);
        setRelatedAccessories(related);
        
        // Get related event/gacha if obtain_source exists
        if (foundAccessory.obtain_source) {
          if (foundAccessory.obtain_method === 'Event') {
            const event = contentLoader.getEventByUniqueKey(foundAccessory.obtain_source);
            setRelatedEvent(event || null);
          } else if (foundAccessory.obtain_method === 'Gacha') {
            const gacha = contentLoader.getGachaByUniqueKey(foundAccessory.obtain_source);
            setRelatedGacha(gacha || null);
          }
        }
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
            <div className="text-center py-16">
              <p className="text-lg text-muted-foreground">{t('accessoryDetail.loading')}</p>
            </div>
          </ResponsiveContainer>
        </main>
      </div>
    );
  }

  if (!accessory) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main id="main-content" className="py-6 sm:py-8" tabIndex={-1}>
          <ResponsiveContainer>
            <Breadcrumb items={[{ label: t('nav.accessories'), href: "/accessories" }, { label: t('accessoryDetail.notFound') }]} />
            <div className="text-center py-16">
              <h1 className="text-2xl font-bold text-foreground mb-4">{t('accessoryDetail.notFound')}</h1>
              <Link to="/accessories">
                <Button>{t('accessoryDetail.backToAccessories')}</Button>
              </Link>
            </div>
          </ResponsiveContainer>
        </main>
      </div>
    );
  }

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "SSR": return "bg-ssr text-ssr-foreground";
      case "SR": return "bg-sr text-sr-foreground";
      case "R": return "bg-r text-r-foreground";
      case "N": return "bg-muted text-muted-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const maxStat = 100; // For progress bar scaling

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main id="main-content" className="py-6 sm:py-8" tabIndex={-1}>
        <ResponsiveContainer>
          <Breadcrumb items={[
            { label: t('nav.accessories'), href: "/accessories" }, 
            { label: getLocalizedValue(accessory.name, currentLanguage) }
          ]} />

          {/* Grid layout - image stacks on top on mobile */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 animate-fade-in">
            {/* Accessory Image */}
            <div className="lg:col-span-1">
              <Card className="overflow-hidden border-border/50 bg-card shadow-card lg:sticky lg:top-24">
                <div 
                  className="relative aspect-square cursor-pointer group"
                  onClick={() => setIsImageEnlarged(true)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && setIsImageEnlarged(true)}
                  aria-label="Click to enlarge image"
                >
                  <DatasetImage
                    src={accessory.image}
                    alt={getLocalizedValue(accessory.name, currentLanguage)}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute top-3 left-3 sm:top-4 sm:left-4 flex flex-col gap-2">
                    <Badge className={getRarityColor(accessory.rarity)}>
                      {accessory.rarity}
                    </Badge>
                    <Badge className="bg-primary/80 text-primary-foreground">
                      <Gem className="h-3 w-3 mr-1" />
                      {t(`obtainMethod.${accessory.obtain_method.toLowerCase()}`)}
                    </Badge>
                  </div>
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                    <ZoomIn className="h-12 w-12 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                </div>
              </Card>
            </div>

            {/* Accessory Info */}
            <div className="lg:col-span-2 space-y-4 sm:space-y-6">
              <div>
                <div className="flex items-center gap-2 sm:gap-3 mb-2">
                  <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground">
                    <LocalizedText localized={accessory.name} showIndicator />
                  </h1>
                </div>
                {accessory.description && (
                  <p className="text-base sm:text-lg text-muted-foreground mb-4">
                    <LocalizedText localized={accessory.description} showIndicator />
                  </p>
                )}
              </div>

              {/* Effect */}
              {accessory.effect && (
                <Card className="border-border/50 bg-card shadow-card">
                  <CardHeader>
                    <CardTitle className="text-xl flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-primary" />
                      {t('accessoryDetail.effect')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      <LocalizedText localized={accessory.effect} showIndicator />
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Stats */}
              {accessory.stats && Object.keys(accessory.stats).length > 0 && (
                <Card className="border-border/50 bg-card shadow-card">
                  <CardHeader>
                    <CardTitle className="text-xl">{t('accessoryDetail.stats')}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {accessory.stats.POW !== undefined && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">{t('characters.stats.pow')}</span>
                          <span className="text-primary font-bold">+{accessory.stats.POW}</span>
                        </div>
                        <Progress value={(accessory.stats.POW / maxStat) * 100} className="h-3" />
                      </div>
                    )}
                    {accessory.stats.TEC !== undefined && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">{t('characters.stats.tec')}</span>
                          <span className="text-primary font-bold">+{accessory.stats.TEC}</span>
                        </div>
                        <Progress value={(accessory.stats.TEC / maxStat) * 100} className="h-3" />
                      </div>
                    )}
                    {accessory.stats.STM !== undefined && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">{t('characters.stats.stm')}</span>
                          <span className="text-primary font-bold">+{accessory.stats.STM}</span>
                        </div>
                        <Progress value={(accessory.stats.STM / maxStat) * 100} className="h-3" />
                      </div>
                    )}
                    {accessory.stats.APL !== undefined && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">{t('characters.stats.apl')}</span>
                          <span className="text-primary font-bold">+{accessory.stats.APL}</span>
                        </div>
                        <Progress value={(accessory.stats.APL / maxStat) * 100} className="h-3" />
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Associated Characters */}
              {associatedCharacters.length > 0 && (
                <Card className="border-border/50 bg-card shadow-card">
                  <CardHeader>
                    <CardTitle className="text-xl flex items-center gap-2">
                      <Users className="h-5 w-5 text-primary" />
                      {t('accessoryDetail.associatedCharacters')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {associatedCharacters.map(char => (
                        <Link key={char.unique_key} to={`/girls/${char.unique_key}`}>
                          <Button variant="outline" size="sm" className="gap-2">
                            {getLocalizedValue(char.name, currentLanguage)}
                          </Button>
                        </Link>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Obtain Method */}
              <Card className="border-border/50 bg-card shadow-card">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <ShoppingBag className="h-5 w-5 text-primary" />
                    {t('accessoryDetail.howToObtain')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-primary/80 text-primary-foreground">
                      {t(`obtainMethod.${accessory.obtain_method.toLowerCase()}`)}
                    </Badge>
                    {accessory.obtain_source && (
                      <span className="text-muted-foreground">
                        {accessory.obtain_source}
                      </span>
                    )}
                  </div>
                  {relatedEvent && (
                    <Link to={`/events/${relatedEvent.unique_key}`}>
                      <Button variant="outline" size="sm" className="gap-2 mt-2">
                        {t('accessoryDetail.viewEvent')}
                      </Button>
                    </Link>
                  )}
                  {relatedGacha && (
                    <Link to={`/gachas/${relatedGacha.unique_key}`}>
                      <Button variant="outline" size="sm" className="gap-2 mt-2">
                        {t('accessoryDetail.viewGacha')}
                      </Button>
                    </Link>
                  )}
                </CardContent>
              </Card>

              {/* Additional Info */}
              <Card className="border-border/50 bg-gradient-to-br from-primary/5 to-accent/5 shadow-card">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Info className="h-5 w-5 text-primary" />
                    {t('accessoryDetail.additionalInfo')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-muted-foreground">{t('accessoryDetail.author')}: {accessory.author} | {t('accessoryDetail.updated')}: {accessory.updated_at}</p>
                  <UniqueKeyDisplay uniqueKey={accessory.unique_key} />
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Related Accessories */}
          {relatedAccessories.length > 0 && (
            <RelatedContent
              title={t('accessoryDetail.relatedAccessories')}
              items={relatedAccessories.map(acc => ({
                id: acc.id,
                title: getLocalizedValue(acc.name, currentLanguage),
                image: acc.image,
                href: `/accessories/${acc.unique_key}`,
                badge: acc.rarity,
                description: acc.description ? getLocalizedValue(acc.description, currentLanguage) : '',
              }))}
              viewAllHref="/accessories"
              viewAllLabel={t('accessoryDetail.viewAllAccessories')}
            />
          )}
        </ResponsiveContainer>
      </main>

      <ScrollToTop />

      {/* Image Enlargement Modal */}
      {isImageEnlarged && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setIsImageEnlarged(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Enlarged accessory image"
        >
          <button
            onClick={() => setIsImageEnlarged(false)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            aria-label="Close enlarged image"
          >
            <X className="h-6 w-6 text-white" />
          </button>
          <DatasetImage
            src={accessory.image}
            alt={getLocalizedValue(accessory.name, currentLanguage)}
            className="w-full h-full object-contain cursor-zoom-out"
          />
        </div>
      )}
    </div>
  );
};

export default AccessoryDetailPage;
