import { useState } from 'react';
import { Languages, Copy, Check } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/shared/components/ui/tooltip';
import { LocalizedString } from '@/shared/types/localization';
import { getAllTranslations } from '@/shared/utils/localization';
import { cn } from '@/lib/utils';

interface TranslationIndicatorProps {
  localized: LocalizedString;
  className?: string;
}

/**
 * A small circular icon that displays all translations on hover.
 * Shows a languages icon that reveals a tooltip with translations in all available languages.
 * Only the translation values are selectable, labels are not.
 */
export function TranslationIndicator({ localized, className }: TranslationIndicatorProps) {
  const translations = getAllTranslations(localized);
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const text = translations.map(({ value }) => value).join('\n');
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className={cn(
              'inline-flex items-center justify-center w-6 h-6 rounded-lg',
              'bg-gradient-to-br from-primary/10 to-primary/5',
              'border border-primary/20 hover:border-primary/40',
              'text-primary/70 hover:text-primary',
              'hover:shadow-md hover:shadow-primary/10',
              'transition-all duration-200 ease-out',
              'hover:scale-105 active:scale-95',
              'cursor-help',
              className
            )}
            aria-label="View translations"
          >
            <Languages className="w-3.5 h-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent 
          className="p-0 overflow-hidden border-0 shadow-xl shadow-black/20 w-[380px]"
          sideOffset={8}
        >
          <div className="bg-gradient-to-b from-popover to-popover/95 backdrop-blur-xl rounded-lg border border-border/50">
            {/* Header */}
            <div className="px-4 py-2.5 border-b border-border/50 bg-muted/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Languages className="w-4 h-4 text-primary" />
                  <span className="text-xs font-semibold text-foreground select-none tracking-wide">
                    TRANSLATIONS
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCopy}
                  className={cn(
                    'p-1 rounded transition-all duration-150',
                    'hover:bg-muted/60 active:scale-95',
                    copied ? 'text-green-500' : 'text-muted-foreground hover:text-foreground'
                  )}
                  aria-label="Copy all translations"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
            
            {/* Translation list - using table layout for perfect alignment */}
            <div className="p-3">
              <table className="w-full border-collapse">
                <tbody>
                  {translations.map(({ code, label, value }, index) => (
                    <tr 
                      key={code} 
                      className={cn(
                        'group',
                        index === 0 && 'bg-primary/5'
                      )}
                    >
                      {/* Language label - not selectable, fixed width */}
                      <td 
                        className="w-[72px] py-2 px-3 align-top rounded-l-md group-hover:bg-muted/50 transition-colors duration-150"
                      >
                        <span 
                          className="text-xs font-semibold text-muted-foreground uppercase tracking-wider select-none pointer-events-none whitespace-nowrap"
                          aria-hidden="true"
                        >
                          {label}
                        </span>
                      </td>
                      
                      {/* Translation value - selectable */}
                      <td 
                        className="py-2 px-3 align-top rounded-r-md group-hover:bg-muted/50 transition-colors duration-150"
                      >
                        <span 
                          className={cn(
                            'text-sm text-foreground leading-relaxed break-words block',
                            'select-text cursor-text',
                            index === 0 && 'font-medium'
                          )}
                        >
                          {value}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
