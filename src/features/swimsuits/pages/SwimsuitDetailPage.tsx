import { useParams, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { Header } from "@/shared/layouts";
import { Breadcrumb, RelatedContent, LocalizedText, ResponsiveContainer, DatasetImage, UniqueKeyDisplay } from "@/shared/components";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Progress } from "@/shared/components/ui/progress";
import { Star, TrendingUp, Info, X, ZoomIn } from "lucide-react";
import { contentLoader } from "@/content";
import type { Swimsuit, Character, Guide } from "@/content";
import { getLocalizedValue } from "@/shared/utils/localization";
import { useLanguage } from "@/shared/contexts/language-hooks";

import { useTranslation } from "@/shared/hooks/useTranslation";

const SwimsuitDetailPage = () => {
  const { unique_key } = useParams<{ unique_key: string }>();
  const { currentLanguage } = useLanguage();
  const { t } = useTranslation();
  const [swimsuit, setSwimsuit] = useState<Swimsuit | null>(null);
  const [character, setCharacter] = useState<Character | null>(null);
  const [relatedSuits, setRelatedSuits] = useState<Swimsuit[]>([]);
  const [otherSwimsuits, setOtherSwimsuits] = useState<Swimsuit[]>([]);
  const [relatedGuides, setRelatedGuides] = useState<Guide[]>([]);
  const [loading, setLoading] = useState(true);
  const [isImageEnlarged, setIsImageEnlarged] = useState(false);
  const [imageType, setImageType] = useState<'bromide' | 'deco-bromide'>('bromide');

  useEffect(() => {
    async function loadContent() {
      await contentLoader.initialize();
      const foundSuit = contentLoader.getSwimsuitByUniqueKey(unique_key || "");
      setSwimsuit(foundSuit || null);
      
      if (foundSuit) {
        const foundChar = contentLoader.getCharacterByUniqueKey(foundSuit.character_id);
        setCharacter(foundChar || null);
        
        const allSwimsuits = contentLoader.getSwimsuits();
        const related = allSwimsuits.filter(s => 
          s.character_id === foundSuit.character_id && s.id !== foundSuit.id
        ).slice(0, 4);
        setRelatedSuits(related);
        
        // Get swimsuits from other characters (same rarity or random)
        const otherCharSwimsuits = allSwimsuits
          .filter(s => s.character_id !== foundSuit.character_id && s.id !== foundSuit.id)
          .sort(() => Math.random() - 0.5)
          .slice(0, 4);
        setOtherSwimsuits(otherCharSwimsuits);
        
        const allGuides = contentLoader.getGuides();
        setRelatedGuides(allGuides.filter(g => 
          g.topics.some(t => t.toLowerCase().includes("swimsuit") || t.toLowerCase().includes("equipment"))
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
            <div className="text-center py-16">
              <p className="text-lg text-muted-foreground">{t('swimsuitDetail.loading')}</p>
            </div>
          </ResponsiveContainer>
        </main>
      </div>
    );
  }

  if (!swimsuit) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main id="main-content" className="py-6 sm:py-8" tabIndex={-1}>
          <ResponsiveContainer>
            <Breadcrumb items={[{ label: t('nav.swimsuits'), href: "/swimsuits" }, { label: t('swimsuitDetail.notFound') }]} />
            <div className="text-center py-16">
              <h1 className="text-2xl font-bold text-foreground mb-4">{t('swimsuitDetail.notFound')}</h1>
              <Link to="/swimsuits">
                <Button>{t('swimsuitDetail.backToSwimsuits')}</Button>
              </Link>
            </div>
          </ResponsiveContainer>
        </main>
      </div>
    );
  }

  // Determine if toggle should be shown (only if deco-bromide exists)
  const hasDecoBromide = swimsuit?.deco_bromide_image != null && swimsuit.deco_bromide_image !== '';

  // Get current image based on selected type
  // bromide = swimsuit.image (default)
  // deco-bromide = swimsuit.deco_bromide_image (alternative)
  const currentImage = swimsuit 
    ? (imageType === 'deco-bromide' && hasDecoBromide 
        ? swimsuit.deco_bromide_image! 
        : swimsuit.image)
    : '';

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "SSR": return "bg-ssr text-ssr-foreground";
      case "SR": return "bg-sr text-sr-foreground";
      case "R": return "bg-r text-r-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main id="main-content" className="py-6 sm:py-8" tabIndex={-1}>
        <ResponsiveContainer>
          <Breadcrumb items={[
            { label: t('nav.swimsuits'), href: "/swimsuits" }, 
            { label: getLocalizedValue(swimsuit.name, currentLanguage) }
          ]} />

          {/* Grid layout - image stacks on top on mobile */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 animate-fade-in">
            {/* Swimsuit Image */}
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
                    src={currentImage}
                    alt={swimsuit.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute top-3 left-3 sm:top-4 sm:left-4 flex flex-col gap-2">
                    <Badge className={getRarityColor(swimsuit.rarity)}>
                      {swimsuit.rarity}
                    </Badge>
                  </div>
                  {/* Image type toggle buttons */}
                  {hasDecoBromide && (
                    <div 
                      className="absolute top-3 right-3 z-10 flex gap-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        variant={imageType === 'bromide' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setImageType('bromide')}
                        className="text-xs"
                      >
                        Bromide
                      </Button>
                      <Button
                        variant={imageType === 'deco-bromide' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setImageType('deco-bromide')}
                        className="text-xs"
                      >
                        Deco
                      </Button>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                    <ZoomIn className="h-12 w-12 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                </div>
              </Card>
            </div>

            {/* Swimsuit Info */}
            <div className="lg:col-span-1 space-y-4 sm:space-y-6">
              <div>
                <div className="flex items-center gap-2 sm:gap-3 mb-2">
                  <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground">
                    <LocalizedText localized={swimsuit.name} showIndicator />
                  </h1>
                </div>
                <p className="text-base sm:text-lg text-muted-foreground mb-4">{swimsuit.summary}</p>
              
                {character && (
                  <Link to={`/girls/${character.unique_key}`}>
                    <Button variant="outline" className="gap-2">
                      <Star className="h-4 w-4" />
                      {t('swimsuitDetail.viewCharacter').replace('{character}', swimsuit.character)}
                    </Button>
                  </Link>
                )}
              </div>

                {/* Stats */}
              <Card className="border-border/50 bg-card shadow-card">
              <CardHeader>
                <CardTitle className="text-xl">{t('swimsuitDetail.battleStats')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{t('swimsuitDetail.stats.pow')}</span>
                    <span className="text-primary font-bold">{swimsuit.stats.POW}</span>
                  </div>
                  <Progress value={(swimsuit.stats.POW / 1000) * 100} className="h-3" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{t('swimsuitDetail.stats.tec')}</span>
                    <span className="text-primary font-bold">{swimsuit.stats.TEC}</span>
                  </div>
                  <Progress value={(swimsuit.stats.TEC / 1000) * 100} className="h-3" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{t('swimsuitDetail.stats.stm')}</span>
                    <span className="text-primary font-bold">{swimsuit.stats.STM}</span>
                  </div>
                  <Progress value={(swimsuit.stats.STM / 1000) * 100} className="h-3" />
                </div>
              </CardContent>
              </Card>


                {/* Skill */}
              {swimsuit.skills && swimsuit.skills.length > 0 && (
                <Card className="border-border/50 bg-card shadow-card">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    {t('swimsuitDetail.skills')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {swimsuit.skills.map((skill, index) => (
                      <div key={index}>
                        <div className="text-sm font-medium text-primary mb-1">
                          <LocalizedText localized={skill.name} showIndicator />
                        </div>
                        <p className="text-muted-foreground">
                          <LocalizedText localized={skill.description} showIndicator />
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
                </Card>
              )}

              {/* Additional Info */}
              <Card className="border-border/50 bg-gradient-to-br from-primary/5 to-accent/5 shadow-card">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Info className="h-5 w-5 text-primary" />
                    {t('swimsuitDetail.additionalInfo')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-muted-foreground">{t('swimsuitDetail.author')}: {swimsuit.author} | {t('swimsuitDetail.updated')}: {swimsuit.updated_at}</p>
                  <UniqueKeyDisplay uniqueKey={swimsuit.unique_key} />
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Related Swimsuits */}
          {relatedSuits.length > 0 && (
            <RelatedContent
              title={t('swimsuitDetail.moreSwimsuits').replace('{character}', swimsuit.character)}
              items={relatedSuits.map(suit => ({
                id: suit.id,
                title: getLocalizedValue(suit.name, currentLanguage),
                image: suit.image,
                href: `/swimsuits/${suit.unique_key}`,
                badge: suit.rarity,
                description: suit.skills && suit.skills.length > 0 
                  ? getLocalizedValue(suit.skills[0].name, currentLanguage) 
                  : suit.title,
              }))}
              viewAllHref="/swimsuits"
              viewAllLabel={t('swimsuitDetail.viewAllSwimsuits')}
            />
          )}

          {/* Other Swimsuits */}
          {otherSwimsuits.length > 0 && (
            <RelatedContent
              title={t('swimsuitDetail.otherSwimsuits')}
              items={otherSwimsuits.map(suit => ({
                id: suit.id,
                title: getLocalizedValue(suit.name, currentLanguage),
                image: suit.image,
                href: `/swimsuits/${suit.unique_key}`,
                badge: suit.rarity,
                description: suit.character,
              }))}
              viewAllHref="/swimsuits"
              viewAllLabel={t('swimsuitDetail.viewAllSwimsuits')}
            />
          )}

          {/* Related Guides */}
          <RelatedContent
            title={t('swimsuitDetail.relatedGuides')}
            items={relatedGuides.map(guide => ({
              id: guide.id,
              title: guide.title,
              image: guide.image,
              href: `/guides/${guide.unique_key}`,
              badge: t(`difficulty.${guide.difficulty.toLowerCase()}`),
              description: guide.summary,
            }))}
            viewAllHref="/guides"
            viewAllLabel={t('swimsuitDetail.viewAllGuides')}
          />
        </ResponsiveContainer>
      </main>

      {/* Image Enlargement Modal */}
      {isImageEnlarged && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setIsImageEnlarged(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Enlarged swimsuit image"
        >
          <button
            onClick={() => setIsImageEnlarged(false)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            aria-label="Close enlarged image"
          >
            <X className="h-6 w-6 text-white" />
          </button>
          {/* Image type toggle in modal */}
          {hasDecoBromide && (
            <div 
              className="absolute top-4 left-4 z-10 flex gap-2"
              onClick={(e) => e.stopPropagation()}
            >
              <Button
                variant={imageType === 'bromide' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setImageType('bromide')}
                className="text-xs"
              >
                Bromide
              </Button>
              <Button
                variant={imageType === 'deco-bromide' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setImageType('deco-bromide')}
                className="text-xs"
              >
                Deco
              </Button>
            </div>
          )}
          <DatasetImage
            src={currentImage}
            alt={swimsuit.title}
            className="w-full h-full object-contain cursor-zoom-out"
          />
        </div>
      )}
    </div>
  );
};

export default SwimsuitDetailPage;
