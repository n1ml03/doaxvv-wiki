import { useParams, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { Header } from "@/shared/layouts";
import { Breadcrumb, ResponsiveContainer, DatasetImage, MarkdownRenderer, ScrollToTop } from "@/shared/components";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { User, Calendar, List, Wrench, Copy, Check, FolderOpen, Tag } from "lucide-react";
import { contentLoader, useGuideContent } from "@/content";
import { useCategories } from "@/content/hooks";
import type { Tool } from "@/content";
import { useLanguage } from "@/shared/contexts/language-hooks";
import { getLocalizedValue } from "@/shared/utils/localization";
import { useTranslation } from "@/shared/hooks/useTranslation";
import { useToast } from "@/shared/hooks/use-toast";

const ToolDetailPage = () => {
  const { unique_key } = useParams<{ unique_key: string }>();
  const { currentLanguage } = useLanguage();
  const { t } = useTranslation();
  const { toast } = useToast();
  const { data: categories = [] } = useCategories();
  const [tool, setTool] = useState<Tool | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<string>("");
  const [copied, setCopied] = useState(false);

  // Load tool markdown content
  const { rawContent, sections: markdownSections, isLoading: contentLoading } = useGuideContent(tool?.content_ref);

  useEffect(() => {
    async function loadContent() {
      await contentLoader.initialize();
      const foundTool = contentLoader.getToolByUniqueKey(unique_key || "");
      setTool(foundTool || null);
      setLoading(false);
    }
    loadContent();
  }, [unique_key]);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
      setActiveSection(sectionId);
    }
  };

  const handleCopyPath = async () => {
    if (!tool?.windows_path) return;
    
    try {
      await navigator.clipboard.writeText(tool.windows_path);
      setCopied(true);
      toast({
        title: t('toolDetail.pathCopied'),
        description: tool.windows_path,
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: show the path in a toast for manual copying
      toast({
        title: t('toolDetail.copyFailed'),
        description: tool.windows_path,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main id="main-content" className="py-6 sm:py-8" tabIndex={-1}>
          <ResponsiveContainer>
            <div className="text-center py-16">
              <p className="text-lg text-muted-foreground">{t('toolDetail.loading')}</p>
            </div>
          </ResponsiveContainer>
        </main>
      </div>
    );
  }

  if (!tool) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main id="main-content" className="py-6 sm:py-8" tabIndex={-1}>
          <ResponsiveContainer>
            <Breadcrumb items={[{ label: t('nav.tools'), href: "/tools" }, { label: t('toolDetail.notFound') }]} />
            <div className="text-center py-16">
              <h1 className="text-2xl font-bold text-foreground mb-4">{t('toolDetail.notFound')}</h1>
              <Link to="/tools">
                <Button>{t('toolDetail.backToTools')}</Button>
              </Link>
            </div>
          </ResponsiveContainer>
        </main>
      </div>
    );
  }

  const category = categories.find(c => c.unique_key === tool.category);
  const categoryName = category ? getLocalizedValue(category.name, currentLanguage) : tool.category;
  const toolTitle = getLocalizedValue(tool.localizedTitle, currentLanguage);
  const toolSummary = getLocalizedValue(tool.localizedSummary, currentLanguage);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main id="main-content" className="py-6 sm:py-8" tabIndex={-1}>
        <ResponsiveContainer>
          <Breadcrumb items={[{ label: t('nav.tools'), href: "/tools" }, { label: toolTitle }]} />

          <article className="animate-fade-in">
            {/* Hero Banner */}
            <div className="relative aspect-[21/9] rounded-xl sm:rounded-2xl overflow-hidden mb-6 sm:mb-8">
              <DatasetImage
                src={tool.image}
                alt={toolTitle}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-8">
                <div className="flex flex-wrap gap-2 mb-2 sm:mb-4">
                  <Badge variant="outline" className="bg-background/90 text-foreground border-0">
                    <Wrench className="h-3 w-3 mr-1" />
                    {categoryName}
                  </Badge>
                  {tool.version && (
                    <Badge variant="secondary" className="bg-background/90 text-foreground border-0">
                      v{tool.version}
                    </Badge>
                  )}
                </div>
                <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold text-white mb-2 sm:mb-4">{toolTitle}</h1>
                <p className="text-sm sm:text-lg text-white/90 max-w-3xl line-clamp-2 sm:line-clamp-none">{toolSummary}</p>
              </div>
            </div>

            {/* Sidebar stacks below on mobile */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
              {/* Table of Contents - Sidebar */}
              <aside className="lg:col-span-1 order-2 lg:order-1">
                <div className="lg:sticky lg:top-24 space-y-6">
                  {/* TOC */}
                  <Card className="border-border/50 bg-card shadow-card">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <List className="h-5 w-5 text-primary" />
                        {t('toolDetail.tableOfContents')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <nav className="space-y-1">
                        {markdownSections.length > 0 ? (
                          markdownSections
                            .filter(section => section.level <= 2)
                            .map((section, index) => {
                              const sectionId = `section-${section.id}`;
                              return (
                                <button
                                  key={index}
                                  onClick={() => scrollToSection(sectionId)}
                                  className={`w-full text-left text-sm py-2 px-3 rounded-lg transition-colors ${
                                    section.level === 2 ? 'pl-6' : ''
                                  } ${
                                    activeSection === sectionId 
                                      ? "bg-primary/10 text-primary font-medium" 
                                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                  }`}
                                >
                                  {section.title}
                                </button>
                              );
                            })
                        ) : (
                          <p className="text-sm text-muted-foreground">{t('toolDetail.noSections')}</p>
                        )}
                      </nav>
                    </CardContent>
                  </Card>

                  {/* Tool Info */}
                  <Card className="border-border/50 bg-card shadow-card">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">{t('toolDetail.toolInfo')}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 pt-0">
                      <div className="flex items-center gap-3 text-sm">
                        <User className="h-4 w-4 text-primary" />
                        <span className="text-muted-foreground">{t('toolDetail.author')}</span>
                        <span className="font-medium">{tool.author}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <Calendar className="h-4 w-4 text-primary" />
                        <span className="text-muted-foreground">{t('toolDetail.updated')}</span>
                        <span className="font-medium">{tool.updated_at}</span>
                      </div>
                      {tool.version && (
                        <div className="flex items-center gap-3 text-sm">
                          <Tag className="h-4 w-4 text-primary" />
                          <span className="text-muted-foreground">{t('toolDetail.version')}</span>
                          <span className="font-medium">v{tool.version}</span>
                        </div>
                      )}

                      {tool.tags && tool.tags.length > 0 && (
                        <div className="pt-3 border-t border-border/50">
                          <div className="text-sm font-medium mb-2">{t('toolDetail.tags')}</div>
                          <div className="flex flex-wrap gap-1.5">
                            {tool.tags.map((tag, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Windows Path Section - Only shown when windows_path exists */}
                  {tool.windows_path && (
                    <Card className="border-border/50 bg-card shadow-card">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <FolderOpen className="h-5 w-5 text-primary" />
                          {t('toolDetail.location')}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3 pt-0">
                        <div className="p-3 bg-muted rounded-lg">
                          <code className="text-sm font-mono break-all text-foreground">
                            {tool.windows_path}
                          </code>
                        </div>
                        <Button 
                          onClick={handleCopyPath} 
                          className="w-full"
                          variant="outline"
                        >
                          {copied ? (
                            <>
                              <Check className="h-4 w-4 mr-2" />
                              {t('toolDetail.copied')}
                            </>
                          ) : (
                            <>
                              <Copy className="h-4 w-4 mr-2" />
                              {t('toolDetail.openFolder')}
                            </>
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </aside>

              {/* Main Content */}
              <div className="lg:col-span-3 order-1 lg:order-2 space-y-6">
                <Card className="border-border/50 bg-card shadow-card">
                  <CardHeader>
                    <CardTitle className="text-xl">{t('toolDetail.usageInstructions')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground leading-relaxed mb-6">{toolSummary}</p>
                    
                    {contentLoading ? (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">{t('toolDetail.loadingContent')}</p>
                      </div>
                    ) : rawContent ? (
                      <MarkdownRenderer content={rawContent} />
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">{t('toolDetail.contentComingSoon')}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Additional Resources */}
                <Card className="border-border/50 bg-gradient-to-br from-primary/5 to-accent/5 shadow-card">
                  <CardHeader>
                    <CardTitle>{t('toolDetail.additionalResources')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Link to="/tools">
                        <Button variant="outline" className="w-full justify-start">
                          {t('toolDetail.viewAllTools')}
                        </Button>
                      </Link>
                      <Link to="/guides">
                        <Button variant="outline" className="w-full justify-start">
                          {t('toolDetail.browseGuides')}
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </article>

          <ScrollToTop />
        </ResponsiveContainer>
      </main>
    </div>
  );
};

export default ToolDetailPage;
