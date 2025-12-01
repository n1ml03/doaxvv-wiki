import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/shared/components/ui/collapsible";
import {
  Rocket,
  ChevronDown,
  Sparkles,
  Bug,
  Wrench,
  Plus,
} from "lucide-react";
import { useTranslation } from "@/shared/hooks/useTranslation";

// Import version markdown file
import versionMd from "@/content/data/version.md?raw";

interface VersionHighlight {
  type: "feature" | "improvement" | "fix";
  text: string;
}

interface VersionRelease {
  version: string;
  date: string;
  highlights: VersionHighlight[];
}

interface VersionData {
  current: string;
  releaseDate: string;
  changelog: VersionRelease[];
}

/**
 * Parse version.md file into structured data
 */
function parseVersionMarkdown(markdown: string): VersionData {
  const lines = markdown.split("\n");
  let current = "0.0.0";
  let releaseDate = "";
  const changelog: VersionRelease[] = [];

  // Parse frontmatter
  let inFrontmatter = false;
  let contentStartIndex = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line === "---") {
      if (!inFrontmatter) {
        inFrontmatter = true;
      } else {
        contentStartIndex = i + 1;
        break;
      }
    } else if (inFrontmatter) {
      const match = line.match(/^(\w+):\s*"?([^"]+)"?$/);
      if (match) {
        if (match[1] === "current") current = match[2];
        if (match[1] === "releaseDate") releaseDate = match[2];
      }
    }
  }

  // Parse changelog sections
  let currentRelease: VersionRelease | null = null;
  let currentType: "feature" | "improvement" | "fix" = "feature";

  for (let i = contentStartIndex; i < lines.length; i++) {
    const line = lines[i];

    // Version header: ## 1.0.0 (2025-12-01)
    const versionMatch = line.match(/^##\s+(\d+\.\d+\.\d+)\s*\((\d{4}-\d{2}-\d{2})\)/);
    if (versionMatch) {
      if (currentRelease) {
        changelog.push(currentRelease);
      }
      currentRelease = {
        version: versionMatch[1],
        date: versionMatch[2],
        highlights: [],
      };
      continue;
    }

    // Type header: ### New, ### Improved, ### Fixed
    const typeMatch = line.match(/^###\s+(New|Improved|Fixed)/i);
    if (typeMatch) {
      const typeMap: Record<string, "feature" | "improvement" | "fix"> = {
        new: "feature",
        improved: "improvement",
        fixed: "fix",
      };
      currentType = typeMap[typeMatch[1].toLowerCase()] || "feature";
      continue;
    }

    // List item: - Some text
    const itemMatch = line.match(/^-\s+(.+)$/);
    if (itemMatch && currentRelease) {
      currentRelease.highlights.push({
        type: currentType,
        text: itemMatch[1],
      });
    }
  }

  if (currentRelease) {
    changelog.push(currentRelease);
  }

  return { current, releaseDate, changelog };
}

const getTypeIcon = (type: string) => {
  switch (type) {
    case "feature":
      return <Plus className="h-3 w-3" />;
    case "improvement":
      return <Wrench className="h-3 w-3" />;
    case "fix":
      return <Bug className="h-3 w-3" />;
    default:
      return <Sparkles className="h-3 w-3" />;
  }
};

const getTypeBadgeVariant = (type: string) => {
  switch (type) {
    case "feature":
      return "default";
    case "improvement":
      return "secondary";
    case "fix":
      return "outline";
    default:
      return "default";
  }
};

const VersionUpdates = () => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [versionData, setVersionData] = useState<VersionData | null>(null);

  useEffect(() => {
    const data = parseVersionMarkdown(versionMd);
    setVersionData(data);
  }, []);

  if (!versionData || versionData.changelog.length === 0) {
    return null;
  }

  const latestVersion = versionData.changelog[0];

  // Group highlights by type for better display
  const featureItems = latestVersion.highlights.filter(h => h.type === "feature");
  const improvementItems = latestVersion.highlights.filter(h => h.type === "improvement");
  const fixItems = latestVersion.highlights.filter(h => h.type === "fix");

  return (
    <Card className="border-border/50 bg-card shadow-card animate-fade-in">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5">
              <Rocket className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg sm:text-xl">
                {t("home.version.title")}
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t("home.version.released")}{" "}
                {new Date(versionData.releaseDate).toLocaleDateString()}
              </p>
            </div>
          </div>
          <Badge
            variant="secondary"
            className="text-sm font-mono px-3 py-1 self-start sm:self-auto"
          >
            v{versionData.current}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {/* Current Version Highlights - Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* New Features */}
          {featureItems.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="default" className="h-6 px-2 flex items-center gap-1">
                  <Plus className="h-3 w-3" />
                  <span className="text-xs uppercase">{t("home.version.feature")}</span>
                </Badge>
                <span className="text-xs text-muted-foreground">({featureItems.length})</span>
              </div>
              <ul className="space-y-1.5">
                {featureItems.slice(0, 3).map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <span className="text-primary mt-1">•</span>
                    <span className="text-muted-foreground">{item.text}</span>
                  </li>
                ))}
                {featureItems.length > 3 && (
                  <li className="text-xs text-muted-foreground/70 pl-4">
                    +{featureItems.length - 3} more...
                  </li>
                )}
              </ul>
            </div>
          )}

          {/* Improvements */}
          {improvementItems.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary" className="h-6 px-2 flex items-center gap-1">
                  <Wrench className="h-3 w-3" />
                  <span className="text-xs uppercase">{t("home.version.improvement")}</span>
                </Badge>
                <span className="text-xs text-muted-foreground">({improvementItems.length})</span>
              </div>
              <ul className="space-y-1.5">
                {improvementItems.slice(0, 3).map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <span className="text-secondary mt-1">•</span>
                    <span className="text-muted-foreground">{item.text}</span>
                  </li>
                ))}
                {improvementItems.length > 3 && (
                  <li className="text-xs text-muted-foreground/70 pl-4">
                    +{improvementItems.length - 3} more...
                  </li>
                )}
              </ul>
            </div>
          )}

          {/* Fixes */}
          {fixItems.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="h-6 px-2 flex items-center gap-1">
                  <Bug className="h-3 w-3" />
                  <span className="text-xs uppercase">{t("home.version.fix")}</span>
                </Badge>
                <span className="text-xs text-muted-foreground">({fixItems.length})</span>
              </div>
              <ul className="space-y-1.5">
                {fixItems.slice(0, 3).map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <span className="text-muted-foreground mt-1">•</span>
                    <span className="text-muted-foreground">{item.text}</span>
                  </li>
                ))}
                {fixItems.length > 3 && (
                  <li className="text-xs text-muted-foreground/70 pl-4">
                    +{fixItems.length - 3} more...
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>

        {/* Expandable Full Changelog */}
        <div className="border-t border-border/50 mt-4 pt-2">
          <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-between h-10 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-all duration-200"
              >
                <span>{t("home.version.viewChangelog")}</span>
                <ChevronDown
                  className={`h-4 w-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-4 space-y-4">
              {versionData.changelog.map((release, idx) => (
                <div
                  key={release.version}
                  className={idx > 0 ? "pt-4 border-t border-border/50" : ""}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span className="font-mono text-sm font-medium">
                      v{release.version}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(release.date).toLocaleDateString()}
                    </span>
                  </div>
                  <ul className="space-y-2 pl-2">
                    {release.highlights.map((item, itemIdx) => (
                      <li key={itemIdx} className="flex items-start gap-2 text-sm">
                        <span
                          className={`mt-0.5 ${
                            item.type === "feature"
                              ? "text-primary"
                              : item.type === "improvement"
                                ? "text-secondary"
                                : "text-muted-foreground"
                          }`}
                        >
                          {getTypeIcon(item.type)}
                        </span>
                        <span className="text-muted-foreground">{item.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>
        </div>
      </CardContent>
    </Card>
  );
};

export default VersionUpdates;
