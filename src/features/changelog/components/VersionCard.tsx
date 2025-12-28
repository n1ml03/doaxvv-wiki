import { Badge } from "@/shared/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/shared/components/ui/card";
import { Plus, Calendar } from "lucide-react";
import { useTranslation } from "@/shared/hooks/useTranslation";
import type { VersionRelease } from "../types";

interface VersionCardProps {
  release: VersionRelease;
  isLatest?: boolean;
}

const VersionCard = ({ release, isLatest = false }: VersionCardProps) => {
  const { t } = useTranslation();

  const features = release.highlights.filter(h => h.type === "feature");

  if (features.length === 0) return null;

  return (
    <Card className={`border-border/50 bg-card shadow-card transition-all duration-300 hover:shadow-hover ${isLatest ? "ring-2 ring-primary/20" : ""}`}>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-3">
            <Badge 
              variant="secondary" 
              className={`font-mono text-sm px-3 py-1 ${isLatest ? "bg-primary text-primary-foreground" : ""}`}
            >
              v{release.version}
            </Badge>
            {isLatest && (
              <Badge variant="outline" className="text-xs border-primary/30 text-primary">
                {t("changelog.latest")}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            <span>{new Date(release.date).toLocaleDateString()}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="h-6 px-2 flex items-center gap-1.5 bg-primary/10 text-primary border-primary/20">
              <Plus className="h-3.5 w-3.5" />
              <span className="text-xs font-medium">{t("changelog.type.feature")}</span>
            </Badge>
            <span className="text-xs text-muted-foreground">({features.length})</span>
          </div>
          <ul className="space-y-1.5 pl-1">
            {features.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-sm">
                <span className="mt-2 h-1.5 w-1.5 rounded-full flex-shrink-0 bg-primary" />
                <span className="text-foreground/90">{item.text}</span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default VersionCard;
