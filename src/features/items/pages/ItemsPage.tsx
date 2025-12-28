import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/shared/layouts";
import { Breadcrumb, ResponsiveContainer, DatasetImage, PaginatedGrid, ScrollToTop, UnifiedFilterUI, PageLoadingState } from "@/shared/components";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Package } from "lucide-react";
import { contentLoader } from "@/content";
import type { Item } from "@/content";
import { useTranslation } from "@/shared/hooks/useTranslation";
import { useDocumentTitle } from "@/shared/hooks/useDocumentTitle";
import { useUnifiedFilter } from "@/shared/hooks/useUnifiedFilter";

const ITEMS_PER_PAGE = 24;

const ItemsPage = () => {
  const { t } = useTranslation();
  
  // Set dynamic page title (Requirements: 9.1, 9.2)
  useDocumentTitle(t('items.title'));
  
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadContent() {
      await contentLoader.initialize();
      setItems(contentLoader.getItems());
      setLoading(false);
    }
    loadContent();
  }, []);

  // Custom search function for items
  const customSearchFn = useMemo(() => {
    return (item: Item, searchTerm: string): boolean => {
      if (!searchTerm || searchTerm.trim() === '') return true;
      const searchLower = searchTerm.toLowerCase();
      return item.title.toLowerCase().includes(searchLower) ||
             item.summary.toLowerCase().includes(searchLower) ||
             item.unique_key.toLowerCase().includes(searchLower);
    };
  }, []);

  // Custom sort functions for item-specific sorting
  const customSortFunctions = useMemo(() => ({
    'newest': () => 0, // Default order
    'a-z': (a: Item, b: Item) => a.title.localeCompare(b.title),
    'z-a': (a: Item, b: Item) => b.title.localeCompare(a.title),
  }), []);

  // Use unified filter hook with items preset
  const {
    state,
    handlers,
    filteredData: filteredItems,
    activeFilterCount,
    config,
  } = useUnifiedFilter<Item>({
    preset: 'items',
    data: items,
    customSearchFn,
    customSortFunctions,
    typeField: 'type',
    defaultSort: 'newest',
  });

  const getTypeIcon = (_type: string) => {
    return <Package className="h-3 w-3 mr-1" />;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main id="main-content" className="py-6 sm:py-8" tabIndex={-1}>
          <ResponsiveContainer>
            <PageLoadingState variant="grid" columns={4} itemCount={12} />
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
          <Breadcrumb items={[{ label: t('nav.items') }]} />

          <div className="mb-6 sm:mb-8 animate-fade-in">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-2">{t('items.title')}</h1>
            <p className="text-base sm:text-lg text-muted-foreground">
              {t('items.subtitle').replace('{count}', items.length.toString())}
            </p>
          </div>

          <UnifiedFilterUI
            state={state}
            handlers={handlers}
            config={config}
            activeFilterCount={activeFilterCount}
            placeholder={t('items.searchPlaceholder')}
            showResultCount={filteredItems.length}
          />

          <PaginatedGrid
            items={filteredItems}
            itemsPerPage={ITEMS_PER_PAGE}
            getKey={(item) => item.id}
            resetDeps={[state.search, state.type, state.sort]}
            emptyState={
              <div className="text-center py-12 sm:py-16">
                <p className="text-base sm:text-lg text-muted-foreground">{t('items.noResults')}</p>
              </div>
            }
            renderItem={(item, index) => (
              <Link to={`/items/${item.unique_key}`}>
                <Card
                  className="group cursor-pointer overflow-hidden border-border/50 bg-card shadow-card hover:shadow-hover transition-all duration-200 hover:-translate-y-0.5 h-full"
                >
                  <div className="relative aspect-square overflow-hidden">
                    <DatasetImage
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                    
                    <div className="absolute top-3 left-3 flex flex-col gap-2">
                      <Badge className="bg-primary/80 text-primary-foreground">
                        {getTypeIcon(item.type)}
                        {t(`itemType.${item.type.toLowerCase()}`)}
                      </Badge>
                    </div>
                  </div>

                  <CardContent className="p-4 space-y-3">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{item.summary}</p>
                    </div>

                    <div className="pt-2 border-t border-border/50">
                      <p className="text-xs text-muted-foreground">
                        {t('items.updated').replace('{date}', item.updated_at)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )}
          />
          <ScrollToTop />
        </ResponsiveContainer>
      </main>
    </div>
  );
};

export default ItemsPage;
