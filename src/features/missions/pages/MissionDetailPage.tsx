import { useParams, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { Header } from "@/shared/layouts";
import { Breadcrumb, RelatedContent, LocalizedText, ResponsiveContainer, DatasetImage, UniqueKeyDisplay, ScrollToTop } from "@/shared/components";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Target, Gift, Info, Calendar, CheckCircle, Lock, AlertCircle } from "lucide-react";
import { contentLoader } from "@/content";
import type { Mission, Event } from "@/content";
import { getLocalizedValue } from "@/shared/utils/localization";
import { useLanguage } from "@/shared/contexts/language-hooks";
import { useTranslation } from "@/shared/hooks/useTranslation";

const MissionDetailPage = () => {
  const { unique_key } = useParams<{ unique_key: string }>();
  const { currentLanguage } = useLanguage();
  const { t } = useTranslation();
  const [mission, setMission] = useState<Mission | null>(null);
  const [relatedEvent, setRelatedEvent] = useState<Event | null>(null);
  const [relatedMissions, setRelatedMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadContent() {
      await contentLoader.initialize();
      const foundMission = contentLoader.getMissionByKey(unique_key || "");
      setMission(foundMission || null);
      
      if (foundMission) {
        // Get related event if event_id exists
        if (foundMission.event_id) {
          const event = contentLoader.getEventByUniqueKey(foundMission.event_id);
          setRelatedEvent(event || null);
        }
        
        // Get related missions (same type or same status)
        const allMissions = contentLoader.getMissions();
        const related = allMissions.filter(m => 
          m.id !== foundMission.id && 
          (m.type === foundMission.type || m.mission_status === foundMission.mission_status)
        ).slice(0, 4);
        setRelatedMissions(related);
      }
      
      setLoading(false);
    }
    loadContent();
  }, [unique_key]);


  const getTypeColor = (type: string) => {
    switch (type) {
      case "Daily": return "bg-blue-500/80 text-white";
      case "Weekly": return "bg-purple-500/80 text-white";
      case "Challenge": return "bg-orange-500/80 text-white";
      case "Event": return "bg-pink-500/80 text-white";
      case "Story": return "bg-green-500/80 text-white";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active": return "bg-accent text-accent-foreground";
      case "Completed": return "bg-green-600 text-white";
      case "Expired": return "bg-muted text-muted-foreground";
      case "Locked": return "bg-gray-500 text-white";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Active": return <CheckCircle className="h-4 w-4" />;
      case "Completed": return <CheckCircle className="h-4 w-4" />;
      case "Expired": return <AlertCircle className="h-4 w-4" />;
      case "Locked": return <Lock className="h-4 w-4" />;
      default: return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main id="main-content" className="py-6 sm:py-8" tabIndex={-1}>
          <ResponsiveContainer>
            <div className="text-center py-16">
              <p className="text-lg text-muted-foreground">{t('missionDetail.loading')}</p>
            </div>
          </ResponsiveContainer>
        </main>
      </div>
    );
  }

  if (!mission) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main id="main-content" className="py-6 sm:py-8" tabIndex={-1}>
          <ResponsiveContainer>
            <Breadcrumb items={[{ label: t('nav.missions'), href: "/missions" }, { label: t('missionDetail.notFound') }]} />
            <div className="text-center py-16">
              <h1 className="text-2xl font-bold text-foreground mb-4">{t('missionDetail.notFound')}</h1>
              <Link to="/missions">
                <Button>{t('missionDetail.backToMissions')}</Button>
              </Link>
            </div>
          </ResponsiveContainer>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main id="main-content" className="py-6 sm:py-8" tabIndex={-1}>
        <ResponsiveContainer>
          <Breadcrumb items={[
            { label: t('nav.missions'), href: "/missions" }, 
            { label: getLocalizedValue(mission.name, currentLanguage) }
          ]} />

          <div className="animate-fade-in">
            {/* Hero Banner */}
            {mission.image && (
              <div className="relative aspect-[21/9] sm:aspect-[21/9] rounded-xl sm:rounded-2xl overflow-hidden mb-6 sm:mb-8">
                <DatasetImage
                  src={mission.image}
                  alt={getLocalizedValue(mission.name, currentLanguage)}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-8">
                  <div className="flex flex-wrap gap-2 mb-3 sm:mb-4">
                    <Badge className={getTypeColor(mission.type)}>
                      {t(`missionType.${mission.type.toLowerCase()}`)}
                    </Badge>
                    <Badge className={getStatusColor(mission.mission_status)}>
                      {getStatusIcon(mission.mission_status)}
                      <span className="ml-1">{t(`missionStatus.${mission.mission_status.toLowerCase()}`)}</span>
                    </Badge>
                  </div>
                  <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold text-white mb-2 sm:mb-4">
                    <LocalizedText localized={mission.name} showIndicator />
                  </h1>
                </div>
              </div>
            )}

            {/* Title section for missions without image */}
            {!mission.image && (
              <div className="mb-6 sm:mb-8">
                <div className="flex flex-wrap gap-2 mb-3">
                  <Badge className={getTypeColor(mission.type)}>
                    {t(`missionType.${mission.type.toLowerCase()}`)}
                  </Badge>
                  <Badge className={getStatusColor(mission.mission_status)}>
                    {getStatusIcon(mission.mission_status)}
                    <span className="ml-1">{t(`missionStatus.${mission.mission_status.toLowerCase()}`)}</span>
                  </Badge>
                </div>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground">
                  <LocalizedText localized={mission.name} showIndicator />
                </h1>
              </div>
            )}

            {/* Main content grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                {/* Description */}
                {mission.description && (
                  <Card className="border-border/50 bg-card shadow-card">
                    <CardHeader>
                      <CardTitle className="text-xl flex items-center gap-2">
                        <Info className="h-5 w-5 text-primary" />
                        {t('missionDetail.about')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground leading-relaxed">
                        <LocalizedText localized={mission.description} showIndicator />
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Objectives */}
                <Card className="border-border/50 bg-card shadow-card">
                  <CardHeader>
                    <CardTitle className="text-xl flex items-center gap-2">
                      <Target className="h-5 w-5 text-primary" />
                      {t('missionDetail.objectives')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {mission.objectives.map((objective, index) => (
                        <li key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-bold">
                            {index + 1}
                          </span>
                          <span className="text-sm text-foreground">{objective}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                {/* Requirements */}
                {mission.requirements && mission.requirements.length > 0 && (
                  <Card className="border-border/50 bg-card shadow-card">
                    <CardHeader>
                      <CardTitle className="text-xl flex items-center gap-2">
                        <Lock className="h-5 w-5 text-primary" />
                        {t('missionDetail.requirements')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {mission.requirements.map((req, index) => (
                          <li key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                            <CheckCircle className="h-4 w-4 text-primary" />
                            {req}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Rewards */}
                <Card className="border-border/50 bg-card shadow-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Gift className="h-5 w-5 text-primary" />
                      {t('missionDetail.rewards')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {mission.rewards.map((reward, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                          <div className="h-2 w-2 rounded-full bg-primary" />
                          <span className="text-sm text-foreground">{reward}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Related Event */}
                {relatedEvent && (
                  <Card className="border-border/50 bg-card shadow-card">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-primary" />
                        {t('missionDetail.relatedEvent')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Link to={`/events/${relatedEvent.unique_key}`}>
                        <div className="group p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                          <p className="font-medium text-foreground group-hover:text-primary transition-colors">
                            {getLocalizedValue(relatedEvent.name, currentLanguage)}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {t(`status.${relatedEvent.event_status.toLowerCase()}`)}
                          </p>
                        </div>
                      </Link>
                    </CardContent>
                  </Card>
                )}

                {/* Additional Info */}
                <Card className="border-border/50 bg-gradient-to-br from-primary/5 to-accent/5 shadow-card">
                  <CardHeader>
                    <CardTitle className="text-xl flex items-center gap-2">
                      <Info className="h-5 w-5 text-primary" />
                      {t('missionDetail.additionalInfo')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-muted-foreground text-sm">
                      {t('missionDetail.author')}: {mission.author} | {t('missionDetail.updated')}: {mission.updated_at}
                    </p>
                    <UniqueKeyDisplay uniqueKey={mission.unique_key} />
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Related Missions */}
            {relatedMissions.length > 0 && (
              <RelatedContent
                title={t('missionDetail.relatedMissions')}
                items={relatedMissions.map(m => ({
                  id: m.id,
                  title: getLocalizedValue(m.name, currentLanguage),
                  image: m.image || '',
                  href: `/missions/${m.unique_key}`,
                  badge: m.type,
                  description: m.description ? getLocalizedValue(m.description, currentLanguage) : '',
                }))}
                viewAllHref="/missions"
                viewAllLabel={t('missionDetail.viewAllMissions')}
              />
            )}

            <ScrollToTop />
          </div>
        </ResponsiveContainer>
      </main>
    </div>
  );
};

export default MissionDetailPage;
