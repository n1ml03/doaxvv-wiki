import { Suspense, lazy } from "react";
import { Toaster } from "@/shared/components/ui/toaster";
import { Toaster as Sonner } from "@/shared/components/ui/sonner";
import { TooltipProvider } from "@/shared/components/ui/tooltip";
import { ThemeProvider } from "@/shared/components/ThemeProvider";
import { CustomContextMenu } from "@/shared/components";
import { QueryClientProvider } from "@tanstack/react-query";
import { createBrowserRouter, RouterProvider, Outlet, useNavigation, ScrollRestoration } from "react-router-dom";
import { queryClient } from "@/lib/query-client";
import {
  homeLoader,
  charactersLoader,
  characterDetailLoader,
  eventsLoader,
  eventDetailLoader,
  swimsuitsLoader,
  swimsuitDetailLoader,
  guidesLoader,
  guideDetailLoader,
  gachasLoader,
  gachaDetailLoader,
  itemsLoader,
  itemDetailLoader,
  episodesLoader,
  episodeDetailLoader,
  accessoriesLoader,
  accessoryDetailLoader,
  missionsLoader,
  missionDetailLoader,
  festivalsLoader,
  festivalDetailLoader,
  toolsLoader,
  toolDetailLoader,
  quizzesLoader,
  quizDetailLoader,
} from "@/lib/loaders";

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
const ChangelogPage = lazy(() => import("@/features/changelog").then(m => ({ default: m.ChangelogPage })));
const NotFoundPage = lazy(() => import("@/shared/pages").then(m => ({ default: m.NotFoundPage })));

// Loading fallback component
const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
  </div>
);

// Global loading indicator for route transitions
const GlobalLoadingIndicator = () => {
  const navigation = useNavigation();
  
  if (navigation.state === "loading") {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-primary/20">
        <div className="h-full bg-primary animate-pulse" style={{ width: '100%' }} />
      </div>
    );
  }
  
  return null;
};

// Root layout component
const RootLayout = () => (
  <>
    <GlobalLoadingIndicator />
    <ScrollRestoration />
    <Suspense fallback={<LoadingFallback />}>
      <Outlet />
    </Suspense>
  </>
);

// Create router with data APIs
const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { path: "/", element: <HomePage />, loader: homeLoader },
      { path: "/girls", element: <CharactersPage />, loader: charactersLoader },
      { path: "/girls/:unique_key", element: <CharacterDetailPage />, loader: characterDetailLoader },
      { path: "/events", element: <EventsPage />, loader: eventsLoader },
      { path: "/events/:unique_key", element: <EventDetailPage />, loader: eventDetailLoader },
      { path: "/festivals", element: <FestivalsPage />, loader: festivalsLoader },
      { path: "/festivals/:unique_key", element: <FestivalDetailPage />, loader: festivalDetailLoader },
      { path: "/gachas", element: <GachasPage />, loader: gachasLoader },
      { path: "/gachas/:unique_key", element: <GachaDetailPage />, loader: gachaDetailLoader },
      { path: "/guides", element: <GuidesPage />, loader: guidesLoader },
      { path: "/guides/:unique_key", element: <GuideDetailPage />, loader: guideDetailLoader },
      { path: "/tools", element: <ToolsPage />, loader: toolsLoader },
      { path: "/tools/:unique_key", element: <ToolDetailPage />, loader: toolDetailLoader },
      { path: "/swimsuits", element: <SwimsuitsPage />, loader: swimsuitsLoader },
      { path: "/swimsuits/:unique_key", element: <SwimsuitDetailPage />, loader: swimsuitDetailLoader },
      { path: "/items", element: <ItemsPage />, loader: itemsLoader },
      { path: "/items/:unique_key", element: <ItemDetailPage />, loader: itemDetailLoader },
      { path: "/episodes", element: <EpisodesPage />, loader: episodesLoader },
      { path: "/episodes/:unique_key", element: <EpisodeDetailPage />, loader: episodeDetailLoader },
      { path: "/accessories", element: <AccessoriesPage />, loader: accessoriesLoader },
      { path: "/accessories/:unique_key", element: <AccessoryDetailPage />, loader: accessoryDetailLoader },
      { path: "/missions", element: <MissionsPage />, loader: missionsLoader },
      { path: "/missions/:unique_key", element: <MissionDetailPage />, loader: missionDetailLoader },
      { path: "/quizzes", element: <QuizzesPage />, loader: quizzesLoader },
      { path: "/quizzes/:unique_key", element: <QuizDetailPage />, loader: quizDetailLoader },
      { path: "/quizzes/:unique_key/take", element: <QuizTakingPage />, loader: quizDetailLoader },
      { path: "/quizzes/:unique_key/result", element: <QuizResultPage /> },
      { path: "/search", element: <SearchResultsPage /> },
      { path: "/changelog", element: <ChangelogPage /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
], {
  future: {
    v7_relativeSplatPath: true,
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        {/* <CustomContextMenu /> */}
        <RouterProvider router={router} />
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
