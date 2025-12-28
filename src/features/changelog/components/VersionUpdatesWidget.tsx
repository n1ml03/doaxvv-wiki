import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Rocket, ArrowRight, Plus } from "lucide-react";
import { useTranslation } from "@/shared/hooks/useTranslation";
import { parseVersionMarkdown } from "../utils/parseVersionMarkdown";
import type { VersionData } from "../types";

// Import version markdown file
import versionMd from "@/content/data/version.md?raw";

const VersionUpdatesWidget = () => {
  const { t } = useTranslation();
  const [versionData, setVersionData] = useState<VersionData | null>(null);

  useEffect(() => {
    const data = parseVersionMarkdown(versionMd);
    setVersionData(data);
  }, []);

  if (!versionData || versionData.changelog.length === 0) {
    return null;
  }

  const latestVersion = versionData.changelog[0];
  const featureCount = latestVersion.highlights.filter(h => h.type === "feature").length;

  // Get top 4 features for preview
  const previewItems = latestVersion.highlights
    .filter(h => h.type === "feature")
    .slice(0, 4);

  const remainingChanges = featureCount - previewItems.length;

  return (
    <Card className="border-border/50 bg-card shadow-card animate-fade-in">
      <CardHeader className="pb-3">
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
            className="text-sm font-mono px-3 py-1 self-start sm:self-auto bg-primary text-primary-foreground"
          >
            v{versionData.current}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {/* Quick Stats */}
        {featureCount > 0 && (
          <div className="flex items-center gap-1.5 text-sm mb-4">
            <Plus className="h-3.5 w-3.5 text-primary" />
            <span className="text-muted-foreground">{featureCount} {t("changelog.type.feature")}</span>
          </div>
        )}

        {/* Preview Items */}
        <ul className="space-y-2 mb-4">
          {previewItems.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2 text-sm">
              <span className="mt-1.5 h-1.5 w-1.5 rounded-full flex-shrink-0 bg-primary" />
              <span className="text-muted-foreground line-clamp-1">{item.text}</span>
            </li>
          ))}
        </ul>

        {/* View All Link */}
        <Link to="/changelog">
          <Button variant="ghost" size="sm" className="w-full justify-between group">
            <span>
              {remainingChanges > 0 
                ? `+${remainingChanges} ${t("changelog.viewAll")}`
                : t("changelog.viewAll")
              }
            </span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
};

export default VersionUpdatesWidget;
