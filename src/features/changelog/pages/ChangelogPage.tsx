import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Header from "@/shared/layouts/Header";
import Footer from "@/shared/layouts/Footer";
import { ResponsiveContainer } from "@/shared/components/responsive";
import { ScrollToTop } from "@/shared/components";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { 
  Rocket, 
  ChevronLeft, 
  Plus,
  Calendar,
  TrendingUp
} from "lucide-react";
import { useTranslation } from "@/shared/hooks/useTranslation";
import { useDocumentTitle } from "@/shared/hooks/useDocumentTitle";
import { parseVersionMarkdown, getVersionStats } from "../utils/parseVersionMarkdown";
import { VersionTimeline } from "../components";
import type { VersionData } from "../types";

// Import version markdown file
import versionMd from "@/content/data/version.md?raw";

const ChangelogPage = () => {
  const { t } = useTranslation();
  const [versionData, setVersionData] = useState<VersionData | null>(null);

  useDocumentTitle(t("changelog.pageTitle"));

  useEffect(() => {
    const data = parseVersionMarkdown(versionMd);
    setVersionData(data);
  }, []);

  if (!versionData) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pb-16">
          <ResponsiveContainer>
            <div className="py-12 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto" />
            </div>
          </ResponsiveContainer>
        </main>
        <Footer />
      </div>
    );
  }

  const stats = getVersionStats(versionData);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main id="main-content" className="pb-16" tabIndex={-1}>
        <ResponsiveContainer>
          {/* Breadcrumb */}
          <div className="pt-6 pb-4">
            <Link to="/">
              <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground">
                <ChevronLeft className="h-4 w-4" />
                {t("changelog.backToHome")}
              </Button>
            </Link>
          </div>

          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5">
                <Rocket className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                  {t("changelog.title")}
                </h1>
                <p className="text-muted-foreground mt-1">
                  {t("changelog.subtitle")}
                </p>
              </div>
            </div>

            {/* Current Version Banner */}
            <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
              <CardContent className="py-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Badge className="font-mono text-base px-4 py-1.5 bg-primary text-primary-foreground">
                      v{versionData.current}
                    </Badge>
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>{t("changelog.currentVersion")}</span>
                      <span>•</span>
                      <span>{new Date(versionData.releaseDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-8">
            <Card className="border-border/50">
              <CardContent className="py-4 text-center">
                <TrendingUp className="h-5 w-5 mx-auto mb-2 text-primary" />
                <div className="text-2xl font-bold text-foreground">{stats.totalVersions}</div>
                <div className="text-xs text-muted-foreground">{t("changelog.stats.versions")}</div>
              </CardContent>
            </Card>
            <Card className="border-border/50">
              <CardContent className="py-4 text-center">
                <Plus className="h-5 w-5 mx-auto mb-2 text-primary" />
                <div className="text-2xl font-bold text-foreground">{stats.totalFeatures}</div>
                <div className="text-xs text-muted-foreground">{t("changelog.stats.features")}</div>
              </CardContent>
            </Card>
          </div>

          {/* Version Timeline */}
          <VersionTimeline releases={versionData.changelog} />
        </ResponsiveContainer>
      </main>
      <Footer />
      <ScrollToTop />
    </div>
  );
};

export default ChangelogPage;
