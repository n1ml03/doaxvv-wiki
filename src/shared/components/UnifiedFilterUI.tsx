/**
 * UnifiedFilterUI Component
 * 
 * A UI component that renders filter controls for the useUnifiedFilter hook.
 * Accepts state, handlers, and config from the hook and renders:
 * - Search input
 * - Filter dropdowns (category, rarity, status, type)
 * - Sort selector
 * - Advanced filters (ranges, dates, booleans) in popover/collapsible
 * - Active filter badges with removal capability
 * - Mobile responsive layout with Sheet
 * 
 * Requirements: 3.1, 3.2, 3.3, 4.1, 4.3, 4.5, 6.1, 6.2, 6.3, 6.4, 7.1, 7.2
 */

import { useState, useMemo } from 'react';
import { Search, Filter, SortAsc, X, Sliders, Calendar, Star, Clock } from 'lucide-react';
import { Input } from '@/shared/components/ui/input';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Slider } from '@/shared/components/ui/slider';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { Label } from '@/shared/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/shared/components/ui/popover';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/shared/components/ui/sheet';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/shared/components/ui/collapsible';
import { useTranslation } from '@/shared/hooks/useTranslation';
import { cn } from '@/lib/utils';
import type {
  UnifiedFilterState,
  FilterHandlers,
  ResolvedFilterConfig,
  FilterOption,
} from '@/shared/hooks/useUnifiedFilter/types';

// ============ Types ============

export interface UnifiedFilterUIProps {
  /** Current filter state from useUnifiedFilter hook */
  state: UnifiedFilterState;
  /** Handler functions from useUnifiedFilter hook */
  handlers: FilterHandlers;
  /** Resolved configuration from useUnifiedFilter hook */
  config: ResolvedFilterConfig;
  /** Number of active filters */
  activeFilterCount: number;
  /** Search input placeholder */
  placeholder?: string;
  /** Number of results to display */
  showResultCount?: number;
  /** Use compact mode for smaller screens */
  compactMode?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Category options for category filter */
  categories?: FilterOption[];
  /** Tag options for tag filter */
  tags?: FilterOption[];
}


// ============ Main Component ============

export const UnifiedFilterUI = ({
  state,
  handlers,
  config,
  activeFilterCount,
  placeholder,
  showResultCount,
  compactMode = false,
  className,
  categories = [],
  tags = [],
}: UnifiedFilterUIProps) => {
  const { t } = useTranslation();
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const effectivePlaceholder = placeholder || t('search.placeholder');
  const hasActiveFilters = activeFilterCount > 0;

  // ============ Render Filter Controls ============
  const renderFilterControls = (isMobile = false) => (
    <div className={cn('flex flex-wrap gap-2', isMobile && 'flex-col')}>
      {/* Rarity Filter */}
      {config.rarities.length > 0 && (
        <Select value={state.rarity} onValueChange={handlers.setRarity}>
          <SelectTrigger className={cn('h-10 bg-card border-border/50', isMobile ? 'w-full' : 'w-[130px]')}>
            <Star className="h-4 w-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder={t('filter.rarity')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">{t('filter.allRarities')}</SelectItem>
            {config.rarities.map((r) => (
              <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Status Filter */}
      {config.statuses.length > 0 && (
        <Select value={state.status} onValueChange={handlers.setStatus}>
          <SelectTrigger className={cn('h-10 bg-card border-border/50', isMobile ? 'w-full' : 'w-[140px]')}>
            <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder={t('filter.status')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">{t('filter.allStatuses')}</SelectItem>
            {config.statuses.map((s) => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Type Filter */}
      {config.types.length > 0 && (
        <Select value={state.type} onValueChange={handlers.setType}>
          <SelectTrigger className={cn('h-10 bg-card border-border/50', isMobile ? 'w-full' : 'w-[140px]')}>
            <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder={t('filter.type')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">{t('filter.allTypes')}</SelectItem>
            {config.types.map((type) => (
              <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Category Filter */}
      {categories.length > 0 && (
        <Select value={state.category} onValueChange={handlers.setCategory}>
          <SelectTrigger className={cn('h-10 bg-card border-border/50', isMobile ? 'w-full' : 'w-[160px]')}>
            <SelectValue placeholder={t('filter.category')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">{t('filter.allCategories')}</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Tags Filter */}
      {tags.length > 0 && (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className={cn('h-10 bg-card border-border/50', isMobile && 'w-full justify-start')}>
              <Filter className="h-4 w-4 mr-2" />
              {t('filter.tags')}
              {state.tags.length > 0 && (
                <Badge variant="secondary" className="ml-2 h-5 px-1.5">{state.tags.length}</Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72" align={isMobile ? 'center' : 'end'}>
            <div className="space-y-3">
              <h4 className="font-medium text-sm">{t('filter.filterByTags')}</h4>
              <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
                {tags.map((tag) => (
                  <Badge
                    key={tag.value}
                    variant={state.tags.includes(tag.value) ? 'default' : 'outline'}
                    className="cursor-pointer transition-colors hover:bg-primary/80"
                    onClick={() => handlers.toggleTag(tag.value)}
                  >
                    {tag.label}
                    {tag.count !== undefined && <span className="ml-1 opacity-70">({tag.count})</span>}
                  </Badge>
                ))}
              </div>
              {state.tags.length > 0 && (
                <Button variant="ghost" size="sm" onClick={() => handlers.setTags([])} className="w-full">
                  {t('filter.clearTags')}
                </Button>
              )}
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );


  // ============ Render Advanced Filters ============
  const renderAdvancedFilters = () => (
    <div className="space-y-4 pt-4 border-t border-border/50">
      {/* Date Range Filter */}
      {config.dateRangeFilter && (
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {config.dateRangeFilter.label}
          </Label>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              type="date"
              value={state.dateRange?.start || ''}
              onChange={(e) => handlers.setDateRange({
                start: e.target.value,
                end: state.dateRange?.end || '',
              })}
              className="h-9 bg-card border-border/50 flex-1 min-w-0"
            />
            <span className="self-center text-muted-foreground hidden sm:block">-</span>
            <Input
              type="date"
              value={state.dateRange?.end || ''}
              onChange={(e) => handlers.setDateRange({
                start: state.dateRange?.start || '',
                end: e.target.value,
              })}
              className="h-9 bg-card border-border/50 flex-1 min-w-0"
            />
          </div>
        </div>
      )}

      {/* Range Filters (Stats) */}
      {config.rangeFilters.map((filter) => (
        <div key={filter.key} className="space-y-2">
          <div className="flex justify-between items-center">
            <Label className="text-sm font-medium">{filter.label}</Label>
            <span className="text-xs text-muted-foreground">
              {state.statRanges[filter.key]?.[0] ?? filter.min} - {state.statRanges[filter.key]?.[1] ?? filter.max}
            </span>
          </div>
          <Slider
            value={state.statRanges[filter.key] || [filter.min, filter.max]}
            min={filter.min}
            max={filter.max}
            step={filter.step || 1}
            onValueChange={(value) => handlers.setStatRange(filter.key, value as [number, number])}
            className="py-2"
          />
        </div>
      ))}

      {/* Boolean Filters */}
      {config.booleanFilters.length > 0 && (
        <div className="space-y-2">
          {config.booleanFilters.map((filter) => (
            <div key={filter.key} className="flex items-center space-x-2">
              <Checkbox
                id={filter.key}
                checked={state.booleanFilters[filter.key] || false}
                onCheckedChange={(checked) => handlers.setBooleanFilter(filter.key, checked as boolean)}
              />
              <Label htmlFor={filter.key} className="text-sm cursor-pointer">
                {filter.label}
              </Label>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // ============ Render Active Filters ============
  const renderActiveFilters = () => (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-sm text-muted-foreground">{t('filter.activeFilters')}</span>
      
      {state.search && (
        <Badge variant="secondary" className="gap-1">
          {t('filter.searchLabel')} "{state.search}"
          <X className="h-3 w-3 cursor-pointer hover:text-destructive" onClick={() => handlers.clearFilter('search')} />
        </Badge>
      )}
      
      {state.category !== 'All' && (
        <Badge variant="secondary" className="gap-1">
          {categories.find(c => c.value === state.category)?.label || state.category}
          <X className="h-3 w-3 cursor-pointer hover:text-destructive" onClick={() => handlers.clearFilter('category')} />
        </Badge>
      )}
      
      {state.rarity !== 'All' && (
        <Badge variant="secondary" className="gap-1 bg-primary/20">
          {config.rarities.find(r => r.value === state.rarity)?.label || state.rarity}
          <X className="h-3 w-3 cursor-pointer hover:text-destructive" onClick={() => handlers.clearFilter('rarity')} />
        </Badge>
      )}
      
      {state.status !== 'All' && (
        <Badge variant="secondary" className="gap-1 bg-accent/20">
          {config.statuses.find(s => s.value === state.status)?.label || state.status}
          <X className="h-3 w-3 cursor-pointer hover:text-destructive" onClick={() => handlers.clearFilter('status')} />
        </Badge>
      )}
      
      {state.type !== 'All' && (
        <Badge variant="secondary" className="gap-1">
          {config.types.find(t => t.value === state.type)?.label || state.type}
          <X className="h-3 w-3 cursor-pointer hover:text-destructive" onClick={() => handlers.clearFilter('type')} />
        </Badge>
      )}
      
      {state.tags.map((tag) => (
        <Badge key={tag} variant="secondary" className="gap-1">
          {tags.find(t => t.value === tag)?.label || tag}
          <X className="h-3 w-3 cursor-pointer hover:text-destructive" onClick={() => handlers.clearFilter('tags', tag)} />
        </Badge>
      ))}
      
      {state.dateRange && (state.dateRange.start || state.dateRange.end) && (
        <Badge variant="secondary" className="gap-1">
          <Calendar className="h-3 w-3" />
          {state.dateRange.start || '...'} - {state.dateRange.end || '...'}
          <X className="h-3 w-3 cursor-pointer hover:text-destructive" onClick={() => handlers.clearFilter('dateRange')} />
        </Badge>
      )}

      {/* Stat Range Filters */}
      {Object.entries(state.statRanges).map(([key, range]) => {
        const rangeConfig = config.rangeFilters.find(rf => rf.key === key);
        if (!rangeConfig) return null;
        return (
          <Badge key={key} variant="secondary" className="gap-1">
            {rangeConfig.label}: {range[0]} - {range[1]}
            <X className="h-3 w-3 cursor-pointer hover:text-destructive" onClick={() => handlers.clearFilter('statRanges', key)} />
          </Badge>
        );
      })}

      {/* Boolean Filters */}
      {Object.entries(state.booleanFilters).filter(([, value]) => value).map(([key]) => {
        const boolConfig = config.booleanFilters.find(bf => bf.key === key);
        if (!boolConfig) return null;
        return (
          <Badge key={key} variant="secondary" className="gap-1">
            {boolConfig.label}
            <X className="h-3 w-3 cursor-pointer hover:text-destructive" onClick={() => handlers.clearFilter('booleanFilters', key)} />
          </Badge>
        );
      })}
      
      <Button variant="ghost" size="sm" onClick={handlers.clearFilters} className="h-6 px-2 text-xs hover:text-destructive">
        {t('filter.clearAll')}
      </Button>
    </div>
  );


  // ============ Main Render ============
  return (
    <div className={cn('space-y-4 mb-6', className)}>
      {/* Main Filter Row */}
      <div className="flex flex-col lg:flex-row gap-3">
        {/* Search Input */}
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={effectivePlaceholder}
            value={state.search}
            onChange={(e) => handlers.setSearch(e.target.value)}
            className="pl-10 h-11 bg-card border-border/50"
          />
          {state.search && (
            <button
              onClick={() => handlers.clearFilter('search')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Desktop Filters */}
        <div className="hidden lg:flex items-center gap-2">
          {renderFilterControls()}
          
          {/* Sort */}
          <Select value={state.sort} onValueChange={handlers.setSort}>
            <SelectTrigger className="w-[150px] h-10 bg-card border-border/50">
              <SortAsc className="h-4 w-4 mr-2" />
              <SelectValue placeholder={t('filter.sortBy')} />
            </SelectTrigger>
            <SelectContent>
              {config.sortOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Advanced Filters Toggle */}
          {config.hasAdvancedFilters && (
            <Popover open={advancedOpen} onOpenChange={setAdvancedOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="h-10 bg-card border-border/50">
                  <Sliders className="h-4 w-4 mr-2" />
                  {t('filter.advanced')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-96" align="end">
                <div className="space-y-4">
                  <h4 className="font-medium">{t('filter.advancedFilters')}</h4>
                  {renderAdvancedFilters()}
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>

        {/* Mobile Filter Button */}
        <div className="flex lg:hidden gap-2">
          <Select value={state.sort} onValueChange={handlers.setSort}>
            <SelectTrigger className="flex-1 h-10 bg-card border-border/50">
              <SortAsc className="h-4 w-4 mr-2" />
              <SelectValue placeholder={t('filter.sortBy')} />
            </SelectTrigger>
            <SelectContent>
              {config.sortOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="h-10 bg-card border-border/50">
                <Filter className="h-4 w-4 mr-2" />
                {t('filter.filters')}
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="ml-2 h-5 px-1.5">{activeFilterCount}</Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:w-96 overflow-y-auto">
              <SheetHeader>
                <SheetTitle className="flex items-center justify-between">
                  {t('filter.filters')}
                  {activeFilterCount > 0 && (
                    <Button variant="ghost" size="sm" onClick={handlers.clearFilters}>
                      {t('filter.clearAll')}
                    </Button>
                  )}
                </SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-6">
                {renderFilterControls(true)}
                {config.hasAdvancedFilters && (
                  <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" className="w-full justify-between">
                        {t('filter.advancedFilters')}
                        <Sliders className="h-4 w-4" />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      {renderAdvancedFilters()}
                    </CollapsibleContent>
                  </Collapsible>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Result Count */}
      {/* {showResultCount !== undefined && (
        <div className="text-sm text-muted-foreground">
          {t('filter.resultsCount').replace('{count}', showResultCount.toString())}
        </div>
      )} */}

      {/* Active Filters Display */}
      {hasActiveFilters && renderActiveFilters()}
    </div>
  );
};

export default UnifiedFilterUI;
