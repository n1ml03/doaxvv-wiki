import { Suspense, lazy, useEffect } from "react";
import { Toaster } from "@/shared/components/ui/toaster";
import { Toaster as Sonner } from "@/shared/components/ui/sonner";
import { TooltipProvider } from "@/shared/components/ui/tooltip";
import { ThemeProvider } from "@/shared/components/ThemeProvider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";

// Scroll to top on route change
const useScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
};

// Lazy load feature pages
const HomePage = lazy(() => import("@/features/home").then(m => ({ default: m.HomePage })));
const CharactersPage = lazy(() => import("@/features/characters").then(m => ({ default: m.CharactersPage })));
const CharacterDetailPage = lazy(() => import("@/features/characters").then(m => ({ default: m.CharacterDetailPage })));
const EventsPage = lazy(() => import("@/features/events").then(m => ({ default: m.EventsPage })));
const EventDetailPage = lazy(() => import("@/features/events").then(m => ({ default: m.EventDetailPage })));
const FestivalsPage = lazy(() => import("@/features/festivals").then(m => ({ default: m.FestivalsPage })));
const FestivalDetailPage = lazy(() => import("@/features/festivals").then(m => ({ default: m.FestivalDetailPage })));
const GachasPage = lazy(() => import("@/features/gachas").then(m => ({ default: m.GachasPage })));
const GachaDetailPage = lazy(() => import("@/features/gachas").then(m => ({ default: m.GachaDetailPage })));
const GuidesPage = lazy(() => import("@/features/guides").then(m => ({ default: m.GuidesPage })));
const GuideDetailPage = lazy(() => import("@/features/guides").then(m => ({ default: m.GuideDetailPage })));
const ToolsPage = lazy(() => import("@/features/tools").then(m => ({ default: m.ToolsPage })));
const ToolDetailPage = lazy(() => import("@/features/tools").then(m => ({ default: m.ToolDetailPage })));
const SwimsuitsPage = lazy(() => import("@/features/swimsuits").then(m => ({ default: m.SwimsuitsPage })));
const SwimsuitDetailPage = lazy(() => import("@/features/swimsuits").then(m => ({ default: m.SwimsuitDetailPage })));
const ItemsPage = lazy(() => import("@/features/items").then(m => ({ default: m.ItemsPage })));
const ItemDetailPage = lazy(() => import("@/features/items").then(m => ({ default: m.ItemDetailPage })));
const EpisodesPage = lazy(() => import("@/features/episodes").then(m => ({ default: m.EpisodesPage })));
const EpisodeDetailPage = lazy(() => import("@/features/episodes").then(m => ({ default: m.EpisodeDetailPage })));
const AccessoriesPage = lazy(() => import("@/features/accessories").then(m => ({ default: m.AccessoriesPage })));
const AccessoryDetailPage = lazy(() => import("@/features/accessories").then(m => ({ default: m.AccessoryDetailPage })));
const MissionsPage = lazy(() => import("@/features/missions").then(m => ({ default: m.MissionsPage })));
const MissionDetailPage = lazy(() => import("@/features/missions").then(m => ({ default: m.MissionDetailPage })));
const QuizzesPage = lazy(() => import("@/features/quiz").then(m => ({ default: m.QuizzesPage })));
const QuizDetailPage = lazy(() => import("@/features/quiz").then(m => ({ default: m.QuizDetailPage })));
const QuizTakingPage = lazy(() => import("@/features/quiz").then(m => ({ default: m.QuizTakingPage })));
const QuizResultPage = lazy(() => import("@/features/quiz").then(m => ({ default: m.QuizResultPage })));
const SearchResultsPage = lazy(() => import("@/features/search").then(m => ({ default: m.SearchResultsPage })));
const NotFoundPage = lazy(() => import("@/shared/pages").then(m => ({ default: m.NotFoundPage })));

const queryClient = new QueryClient();

const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <AppRoutes />
      </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

// Separate component to use hooks inside BrowserRouter
const AppRoutes = () => {
  useScrollToTop();
  
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/girls" element={<CharactersPage />} />
            <Route path="/girls/:unique_key" element={<CharacterDetailPage />} />
            <Route path="/events" element={<EventsPage />} />
            <Route path="/events/:unique_key" element={<EventDetailPage />} />
            <Route path="/festivals" element={<FestivalsPage />} />
            <Route path="/festivals/:unique_key" element={<FestivalDetailPage />} />
            <Route path="/gachas" element={<GachasPage />} />
            <Route path="/gachas/:unique_key" element={<GachaDetailPage />} />
            <Route path="/guides" element={<GuidesPage />} />
            <Route path="/guides/:unique_key" element={<GuideDetailPage />} />
            <Route path="/tools" element={<ToolsPage />} />
            <Route path="/tools/:unique_key" element={<ToolDetailPage />} />
            <Route path="/swimsuits" element={<SwimsuitsPage />} />
            <Route path="/swimsuits/:unique_key" element={<SwimsuitDetailPage />} />
            <Route path="/items" element={<ItemsPage />} />
            <Route path="/items/:unique_key" element={<ItemDetailPage />} />
            <Route path="/episodes" element={<EpisodesPage />} />
            <Route path="/episodes/:unique_key" element={<EpisodeDetailPage />} />
            <Route path="/accessories" element={<AccessoriesPage />} />
            <Route path="/accessories/:unique_key" element={<AccessoryDetailPage />} />
            <Route path="/missions" element={<MissionsPage />} />
            <Route path="/missions/:unique_key" element={<MissionDetailPage />} />
            <Route path="/quizzes" element={<QuizzesPage />} />
            <Route path="/quizzes/:unique_key" element={<QuizDetailPage />} />
            <Route path="/quizzes/:unique_key/take" element={<QuizTakingPage />} />
            <Route path="/quizzes/:unique_key/result" element={<QuizResultPage />} />
            <Route path="/search" element={<SearchResultsPage />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
    </Suspense>
  );
};

export default App;
