import { useParams, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { Header } from "@/shared/layouts";
import { Breadcrumb, RelatedContent, ResponsiveContainer, DatasetImage, UniqueKeyDisplay, LocalizedText, ScrollToTop } from "@/shared/components";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Package, Info, Layers } from "lucide-react";
import { contentLoader } from "@/content";
import type { Item, Guide } from "@/content";

import { useTranslation } from "@/shared/hooks/useTranslation";

const ItemDetailPage = () => {
  const { t } = useTranslation();
  const { unique_key } = useParams<{ unique_key: string }>();
  const [item, setItem] = useState<Item | null>(null);
  const [relatedItems, setRelatedItems] = useState<Item[]>([]);
  const [relatedGuides, setRelatedGuides] = useState<Guide[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadContent() {
      await contentLoader.initialize();
      const allItems = contentLoader.getItems();
      const foundItem = allItems.find(i => i.unique_key === unique_key);
      setItem(foundItem || null);
      
      if (foundItem) {
        const related = allItems.filter(i => 
          i.type === foundItem.type && i.id !== foundItem.id
        ).slice(0, 4);
        setRelatedItems(related);
        
        const allGuides = contentLoader.getGuides();
        setRelatedGuides(allGuides.filter(g => 
          g.topics.some(t => t.toLowerCase().includes("item") || t.toLowerCase().includes(foundItem.type.toLowerCase()))
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
              <p className="text-lg text-muted-foreground">{t('itemDetail.loading')}</p>
            </div>
          </ResponsiveContainer>
        </main>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main id="main-content" className="py-6 sm:py-8" tabIndex={-1}>
          <ResponsiveContainer>
            <Breadcrumb items={[{ label: t('nav.items'), href: "/items" }, { label: t('itemDetail.notFound') }]} />
            <div className="text-center py-16">
              <h1 className="text-2xl font-bold text-foreground mb-4">{t('itemDetail.notFound')}</h1>
              <Link to="/items">
                <Button>{t('itemDetail.backToItems')}</Button>
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
          <Breadcrumb items={[
            { label: t('nav.items'), href: "/items" }, 
            { label: item.title }
          ]} />

          {/* Grid layout - image stacks on top on mobile */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 animate-fade-in">
            {/* Item Image */}
            <div className="lg:col-span-1">
              <Card className="overflow-hidden border-border/50 bg-card shadow-card lg:sticky lg:top-24">
                <div className="relative aspect-square">
                  <DatasetImage
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 left-3 sm:top-4 sm:left-4 flex flex-col gap-2">
                    <Badge className="bg-primary/80 text-primary-foreground">
                      <Package className="h-3 w-3 mr-1" />
                      {t(`itemType.${item.type.toLowerCase()}`)}
                    </Badge>
                  </div>

                </div>
              </Card>
            </div>

            {/* Item Info */}
            <div className="lg:col-span-2 space-y-4 sm:space-y-6">
              <div>
                <div className="flex items-center gap-2 sm:gap-3 mb-2">
                  <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground">
                    <LocalizedText localized={item.name} showIndicator />
                  </h1>
                </div>
                {item.description && (
                  <p className="text-base sm:text-lg text-muted-foreground mb-4">
                    <LocalizedText localized={item.description} showIndicator />
                  </p>
                )}
              </div>

            {/* Description */}
            <Card className="border-border/50 bg-card shadow-card">
              <CardHeader>
                <CardTitle className="text-xl">{t('itemDetail.description')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  {item.description && <LocalizedText localized={item.description} showIndicator />}
                </p>
              </CardContent>
            </Card>

            {/* Item Properties */}
            <Card className="border-border/50 bg-card shadow-card">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Layers className="h-5 w-5 text-primary" />
                  {t('itemDetail.properties')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">{t('itemDetail.type')}</div>
                    <div className="font-medium">{t(`itemType.${item.type.toLowerCase()}`)}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">{t('itemDetail.rarity')}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">{t('itemDetail.updated')}</div>
                    <div className="font-medium">{item.updated_at}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Additional Info */}
            <Card className="border-border/50 bg-gradient-to-br from-primary/5 to-accent/5 shadow-card">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Info className="h-5 w-5 text-primary" />
                  {t('itemDetail.additionalInfo')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-muted-foreground">{t('itemDetail.author')}: {item.author}</p>
                <UniqueKeyDisplay uniqueKey={item.unique_key} />
              </CardContent>
            </Card>
          </div>
        </div>

          {/* Related Items */}
          {relatedItems.length > 0 && (
            <RelatedContent
              title={t('itemDetail.moreItems').replace('{type}', t(`itemType.${item.type.toLowerCase()}`))}
              items={relatedItems.map(relItem => ({
                id: relItem.id,
                title: relItem.title,
                image: relItem.image,
                href: `/items/${relItem.unique_key}`,
                badge: relItem.rarity,
                description: relItem.summary,
              }))}
              viewAllHref="/items"
              viewAllLabel={t('itemDetail.viewAllItems')}
            />
          )}

          {/* Related Guides */}
          {relatedGuides.length > 0 && (
            <RelatedContent
              title={t('itemDetail.relatedGuides')}
              items={relatedGuides.map(guide => ({
                id: guide.id,
                title: guide.title,
                image: guide.image,
                href: `/guides/${guide.unique_key}`,
                badge: t(`difficulty.${guide.difficulty.toLowerCase()}`),
                description: guide.summary,
              }))}
              viewAllHref="/guides"
              viewAllLabel={t('itemDetail.viewAllGuides')}
            />
          )}

          <ScrollToTop />
        </ResponsiveContainer>
      </main>
    </div>
  );
};

export default ItemDetailPage;
