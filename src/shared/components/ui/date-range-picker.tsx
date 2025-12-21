/**
 * DateRangePicker - Compact date range picker with presets dropdown
 */
import * as React from "react";
import { format, subDays, startOfMonth, endOfMonth, startOfYear, subMonths } from "date-fns";
import { DayPicker, type DateRange } from "react-day-picker";
import { CalendarIcon, ChevronLeft, ChevronRight, ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "./button";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import { useTranslation } from "@/shared/hooks/useTranslation";

export interface DateRangePickerProps {
  value?: { start?: string; end?: string };
  onChange: (range: { start: string; end: string }) => void;
  onClear?: () => void;
  className?: string;
  disabled?: boolean;
}

type PresetType = "today" | "yesterday" | "last7days" | "last30days" | "thisMonth" | "lastMonth" | "last3months" | "thisYear";

const getPresetRange = (key: PresetType): DateRange => {
  const today = new Date();
  switch (key) {
    case "today": return { from: today, to: today };
    case "yesterday": {
      const y = subDays(today, 1);
      return { from: y, to: y };
    }
    case "last7days": return { from: subDays(today, 6), to: today };
    case "last30days": return { from: subDays(today, 29), to: today };
    case "thisMonth": return { from: startOfMonth(today), to: today };
    case "lastMonth": {
      const lm = subMonths(today, 1);
      return { from: startOfMonth(lm), to: endOfMonth(lm) };
    }
    case "last3months": return { from: subMonths(today, 3), to: today };
    case "thisYear": return { from: startOfYear(today), to: today };
  }
};

const PRESETS: PresetType[] = ["today", "yesterday", "last7days", "last30days", "thisMonth", "lastMonth", "last3months", "thisYear"];

export function DateRangePicker({ value, onChange, onClear, className, disabled }: DateRangePickerProps) {
  const { t } = useTranslation();
  const [open, setOpen] = React.useState(false);

  const dateRange = React.useMemo<DateRange | undefined>(() => {
    if (!value?.start && !value?.end) return undefined;
    return { from: value.start ? new Date(value.start) : undefined, to: value.end ? new Date(value.end) : undefined };
  }, [value]);

  const hasValue = value?.start || value?.end;

  const handleSelect = (range: DateRange | undefined) => {
    const start = range?.from ? format(range.from, "yyyy-MM-dd") : "";
    const end = range?.to ? format(range.to, "yyyy-MM-dd") : "";
    onChange({ start, end });
  };

  const handlePreset = (key: PresetType) => {
    const r = getPresetRange(key);
    if (r.from && r.to) {
      onChange({ start: format(r.from, "yyyy-MM-dd"), end: format(r.to, "yyyy-MM-dd") });
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClear) {
      onClear();
    } else {
      onChange({ start: "", end: "" });
    }
  };

  const displayText = hasValue
    ? `${value?.start ? format(new Date(value.start), "dd/MM/yy") : "..."} - ${value?.end ? format(new Date(value.end), "dd/MM/yy") : "..."}`
    : t("dateRange.selectRange");

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {/* Presets Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" disabled={disabled} className="h-10 w-10 bg-card border-border/50 shrink-0">
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-36">
          {PRESETS.map((key) => (
            <DropdownMenuItem key={key} onClick={() => handlePreset(key)} className="text-xs">
              {t(`dateRange.${key}`)}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Calendar Popover */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" disabled={disabled} className={cn("h-10 justify-between bg-card border-border/50 min-w-[180px]", !hasValue && "text-muted-foreground")}>
            <span className="flex items-center gap-2 truncate">
              <CalendarIcon className="h-4 w-4 shrink-0" />
              <span className="truncate text-sm">{displayText}</span>
            </span>
            {hasValue && (
              <X className="h-3.5 w-3.5 ml-1 shrink-0 hover:text-destructive" onClick={handleClear} />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <DayPicker
            mode="range"
            selected={dateRange}
            onSelect={handleSelect}
            numberOfMonths={1}
            showOutsideDays
            className="p-3"
            classNames={{
              months: "flex flex-col",
              month: "space-y-3",
              month_caption: "flex justify-center relative items-center h-9",
              caption_label: "text-sm font-medium",
              nav: "absolute inset-x-0 flex justify-between px-1",
              button_previous: cn(buttonVariants({ variant: "outline" }), "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 z-10"),
              button_next: cn(buttonVariants({ variant: "outline" }), "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 z-10"),
              month_grid: "w-full border-collapse",
              weekdays: "flex",
              weekday: "text-muted-foreground w-8 font-normal text-[0.7rem]",
              week: "flex mt-1",
              day: "h-8 w-8 text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
              day_button: cn(buttonVariants({ variant: "ghost" }), "h-8 w-8 p-0 font-normal aria-selected:opacity-100"),
              range_end: "day-range-end rounded-r-md",
              range_start: "day-range-start rounded-l-md",
              selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
              today: "bg-accent text-accent-foreground",
              outside: "text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:opacity-30",
              range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
              hidden: "invisible",
              disabled: "text-muted-foreground opacity-50",
            }}
            components={{ Chevron: ({ orientation }) => orientation === "left" ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" /> }}
          />
          {hasValue && (
            <div className="border-t border-border/50 px-3 py-2 flex justify-between items-center">
              <span className="text-xs text-muted-foreground">
                {value?.start && format(new Date(value.start), "dd MMM")}
                {value?.start && value?.end && " → "}
                {value?.end && format(new Date(value.end), "dd MMM")}
              </span>
              <Button variant="ghost" size="sm" className="h-6 px-2 text-xs hover:text-destructive" onClick={handleClear}>
                {t("dateRange.clear")}
              </Button>
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}
