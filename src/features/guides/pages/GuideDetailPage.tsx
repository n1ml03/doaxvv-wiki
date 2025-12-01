import { useParams, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { Header } from "@/shared/layouts";
import { Breadcrumb, RelatedContent, ResponsiveContainer, DatasetImage, MarkdownRenderer } from "@/shared/components";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Clock, User, Calendar, List, ChevronUp } from "lucide-react";
import { contentLoader, useGuideContent } from "@/content";
import type { Guide, Character } from "@/content";
import { useLanguage } from "@/shared/contexts/language-hooks";
import { getLocalizedValue } from "@/shared/utils/localization";
import { useCategories, useTags } from "@/content/hooks";

import { useTranslation } from "@/shared/hooks/useTranslation";

const GuideDetailPage = () => {
  const { unique_key } = useParams<{ unique_key: string }>();
  const { currentLanguage } = useLanguage();
  const { t } = useTranslation();
  const { data: categories = [] } = useCategories();
  const { data: tags = [] } = useTags();
  const [guide, setGuide] = useState<Guide | null>(null);
  const [guides, setGuides] = useState<Guide[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<string>("");
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Load guide markdown content
  const { rawContent, sections: markdownSections, isLoading: contentLoading } = useGuideContent(guide?.content_ref);

  useEffect(() => {
    async function loadContent() {
      await contentLoader.initialize();
      const foundGuide = contentLoader.getGuideByUniqueKey(unique_key || "");
      setGuide(foundGuide || null);
      setGuides(contentLoader.getGuides());
      setCharacters(contentLoader.getCharacters());
      setLoading(false);
    }
    loadContent();
  }, [unique_key]);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
      setActiveSection(sectionId);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main id="main-content" className="py-6 sm:py-8" tabIndex={-1}>
          <ResponsiveContainer>
            <div className="text-center py-16">
              <p className="text-lg text-muted-foreground">{t('guideDetail.loading')}</p>
            </div>
          </ResponsiveContainer>
        </main>
      </div>
    );
  }

  if (!guide) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main id="main-content" className="py-6 sm:py-8" tabIndex={-1}>
          <ResponsiveContainer>
            <Breadcrumb items={[{ label: t('nav.guides'), href: "/guides" }, { label: t('guideDetail.notFound') }]} />
            <div className="text-center py-16">
              <h1 className="text-2xl font-bold text-foreground mb-4">{t('guideDetail.notFound')}</h1>
              <Link to="/guides">
                <Button>{t('guideDetail.backToGuides')}</Button>
              </Link>
            </div>
          </ResponsiveContainer>
        </main>
      </div>
    );
  }
  const relatedGuides = guides.filter(g => 
    g.id !== guide.id && (g.category === guide.category || g.topics.some(t => guide.topics.includes(t)))
  ).slice(0, 4);

  const relatedCharacters = characters.slice(0, 4);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Easy": return "bg-accent text-accent-foreground";
      case "Medium": return "bg-primary text-primary-foreground";
      case "Hard": return "bg-destructive text-destructive-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getTopicLabel = (topic: string) => {
    const tag = tags.find(t => t.name.en === topic || t.unique_key === topic);
    return tag ? getLocalizedValue(tag.name, currentLanguage) : topic;
  };

  const category = categories.find(c => c.unique_key === guide.category);
  const categoryName = category ? getLocalizedValue(category.name, currentLanguage) : guide.category;
  const guideTitle = getLocalizedValue(guide.localizedTitle, currentLanguage);
  const guideSummary = getLocalizedValue(guide.localizedSummary, currentLanguage);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main id="main-content" className="py-6 sm:py-8" tabIndex={-1}>
        <ResponsiveContainer>
          <Breadcrumb items={[{ label: t('nav.guides'), href: "/guides" }, { label: guideTitle }]} />

          <article className="animate-fade-in">
            {/* Hero Banner */}
            <div className="relative aspect-[21/9] rounded-xl sm:rounded-2xl overflow-hidden mb-6 sm:mb-8">
              <DatasetImage
                src={guide.image}
                alt={guideTitle}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-8">
                <div className="flex flex-wrap gap-2 mb-2 sm:mb-4">
                  <Badge className={getDifficultyColor(guide.difficulty)}>{t(`difficulty.${guide.difficulty.toLowerCase()}`)}</Badge>
                  <Badge variant="outline" className="bg-background/90 text-foreground border-0">{categoryName}</Badge>
                </div>
                <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold text-white mb-2 sm:mb-4">{guideTitle}</h1>
                <p className="text-sm sm:text-lg text-white/90 max-w-3xl line-clamp-2 sm:line-clamp-none">{guideSummary}</p>
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
                      {t('guideDetail.tableOfContents')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <nav className="space-y-1">
                      {markdownSections.length > 0 ? (
                        // Use markdown sections for TOC
                        markdownSections
                          .filter(section => section.level <= 2) // Only show h1 and h2 in TOC
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
                        // Fallback to topics
                        guide.topics.map((topic, index) => {
                          const sectionId = `section-${index}`;
                          return (
                            <button
                              key={index}
                              onClick={() => scrollToSection(sectionId)}
                              className={`w-full text-left text-sm py-2 px-3 rounded-lg transition-colors ${
                                activeSection === sectionId 
                                  ? "bg-primary/10 text-primary font-medium" 
                                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                              }`}
                            >
                              {getTopicLabel(topic)}
                            </button>
                          );
                        })
                      )}
                    </nav>
                  </CardContent>
                </Card>

                {/* Guide Info */}
                <Card className="border-border/50 bg-card shadow-card">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">{t('guideDetail.guideInfo')}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-0">
                    <div className="flex items-center gap-3 text-sm">
                      <Clock className="h-4 w-4 text-primary" />
                      <span className="text-muted-foreground">{t('guideDetail.readTime')}</span>
                      <span className="font-medium">{guide.read_time}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <User className="h-4 w-4 text-primary" />
                      <span className="text-muted-foreground">{t('guideDetail.author')}</span>
                      <span className="font-medium">{guide.author}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Calendar className="h-4 w-4 text-primary" />
                      <span className="text-muted-foreground">{t('guideDetail.updated')}</span>
                      <span className="font-medium">{guide.updated_at}</span>
                    </div>

                    <div className="pt-3 border-t border-border/50">
                      <div className="text-sm font-medium mb-2">{t('guideDetail.topicsCovered')}</div>
                      <div className="flex flex-wrap gap-1.5">
                        {guide.topics.map((topic, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {getTopicLabel(topic)}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </aside>


            {/* Main Content */}
            <div className="lg:col-span-3 order-1 lg:order-2 space-y-6">
              <Card className="border-border/50 bg-card shadow-card">
                <CardHeader>
                  <CardTitle className="text-xl">{t('guideDetail.guideContent')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed mb-6">{guideSummary}</p>
                  
                  {contentLoading ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">{t('guideDetail.loadingContent')}</p>
                    </div>
                  ) : rawContent ? (
                    <MarkdownRenderer content={rawContent} />
                  ) : (
                    <div className="space-y-4">
                      {guide.topics.map((topic, index) => (
                        <div key={index} id={`section-${index}`} className="scroll-mt-24">
                          <h3 className="text-lg font-semibold text-foreground mb-2">{getTopicLabel(topic)}</h3>
                          <p className="text-muted-foreground">{t('guideDetail.contentComingSoon')}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Resources */}
              <Card className="border-border/50 bg-gradient-to-br from-primary/5 to-accent/5 shadow-card">
                <CardHeader>
                  <CardTitle>{t('guideDetail.additionalResources')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Link to="/girls">
                      <Button variant="outline" className="w-full justify-start">
                        {t('guideDetail.viewAllCharacters')}
                      </Button>
                    </Link>
                    <Link to="/swimsuits">
                      <Button variant="outline" className="w-full justify-start">
                        {t('guideDetail.browseSwimsuits')}
                      </Button>
                    </Link>
                    <Link to="/events">
                      <Button variant="outline" className="w-full justify-start">
                        {t('guideDetail.currentEvents')}
                      </Button>
                    </Link>
                    <Link to="/gachas">
                      <Button variant="outline" className="w-full justify-start">
                        {t('guideDetail.gachaInformation')}
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

            {/* Related Content */}
            <RelatedContent
              title={t('guideDetail.relatedGuides')}
              items={relatedGuides.map(g => ({
                id: g.id,
                title: g.title,
                image: g.image,
                href: `/guides/${g.unique_key}`,
                badge: t(`difficulty.${g.difficulty.toLowerCase()}`),
                description: g.summary,
              }))}
              viewAllHref="/guides"
              viewAllLabel={t('guideDetail.viewAllGuides')}
            />

            <RelatedContent
              title={t('guideDetail.featuredCharacters')}
              items={relatedCharacters.map(char => ({
                id: char.id,
                title: char.title,
                image: char.image,
                href: `/girls/${char.unique_key}`,
              }))}
              viewAllHref="/girls"
              viewAllLabel={t('guideDetail.viewAllGirls')}
            />
          </article>

          {/* Scroll to Top Button */}
          {showScrollTop && (
            <button
              onClick={scrollToTop}
              className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 p-2.5 sm:p-3 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-all animate-fade-in z-50"
              aria-label="Scroll to top"
            >
              <ChevronUp className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          )}
        </ResponsiveContainer>
      </main>
    </div>
  );
};

export default GuideDetailPage;
