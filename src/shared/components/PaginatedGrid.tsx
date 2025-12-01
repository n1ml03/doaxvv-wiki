/**
 * PaginatedGrid Component
 * Reusable component that wraps a grid with pagination
 */

import { useMemo, useEffect, ReactNode } from 'react';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/shared/components/ui/pagination";
import { usePagination } from "@/shared/hooks/usePagination";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/shared/hooks/useTranslation";

export interface PaginatedGridProps<T> {
  /** All items to paginate */
  items: T[];
  /** Items per page (default: 24) */
  itemsPerPage?: number;
  /** Render function for each item */
  renderItem: (item: T, index: number) => ReactNode;
  /** Key extractor */
  getKey: (item: T) => string | number;
  /** Grid className (for columns configuration) */
  gridClassName?: string;
  /** Dependencies that should reset pagination */
  resetDeps?: unknown[];
  /** Show pagination info text */
  showInfo?: boolean;
  /** Empty state content */
  emptyState?: ReactNode;
  /** Container className */
  className?: string;
}

export function PaginatedGrid<T>({
  items,
  itemsPerPage = 24,
  renderItem,
  getKey,
  gridClassName = "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6",
  resetDeps = [],
  showInfo = true,
  emptyState,
  className,
}: PaginatedGridProps<T>) {
  const { t } = useTranslation();
  const pagination = usePagination({
    totalItems: items.length,
    itemsPerPage,
  });

  // Reset pagination when dependencies change
  useEffect(() => {
    pagination.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, resetDeps);

  // Get paginated items
  const paginatedItems = useMemo(() => 
    items.slice(pagination.startIndex, pagination.endIndex),
    [items, pagination.startIndex, pagination.endIndex]
  );

  if (items.length === 0) {
    return emptyState ? <>{emptyState}</> : null;
  }

  return (
    <div className={className}>
      {/* Info bar */}
      {showInfo && items.length > 0 && (
        <div className="flex items-center justify-between mb-4 text-sm text-muted-foreground">
          <span>
            {t('pagination.showing')
              .replace('{start}', (pagination.startIndex + 1).toString())
              .replace('{end}', Math.min(pagination.endIndex, items.length).toString())
              .replace('{total}', items.length.toString())}
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

      {/* Grid */}
      <div className={gridClassName}>
        {paginatedItems.map((item, index) => (
          <div key={getKey(item)}>
            {renderItem(item, index)}
          </div>
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
    </div>
  );
}

export default PaginatedGrid;

