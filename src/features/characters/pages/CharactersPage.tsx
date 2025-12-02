import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/shared/layouts";
import { Breadcrumb, SearchFilter, LocalizedText, ResponsiveContainer, DatasetImage, ScrollToTop } from "@/shared/components";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Alert, AlertDescription } from "@/shared/components/ui/alert";
import { Button } from "@/shared/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/shared/components/ui/pagination";

import { useCharacters } from "@/content/hooks";
import { getLocalizedValue } from "@/shared/utils/localization";
import { useLanguage } from "@/shared/contexts/language-hooks";
import { useTranslation } from "@/shared/hooks/useTranslation";
import { usePagination } from "@/shared/hooks/usePagination";
import { useDocumentTitle } from "@/shared/hooks/useDocumentTitle";
import { cn } from "@/lib/utils";

const ITEMS_PER_PAGE = 24;

const CharactersPage = () => {
  const { currentLanguage } = useLanguage();
  const { t } = useTranslation();
  const { data: characters = [], isLoading: loading, error, refetch } = useCharacters();
  
  // Set dynamic page title (Requirements: 9.1, 9.2)
  useDocumentTitle(t('characters.title'));
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("newest");



  const filteredAndSortedCharacters = useMemo(() => {
    let result = characters.filter(char => {
      const localizedName = getLocalizedValue(char.name, currentLanguage);
      const matchesSearch = localizedName.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });

    // Sort
    switch (sortBy) {
      case "a-z":
        result = [...result].sort((a, b) => 
          getLocalizedValue(a.name, currentLanguage).localeCompare(getLocalizedValue(b.name, currentLanguage))
        );
        break;
      case "z-a":
        result = [...result].sort((a, b) => 
          getLocalizedValue(b.name, currentLanguage).localeCompare(getLocalizedValue(a.name, currentLanguage))
        );
        break;

      case "popular":
        // Sort by total stats as popularity indicator
        result = [...result].sort((a, b) => {
          const totalA = a.stats.POW + a.stats.TEC + a.stats.STM;
          const totalB = b.stats.POW + b.stats.TEC + b.stats.STM;
          return totalB - totalA;
        });
        break;
      default:
        break;
    }

    return result;
    return result;
  }, [searchTerm, sortBy, characters, currentLanguage]);

  // Pagination
  const pagination = usePagination({
    totalItems: filteredAndSortedCharacters.length,
    itemsPerPage: ITEMS_PER_PAGE,
  });

  // Reset pagination when filters change
  useEffect(() => {
    pagination.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, sortBy]);

  // Get paginated characters
  const paginatedCharacters = useMemo(() => 
    filteredAndSortedCharacters.slice(pagination.startIndex, pagination.endIndex),
    [filteredAndSortedCharacters, pagination.startIndex, pagination.endIndex]
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main id="main-content" className="py-6 sm:py-8" tabIndex={-1}>
          <ResponsiveContainer>
            <div className="text-center py-16">
              <p className="text-lg text-muted-foreground">{t('characters.loading')}</p>
            </div>
          </ResponsiveContainer>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main id="main-content" className="py-6 sm:py-8" tabIndex={-1}>
          <ResponsiveContainer>
            <div className="py-16">
              <Alert variant="destructive">
                <AlertDescription>
                  {t('characters.error')}: {error.message}
                </AlertDescription>
              </Alert>
              <div className="text-center mt-4">
                <Button onClick={() => refetch()}>{t('characters.retry')}</Button>
              </div>
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
          <Breadcrumb items={[{ label: t('nav.characters') }]} />

          <div className="mb-6 sm:mb-8 animate-fade-in">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-2">{t('characters.title')}</h1>
            <p className="text-base sm:text-lg text-muted-foreground">
              {t('characters.subtitle').replace('{count}', characters.length.toString())}
            </p>
          </div>

          <SearchFilter
            placeholder={t('characters.searchPlaceholder')}
            onSearchChange={setSearchTerm}
            onSortChange={setSortBy}
          />

          {/* Results count and pagination info */}
          {filteredAndSortedCharacters.length > 0 && (
            <div className="flex items-center justify-between mb-4 text-sm text-muted-foreground">
              <span>
                {t('pagination.showing')
                  .replace('{start}', (pagination.startIndex + 1).toString())
                  .replace('{end}', Math.min(pagination.endIndex, filteredAndSortedCharacters.length).toString())
                  .replace('{total}', filteredAndSortedCharacters.length.toString())}
              </span>
              {pagination.totalPages > 1 && (
                <span>
                  {t('pagination.page')
                    .replace('{current}', pagination.currentPage.toString())
                    .replace('{total}', pagination.totalPages.toString())}
                </span>
              )}
            </div>
          )}

          {/* Card grid: 1 col mobile, 2 col tablet, 4 col desktop */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {paginatedCharacters.map((character, index) => (
              <Link key={character.id} to={`/girls/${character.unique_key}`}>
                <Card
                  className="group cursor-pointer overflow-hidden border-border/50 bg-card shadow-card hover:shadow-hover transition-all duration-300 hover:-translate-y-2 animate-fade-in h-full"
                  style={{ animationDelay: `${Math.min(index, 8) * 0.03}s` }}
                >
                  <div className="relative aspect-square overflow-hidden">
                    <DatasetImage
                      src={character.image}
                      alt={character.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="absolute bottom-0 left-0 right-0 p-2 sm:p-4 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                      <div className="flex gap-1 sm:gap-2 text-white text-xs sm:text-sm">
                        <div className="flex-1 bg-background/20 backdrop-blur rounded px-1.5 sm:px-2 py-1">
                          <div className="text-[10px] sm:text-xs opacity-80">{t('characters.stats.pow')}</div>
                          <div className="font-bold text-xs sm:text-sm">{character.stats.POW}</div>
                        </div>
                        <div className="flex-1 bg-background/20 backdrop-blur rounded px-1.5 sm:px-2 py-1">
                          <div className="text-[10px] sm:text-xs opacity-80">{t('characters.stats.tec')}</div>
                          <div className="font-bold text-xs sm:text-sm">{character.stats.TEC}</div>
                        </div>
                        <div className="flex-1 bg-background/20 backdrop-blur rounded px-1.5 sm:px-2 py-1">
                          <div className="text-[10px] sm:text-xs opacity-80">{t('characters.stats.stm')}</div>
                          <div className="font-bold text-xs sm:text-sm">{character.stats.STM}</div>
                        </div>
                        {character.stats.APL && (
                          <div className="flex-1 bg-background/20 backdrop-blur rounded px-1.5 sm:px-2 py-1">
                            <div className="text-[10px] sm:text-xs opacity-80">{t('characters.stats.apl')}</div>
                            <div className="font-bold text-xs sm:text-sm">{character.stats.APL}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-base sm:text-lg font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                        <LocalizedText localized={character.name} />
                      </h3>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 truncate">
                      <LocalizedText localized={character.hobby} />
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <Pagination className="mt-8">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={pagination.previousPage}
                    className={cn(
                      "cursor-pointer",
                      !pagination.hasPrevious && "pointer-events-none opacity-50"
                    )}
                  />
                </PaginationItem>

                {/* First page */}
                {pagination.pageRange[0] > 1 && (
                  <>
                    <PaginationItem>
                      <PaginationLink 
                        onClick={() => pagination.goToPage(1)}
                        className="cursor-pointer"
                      >
                        1
                      </PaginationLink>
                    </PaginationItem>
                    {pagination.pageRange[0] > 2 && (
                      <PaginationItem>
                        <PaginationEllipsis />
                      </PaginationItem>
                    )}
                  </>
                )}

                {/* Page range */}
                {pagination.pageRange.map((page) => (
                  <PaginationItem key={page}>
                    <PaginationLink 
                      isActive={pagination.currentPage === page}
                      onClick={() => pagination.goToPage(page)}
                      className="cursor-pointer"
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                ))}

                {/* Last page */}
                {pagination.pageRange[pagination.pageRange.length - 1] < pagination.totalPages && (
                  <>
                    {pagination.pageRange[pagination.pageRange.length - 1] < pagination.totalPages - 1 && (
                      <PaginationItem>
                        <PaginationEllipsis />
                      </PaginationItem>
                    )}
                    <PaginationItem>
                      <PaginationLink 
                        onClick={() => pagination.goToPage(pagination.totalPages)}
                        className="cursor-pointer"
                      >
                        {pagination.totalPages}
                      </PaginationLink>
                    </PaginationItem>
                  </>
                )}

                <PaginationItem>
                  <PaginationNext 
                    onClick={pagination.nextPage}
                    className={cn(
                      "cursor-pointer",
                      !pagination.hasNext && "pointer-events-none opacity-50"
                    )}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}

          {filteredAndSortedCharacters.length === 0 && (
            <div className="text-center py-12 sm:py-16">
              <p className="text-base sm:text-lg text-muted-foreground">{t('characters.noResults')}</p>
            </div>
          )}

          <ScrollToTop />
        </ResponsiveContainer>
      </main>
    </div>
  );
};

export default CharactersPage;
