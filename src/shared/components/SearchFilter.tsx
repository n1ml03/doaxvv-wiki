import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, Filter, SortAsc, X, Sliders, Calendar, Star, Clock } from "lucide-react";
import { Input } from "@/shared/components/ui/input";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Slider } from "@/shared/components/ui/slider";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { Label } from "@/shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/shared/components/ui/sheet";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/shared/components/ui/collapsible";
import { useTranslation } from "@/shared/hooks/useTranslation";
import { cn } from "@/lib/utils";

// ============ Types ============
export interface FilterOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  count?: number;
}

export interface RangeFilter {
  min: number;
  max: number;
  step?: number;
  label: string;
  key: string;
}

export interface DateRangeFilter {
  key: string;
  label: string;
}

export type FilterPreset = "characters" | "swimsuits" | "events" | "festivals" | "gachas" | "items" | "guides" | "episodes" | "accessories" | "missions" | "quizzes" | "default";

export interface FilterState {
  search: string;
  category: string;
  tags: string[];
  sort: string;
  rarity?: string;
  status?: string;
  type?: string;
  dateRange?: { start: string; end: string };
  statRange?: { [key: string]: [number, number] };
  booleanFilters?: { [key: string]: boolean };
}

export interface SearchFilterProps {
  // Basic props
  placeholder?: string;
  categories?: FilterOption[];
  tags?: FilterOption[];
  sortOptions?: FilterOption[];
  
  // Advanced filter props
  rarities?: FilterOption[];
  statuses?: FilterOption[];
  types?: FilterOption[];
  rangeFilters?: RangeFilter[];
  dateRangeFilter?: DateRangeFilter;
  booleanFilters?: { key: string; label: string }[];
  
  // Callbacks
  onSearchChange: (search: string) => void;
  onCategoryChange?: (category: string) => void;
  onTagsChange?: (tags: string[]) => void;
  onSortChange?: (sort: string) => void;
  onRarityChange?: (rarity: string) => void;
  onStatusChange?: (status: string) => void;
  onTypeChange?: (type: string) => void;
  onDateRangeChange?: (range: { start: string; end: string } | null) => void;
  onStatRangeChange?: (key: string, range: [number, number]) => void;
  onBooleanFilterChange?: (key: string, value: boolean) => void;
  onFiltersChange?: (filters: FilterState) => void;
  
  // UI options
  showFilters?: boolean;
  preset?: FilterPreset;
  compactMode?: boolean;
  showResultCount?: number;
  className?: string;
}

// ============ Default Sort Options ============
const getDefaultSortOptions = (t: (key: string) => string): FilterOption[] => [
  { value: "newest", label: t('sort.newest') },
  { value: "oldest", label: t('sort.oldest') },
  { value: "a-z", label: t('sort.az') },
  { value: "z-a", label: t('sort.za') },
  { value: "popular", label: t('sort.popular') },
];

// ============ Preset Configurations ============
const getPresetConfig = (preset: FilterPreset, t: (key: string) => string) => {
  const configs: Record<FilterPreset, Partial<SearchFilterProps>> = {
    characters: {
      sortOptions: [
        { value: "newest", label: t('sort.newest') },
        { value: "a-z", label: t('sort.az') },
        { value: "z-a", label: t('sort.za') },
        { value: "popular", label: t('sort.popular') },
        { value: "pow-high", label: "POW ↓" },
        { value: "tec-high", label: "TEC ↓" },
        { value: "stm-high", label: "STM ↓" },
      ],
      rangeFilters: [
        { key: "pow", label: "POW", min: 0, max: 100, step: 5 },
        { key: "tec", label: "TEC", min: 0, max: 100, step: 5 },
        { key: "stm", label: "STM", min: 0, max: 100, step: 5 },
      ],
    },
    swimsuits: {
      rarities: [
        { value: "SSR", label: t('rarity.ssr') },
        { value: "SR", label: t('rarity.sr') },
        { value: "R", label: t('rarity.r') },
      ],
      sortOptions: [
        { value: "newest", label: t('sort.newest') },
        { value: "a-z", label: t('sort.az') },
        { value: "z-a", label: t('sort.za') },
        { value: "rarity-high", label: t('filter.rarityHigh') },
        { value: "pow-high", label: "POW ↓" },
        { value: "tec-high", label: "TEC ↓" },
        { value: "stm-high", label: "STM ↓" },
      ],
      rangeFilters: [
        { key: "pow", label: "POW", min: 0, max: 5000, step: 100 },
        { key: "tec", label: "TEC", min: 0, max: 5000, step: 100 },
        { key: "stm", label: "STM", min: 0, max: 5000, step: 100 },
      ],
    },
    events: {
      statuses: [
        { value: "Active", label: t('status.active') },
        { value: "Upcoming", label: t('status.upcoming') },
        { value: "Ended", label: t('status.ended') },
      ],
      types: [
        { value: "Main", label: t('eventType.main') },
        { value: "Daily", label: t('eventType.daily') },
        { value: "Event", label: t('eventType.event') },
      ],
      sortOptions: [
        { value: "newest", label: t('sort.newest') },
        { value: "ending-soon", label: t('filter.endingSoon') },
        { value: "a-z", label: t('sort.az') },
        { value: "z-a", label: t('sort.za') },
      ],
      dateRangeFilter: { key: "eventDate", label: t('filter.dateRange') },
    },
    festivals: {
      statuses: [
        { value: "Active", label: t('status.active') },
        { value: "Upcoming", label: t('status.upcoming') },
        { value: "Ended", label: t('status.ended') },
      ],
      sortOptions: [
        { value: "newest", label: t('sort.newest') },
        { value: "ending-soon", label: t('filter.endingSoon') },
        { value: "a-z", label: t('sort.az') },
        { value: "z-a", label: t('sort.za') },
      ],
      dateRangeFilter: { key: "festivalDate", label: t('filter.dateRange') },
    },
    gachas: {
      statuses: [
        { value: "Active", label: t('status.active') },
        { value: "Coming Soon", label: t('status.comingSoon') },
        { value: "Ended", label: t('status.ended') },
      ],
      sortOptions: [
        { value: "newest", label: t('sort.newest') },
        { value: "ending-soon", label: t('filter.endingSoon') },
        { value: "rate-high", label: t('filter.rateHigh') },
        { value: "a-z", label: t('sort.az') },
      ],
      booleanFilters: [
        { key: "stepUp", label: t('filter.stepUpOnly') },
      ],
      rangeFilters: [
        { key: "ssrRate", label: t('filter.ssrRate'), min: 0, max: 10, step: 0.5 },
      ],
    },
    items: {
      types: [
        { value: "Decoration", label: t('itemType.decoration') },
        { value: "Consumable", label: t('itemType.consumable') },
        { value: "Material", label: t('itemType.material') },
      ],
      sortOptions: [
        { value: "newest", label: t('sort.newest') },
        { value: "a-z", label: t('sort.az') },
        { value: "z-a", label: t('sort.za') },
      ],
    },
    guides: {
      sortOptions: [
        { value: "newest", label: t('sort.newest') },
        { value: "a-z", label: t('sort.az') },
        { value: "z-a", label: t('sort.za') },
        { value: "difficulty-asc", label: t('filter.difficultyAsc') },
        { value: "difficulty-desc", label: t('filter.difficultyDesc') },
      ],
      types: [
        { value: "Easy", label: t('difficulty.easy') },
        { value: "Medium", label: t('difficulty.medium') },
        { value: "Hard", label: t('difficulty.hard') },
      ],
    },
    episodes: {
      statuses: [
        { value: "Available", label: t('status.available') },
        { value: "Coming Soon", label: t('status.comingSoon') },
        { value: "Limited", label: t('status.limited') },
      ],
      types: [
        { value: "Character", label: t('filters.character') },
        { value: "Gravure", label: t('filters.gravure') },
        { value: "Event", label: t('filters.event') },
        { value: "Extra", label: t('filters.extra') },
        { value: "Bromide", label: t('filters.bromide') },
      ],
      sortOptions: [
        { value: "newest", label: t('sort.newest') },
        { value: "a-z", label: t('sort.az') },
        { value: "z-a", label: t('sort.za') },
      ],
    },
    accessories: {
      rarities: [
        { value: "SSR", label: t('rarity.ssr') },
        { value: "SR", label: t('rarity.sr') },
        { value: "R", label: t('rarity.r') },
        { value: "N", label: t('rarity.n') },
      ],
      types: [
        { value: "Event", label: t('obtainMethod.event') },
        { value: "Gacha", label: t('obtainMethod.gacha') },
        { value: "Shop", label: t('obtainMethod.shop') },
        { value: "Quest", label: t('obtainMethod.quest') },
        { value: "Login", label: t('obtainMethod.login') },
      ],
      sortOptions: [
        { value: "newest", label: t('sort.newest') },
        { value: "a-z", label: t('sort.az') },
        { value: "z-a", label: t('sort.za') },
        { value: "rarity-high", label: t('filter.rarityHigh') },
      ],
    },
    missions: {
      types: [
        { value: "Daily", label: t('missionType.daily') },
        { value: "Weekly", label: t('missionType.weekly') },
        { value: "Event", label: t('missionType.event') },
      ],
      sortOptions: [
        { value: "newest", label: t('sort.newest') },
        { value: "a-z", label: t('sort.az') },
        { value: "z-a", label: t('sort.za') },
      ],
    },
    quizzes: {
      types: [
        { value: "Easy", label: t('difficulty.easy') },
        { value: "Medium", label: t('difficulty.medium') },
        { value: "Hard", label: t('difficulty.hard') },
      ],
      sortOptions: [
        { value: "newest", label: t('sort.newest') },
        { value: "a-z", label: t('sort.az') },
        { value: "difficulty-asc", label: t('quiz.sortDifficultyAsc') },
        { value: "difficulty-desc", label: t('quiz.sortDifficultyDesc') },
      ],
    },
    default: {},
  };
  return configs[preset] || configs.default;
};


// ============ Main Component ============
/**
 * @deprecated This component is deprecated and will be removed in a future version.
 * Please migrate to the new unified filter system:
 * 
 * Migration Guide:
 * 1. Import the useUnifiedFilter hook: `import { useUnifiedFilter } from '@/shared/hooks/useUnifiedFilter'`
 * 2. Import the UnifiedFilterUI component: `import { UnifiedFilterUI } from '@/shared/components'`
 * 3. Replace SearchFilter usage with:
 *    ```tsx
 *    const { state, handlers, config, filteredData, activeFilterCount } = useUnifiedFilter({
 *      preset: 'your-preset', // e.g., 'characters', 'swimsuits', 'events'
 *      data: yourDataArray,
 *      searchFields: ['name', 'description'],
 *      // ... other options
 *    });
 *    
 *    <UnifiedFilterUI
 *      state={state}
 *      handlers={handlers}
 *      config={config}
 *      activeFilterCount={activeFilterCount}
 *    />
 *    ```
 * 
 * Benefits of the new system:
 * - Automatic filtering and sorting logic (no need to implement manually)
 * - Built-in URL synchronization
 * - Type-safe filter state management
 * - Reduced code duplication across pages
 * 
 * @see useUnifiedFilter - The hook that manages filter state and logic
 * @see UnifiedFilterUI - The UI component for rendering filters
 */
const SearchFilter = ({
  placeholder,
  categories = [],
  tags = [],
  sortOptions,
  rarities,
  statuses,
  types,
  rangeFilters,
  dateRangeFilter,
  booleanFilters,
  onSearchChange,
  onCategoryChange,
  onTagsChange,
  onSortChange,
  onRarityChange,
  onStatusChange,
  onTypeChange,
  onDateRangeChange,
  onStatRangeChange,
  onBooleanFilterChange,
  onFiltersChange,
  showFilters = true,
  preset = "default",
  compactMode = false,
  showResultCount,
  className,
}: SearchFilterProps) => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const hasWarnedRef = useRef(false);

  // Development mode deprecation warning
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && !hasWarnedRef.current) {
      hasWarnedRef.current = true;
      console.warn(
        '[DEPRECATED] SearchFilter component is deprecated and will be removed in a future version.\n' +
        'Please migrate to the new unified filter system:\n' +
        '  1. Use the useUnifiedFilter hook for state management\n' +
        '  2. Use the UnifiedFilterUI component for rendering\n' +
        '\n' +
        'See the JSDoc comment on SearchFilter for migration details.'
      );
    }
  }, []);

  // Get preset configuration
  const presetConfig = useMemo(() => getPresetConfig(preset, t), [preset, t]);

  // Merge props with preset config
  const effectiveSortOptions = sortOptions || presetConfig.sortOptions || getDefaultSortOptions(t);
  const effectiveRarities = rarities || presetConfig.rarities || [];
  const effectiveStatuses = statuses || presetConfig.statuses || [];
  const effectiveTypes = types || presetConfig.types || [];
  const effectiveRangeFilters = rangeFilters || presetConfig.rangeFilters || [];
  const effectiveBooleanFilters = booleanFilters || presetConfig.booleanFilters || [];
  const effectiveDateRangeFilter = dateRangeFilter || presetConfig.dateRangeFilter;
  const effectivePlaceholder = placeholder || t('search.placeholder');

  // State
  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "All");
  const [selectedTags, setSelectedTags] = useState<string[]>(
    searchParams.get("tags")?.split(",").filter(Boolean) || []
  );
  const [sort, setSort] = useState(searchParams.get("sort") || "newest");
  const [selectedRarity, setSelectedRarity] = useState(searchParams.get("rarity") || "All");
  const [selectedStatus, setSelectedStatus] = useState(searchParams.get("status") || "All");
  const [selectedType, setSelectedType] = useState(searchParams.get("type") || "All");
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: searchParams.get("startDate") || "",
    end: searchParams.get("endDate") || "",
  });
  const [statRanges, setStatRanges] = useState<{ [key: string]: [number, number] }>({});
  const [booleanStates, setBooleanStates] = useState<{ [key: string]: boolean }>({});

  // Update URL params
  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (selectedCategory !== "All") params.set("category", selectedCategory);
    if (selectedTags.length > 0) params.set("tags", selectedTags.join(","));
    if (sort !== "newest") params.set("sort", sort);
    if (selectedRarity !== "All") params.set("rarity", selectedRarity);
    if (selectedStatus !== "All") params.set("status", selectedStatus);
    if (selectedType !== "All") params.set("type", selectedType);
    if (dateRange.start) params.set("startDate", dateRange.start);
    if (dateRange.end) params.set("endDate", dateRange.end);
    setSearchParams(params, { replace: true });
  }, [search, selectedCategory, selectedTags, sort, selectedRarity, selectedStatus, selectedType, dateRange, setSearchParams]);

  // Handlers
  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    onSearchChange(value);
  }, [onSearchChange]);

  const handleCategoryChange = useCallback((value: string) => {
    setSelectedCategory(value);
    onCategoryChange?.(value);
  }, [onCategoryChange]);

  const handleTagToggle = useCallback((tag: string) => {
    const newTags = selectedTags.includes(tag)
      ? selectedTags.filter(t => t !== tag)
      : [...selectedTags, tag];
    setSelectedTags(newTags);
    onTagsChange?.(newTags);
  }, [selectedTags, onTagsChange]);

  const handleSortChange = useCallback((value: string) => {
    setSort(value);
    onSortChange?.(value);
  }, [onSortChange]);

  const handleRarityChange = useCallback((value: string) => {
    setSelectedRarity(value);
    onRarityChange?.(value);
  }, [onRarityChange]);

  const handleStatusChange = useCallback((value: string) => {
    setSelectedStatus(value);
    onStatusChange?.(value);
  }, [onStatusChange]);

  const handleTypeChange = useCallback((value: string) => {
    setSelectedType(value);
    onTypeChange?.(value);
  }, [onTypeChange]);

  const handleDateRangeChange = useCallback((key: 'start' | 'end', value: string) => {
    const newRange = { ...dateRange, [key]: value };
    setDateRange(newRange);
    onDateRangeChange?.(newRange.start || newRange.end ? newRange : null);
  }, [dateRange, onDateRangeChange]);

  const handleStatRangeChange = useCallback((key: string, value: [number, number]) => {
    setStatRanges(prev => ({ ...prev, [key]: value }));
    onStatRangeChange?.(key, value);
  }, [onStatRangeChange]);

  const handleBooleanChange = useCallback((key: string, value: boolean) => {
    setBooleanStates(prev => ({ ...prev, [key]: value }));
    onBooleanFilterChange?.(key, value);
  }, [onBooleanFilterChange]);

  const clearFilters = useCallback(() => {
    setSearch("");
    setSelectedCategory("All");
    setSelectedTags([]);
    setSort("newest");
    setSelectedRarity("All");
    setSelectedStatus("All");
    setSelectedType("All");
    setDateRange({ start: "", end: "" });
    setStatRanges({});
    setBooleanStates({});
    onSearchChange("");
    onCategoryChange?.("All");
    onTagsChange?.([]);
    onSortChange?.("newest");
    onRarityChange?.("All");
    onStatusChange?.("All");
    onTypeChange?.("All");
    onDateRangeChange?.(null);
  }, [onSearchChange, onCategoryChange, onTagsChange, onSortChange, onRarityChange, onStatusChange, onTypeChange, onDateRangeChange]);

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (search) count++;
    if (selectedCategory !== "All") count++;
    if (selectedTags.length > 0) count += selectedTags.length;
    if (selectedRarity !== "All") count++;
    if (selectedStatus !== "All") count++;
    if (selectedType !== "All") count++;
    if (dateRange.start || dateRange.end) count++;
    count += Object.keys(statRanges).length;
    count += Object.values(booleanStates).filter(Boolean).length;
    return count;
  }, [search, selectedCategory, selectedTags, selectedRarity, selectedStatus, selectedType, dateRange, statRanges, booleanStates]);

  const hasActiveFilters = activeFilterCount > 0 || sort !== "newest";
  const hasAdvancedFilters = effectiveRangeFilters.length > 0 || effectiveBooleanFilters.length > 0 || effectiveDateRangeFilter;


  // ============ Render Filter Controls ============
  const renderFilterControls = (isMobile = false) => (
    <div className={cn("flex flex-wrap gap-2", isMobile && "flex-col")}>
      {/* Rarity Filter */}
      {effectiveRarities.length > 0 && (
        <Select value={selectedRarity} onValueChange={handleRarityChange}>
          <SelectTrigger className={cn("h-10 bg-card border-border/50", isMobile ? "w-full" : "w-[130px]")}>
            <Star className="h-4 w-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder={t('filter.rarity')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">{t('filter.allRarities')}</SelectItem>
            {effectiveRarities.map((r) => (
              <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Status Filter */}
      {effectiveStatuses.length > 0 && (
        <Select value={selectedStatus} onValueChange={handleStatusChange}>
          <SelectTrigger className={cn("h-10 bg-card border-border/50", isMobile ? "w-full" : "w-[140px]")}>
            <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder={t('filter.status')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">{t('filter.allStatuses')}</SelectItem>
            {effectiveStatuses.map((s) => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Type Filter */}
      {effectiveTypes.length > 0 && (
        <Select value={selectedType} onValueChange={handleTypeChange}>
          <SelectTrigger className={cn("h-10 bg-card border-border/50", isMobile ? "w-full" : "w-[140px]")}>
            <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder={t('filter.type')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">{t('filter.allTypes')}</SelectItem>
            {effectiveTypes.map((type) => (
              <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Category Filter */}
      {categories.length > 0 && (
        <Select value={selectedCategory} onValueChange={handleCategoryChange}>
          <SelectTrigger className={cn("h-10 bg-card border-border/50", isMobile ? "w-full" : "w-[160px]")}>
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
            <Button variant="outline" className={cn("h-10 bg-card border-border/50", isMobile && "w-full justify-start")}>
              <Filter className="h-4 w-4 mr-2" />
              {t('filter.tags')}
              {selectedTags.length > 0 && (
                <Badge variant="secondary" className="ml-2 h-5 px-1.5">{selectedTags.length}</Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72" align={isMobile ? "center" : "end"}>
            <div className="space-y-3">
              <h4 className="font-medium text-sm">{t('filter.filterByTags')}</h4>
              <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
                {tags.map((tag) => (
                  <Badge
                    key={tag.value}
                    variant={selectedTags.includes(tag.value) ? "default" : "outline"}
                    className="cursor-pointer transition-colors hover:bg-primary/80"
                    onClick={() => handleTagToggle(tag.value)}
                  >
                    {tag.label}
                    {tag.count !== undefined && <span className="ml-1 opacity-70">({tag.count})</span>}
                  </Badge>
                ))}
              </div>
              {selectedTags.length > 0 && (
                <Button variant="ghost" size="sm" onClick={() => { setSelectedTags([]); onTagsChange?.([]); }} className="w-full">
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
      {effectiveDateRangeFilter && (
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {effectiveDateRangeFilter.label}
          </Label>
          <div className="flex gap-2">
            <Input
              type="date"
              value={dateRange.start}
              onChange={(e) => handleDateRangeChange('start', e.target.value)}
              className="h-9 bg-card border-border/50"
            />
            <span className="self-center text-muted-foreground">-</span>
            <Input
              type="date"
              value={dateRange.end}
              onChange={(e) => handleDateRangeChange('end', e.target.value)}
              className="h-9 bg-card border-border/50"
            />
          </div>
        </div>
      )}

      {/* Range Filters (Stats) */}
      {effectiveRangeFilters.map((filter) => (
        <div key={filter.key} className="space-y-2">
          <div className="flex justify-between items-center">
            <Label className="text-sm font-medium">{filter.label}</Label>
            <span className="text-xs text-muted-foreground">
              {statRanges[filter.key]?.[0] ?? filter.min} - {statRanges[filter.key]?.[1] ?? filter.max}
            </span>
          </div>
          <Slider
            value={statRanges[filter.key] || [filter.min, filter.max]}
            min={filter.min}
            max={filter.max}
            step={filter.step || 1}
            onValueChange={(value) => handleStatRangeChange(filter.key, value as [number, number])}
            className="py-2"
          />
        </div>
      ))}

      {/* Boolean Filters */}
      {effectiveBooleanFilters.length > 0 && (
        <div className="space-y-2">
          {effectiveBooleanFilters.map((filter) => (
            <div key={filter.key} className="flex items-center space-x-2">
              <Checkbox
                id={filter.key}
                checked={booleanStates[filter.key] || false}
                onCheckedChange={(checked) => handleBooleanChange(filter.key, checked as boolean)}
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
      
      {search && (
        <Badge variant="secondary" className="gap-1">
          {t('filter.searchLabel')} "{search}"
          <X className="h-3 w-3 cursor-pointer hover:text-destructive" onClick={() => handleSearchChange("")} />
        </Badge>
      )}
      
      {selectedCategory !== "All" && (
        <Badge variant="secondary" className="gap-1">
          {categories.find(c => c.value === selectedCategory)?.label || selectedCategory}
          <X className="h-3 w-3 cursor-pointer hover:text-destructive" onClick={() => handleCategoryChange("All")} />
        </Badge>
      )}
      
      {selectedRarity !== "All" && (
        <Badge variant="secondary" className="gap-1 bg-primary/20">
          {effectiveRarities.find(r => r.value === selectedRarity)?.label || selectedRarity}
          <X className="h-3 w-3 cursor-pointer hover:text-destructive" onClick={() => handleRarityChange("All")} />
        </Badge>
      )}
      
      {selectedStatus !== "All" && (
        <Badge variant="secondary" className="gap-1 bg-accent/20">
          {effectiveStatuses.find(s => s.value === selectedStatus)?.label || selectedStatus}
          <X className="h-3 w-3 cursor-pointer hover:text-destructive" onClick={() => handleStatusChange("All")} />
        </Badge>
      )}
      
      {selectedType !== "All" && (
        <Badge variant="secondary" className="gap-1">
          {effectiveTypes.find(t => t.value === selectedType)?.label || selectedType}
          <X className="h-3 w-3 cursor-pointer hover:text-destructive" onClick={() => handleTypeChange("All")} />
        </Badge>
      )}
      
      {selectedTags.map((tag) => (
        <Badge key={tag} variant="secondary" className="gap-1">
          {tags.find(t => t.value === tag)?.label || tag}
          <X className="h-3 w-3 cursor-pointer hover:text-destructive" onClick={() => handleTagToggle(tag)} />
        </Badge>
      ))}
      
      {(dateRange.start || dateRange.end) && (
        <Badge variant="secondary" className="gap-1">
          <Calendar className="h-3 w-3" />
          {dateRange.start || '...'} - {dateRange.end || '...'}
          <X className="h-3 w-3 cursor-pointer hover:text-destructive" onClick={() => { setDateRange({ start: "", end: "" }); onDateRangeChange?.(null); }} />
        </Badge>
      )}
      
      <Button variant="ghost" size="sm" onClick={clearFilters} className="h-6 px-2 text-xs hover:text-destructive">
        {t('filter.clearAll')}
      </Button>
    </div>
  );


  // ============ Main Render ============
  return (
    <div className={cn("space-y-4 mb-6", className)}>
      {/* Main Filter Row */}
      <div className="flex flex-col lg:flex-row gap-3">
        {/* Search Input */}
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={effectivePlaceholder}
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10 h-11 bg-card border-border/50"
          />
          {search && (
            <button
              onClick={() => handleSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {showFilters && (
          <>
            {/* Desktop Filters */}
            <div className="hidden lg:flex items-center gap-2">
              {renderFilterControls()}
              
              {/* Sort */}
              <Select value={sort} onValueChange={handleSortChange}>
                <SelectTrigger className="w-[150px] h-10 bg-card border-border/50">
                  <SortAsc className="h-4 w-4 mr-2" />
                  <SelectValue placeholder={t('filter.sortBy')} />
                </SelectTrigger>
                <SelectContent>
                  {effectiveSortOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Advanced Filters Toggle */}
              {hasAdvancedFilters && (
                <Popover open={advancedOpen} onOpenChange={setAdvancedOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="h-10 bg-card border-border/50">
                      <Sliders className="h-4 w-4 mr-2" />
                      {t('filter.advanced')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80" align="end">
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
              <Select value={sort} onValueChange={handleSortChange}>
                <SelectTrigger className="flex-1 h-10 bg-card border-border/50">
                  <SortAsc className="h-4 w-4 mr-2" />
                  <SelectValue placeholder={t('filter.sortBy')} />
                </SelectTrigger>
                <SelectContent>
                  {effectiveSortOptions.map((option) => (
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
                        <Button variant="ghost" size="sm" onClick={clearFilters}>
                          {t('filter.clearAll')}
                        </Button>
                      )}
                    </SheetTitle>
                  </SheetHeader>
                  <div className="mt-6 space-y-6">
                    {renderFilterControls(true)}
                    {hasAdvancedFilters && (
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
          </>
        )}
      </div>

      {/* Result Count */}
      {showResultCount !== undefined && (
        <div className="text-sm text-muted-foreground">
          {t('filter.resultsCount').replace('{count}', showResultCount.toString())}
        </div>
      )}

      {/* Active Filters Display */}
      {hasActiveFilters && renderActiveFilters()}
    </div>
  );
};

export default SearchFilter;
