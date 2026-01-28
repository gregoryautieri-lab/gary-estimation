import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { RoleBasedRoute } from "@/components/RoleBasedRoute";
import { useBeforeUnloadWarning } from "@/hooks/useBeforeUnloadWarning";
import Index from "./pages/Index";
import EstimationsList from "./pages/EstimationsList";
import LeadsPage from "./pages/leads/LeadsPage";
import LeadNewPage from "./pages/leads/LeadNewPage";
import LeadDetailPage from "./pages/leads/LeadDetailPage";
import ComparablesProjects from "./pages/comparables/ComparablesProjects";
import NewProject from "./pages/comparables/NewProject";
import ComparablesExplore from "./pages/comparables/ComparablesExplore";
import ProjectDetail from "./pages/comparables/ProjectDetail";
import EstimationOverview from "./pages/estimation/EstimationOverview";
import Module1Identification from "./pages/estimation/Module1Identification";
import Module2Caracteristiques from "./pages/estimation/Module2Caracteristiques";
import Module3AnalyseTerrain from "./pages/estimation/Module3AnalyseTerrain";
import ModulePhotos from "./pages/estimation/ModulePhotos";
import Module4PreEstimation from "./pages/estimation/Module4PreEstimation";
import Module5Strategie from "./pages/estimation/Module5Strategie";
import PresentationPage from "./pages/estimation/PresentationPage";
import EstimationExpress from "./pages/estimation/EstimationExpress";
import HistoryView from "./pages/estimation/HistoryView";
import Settings from "./pages/Settings";
import Admin from "./pages/Admin";
import AdminAnalytics from "./pages/AdminAnalytics";
import AdminComparables from "./pages/admin/AdminComparables";
import AdminCommissions from "./pages/admin/AdminCommissions";
import AdminSalaires from "./pages/admin/AdminSalaires";
import AdminProspection from "./pages/admin/AdminProspection";
import Campagnes from "./pages/prospection/Campagnes";
import CampagneDetail from "./pages/prospection/CampagneDetail";
import PlanningProspection from "./pages/prospection/PlanningProspection";
import ProspectionDashboard from "./pages/prospection/ProspectionDashboard";
import ProspectionMap from "./pages/prospection/ProspectionMap";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Component wrapper pour le beforeunload warning
function AppWithWarning() {
  // Active l'avertissement si données non sync avant fermeture
  useBeforeUnloadWarning(true);
  
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Dashboard */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Index />
            </ProtectedRoute>
          }
        />
        <Route
          path="/estimations"
          element={
            <ProtectedRoute>
              <EstimationsList />
            </ProtectedRoute>
          }
        />
        
        {/* Inbox Leads */}
        <Route
          path="/leads"
          element={
            <ProtectedRoute>
              <LeadsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/leads/new"
          element={
            <ProtectedRoute>
              <LeadNewPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/leads/:id"
          element={
            <ProtectedRoute>
              <LeadDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/estimation-express"
          element={
            <ProtectedRoute>
              <EstimationExpress />
            </ProtectedRoute>
          }
        />
        
        {/* Comparables Projects */}
        <Route
          path="/comparables"
          element={
            <ProtectedRoute>
              <ComparablesProjects />
            </ProtectedRoute>
          }
        />
        <Route
          path="/comparables/nouveau"
          element={
            <ProtectedRoute>
              <NewProject />
            </ProtectedRoute>
          }
        />
        <Route
          path="/comparables/explore"
          element={
            <ProtectedRoute>
              <ComparablesExplore />
            </ProtectedRoute>
          }
        />
        <Route
          path="/comparables/:projectId"
          element={
            <ProtectedRoute>
              <ProjectDetail />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <RoleBasedRoute allowedRoles={['admin']}>
              <Admin />
            </RoleBasedRoute>
          }
        />
        <Route
          path="/admin/analytics"
          element={
            <RoleBasedRoute allowedRoles={['admin']}>
              <AdminAnalytics />
            </RoleBasedRoute>
          }
        />
        <Route
          path="/admin/comparables"
          element={
            <RoleBasedRoute allowedRoles={['admin']}>
              <AdminComparables />
            </RoleBasedRoute>
          }
        />
        <Route
          path="/admin/commissions"
          element={
            <RoleBasedRoute allowedRoles={['admin']}>
              <AdminCommissions />
            </RoleBasedRoute>
          }
        />
        <Route
          path="/salaires"
          element={
            <RoleBasedRoute allowedRoles={['admin']}>
              <AdminSalaires />
            </RoleBasedRoute>
          }
        />
        <Route
          path="/admin/prospection"
          element={
            <RoleBasedRoute allowedRoles={['admin']}>
              <AdminProspection />
            </RoleBasedRoute>
          }
        />
        
        {/* Prospection - accessible aux admins et courtiers */}
        <Route
          path="/campagnes"
          element={
            <RoleBasedRoute allowedRoles={['admin', 'courtier']}>
              <Campagnes />
            </RoleBasedRoute>
          }
        />
        <Route
          path="/campagnes/:id"
          element={
            <RoleBasedRoute allowedRoles={['admin', 'courtier']}>
              <CampagneDetail />
            </RoleBasedRoute>
          }
        />
        <Route
          path="/prospection/planning"
          element={
            <RoleBasedRoute allowedRoles={['admin', 'courtier']}>
              <PlanningProspection />
            </RoleBasedRoute>
          }
        />
        <Route
          path="/prospection/dashboard"
          element={
            <RoleBasedRoute allowedRoles={['admin', 'courtier']}>
              <ProspectionDashboard />
            </RoleBasedRoute>
          }
        />
        <Route
          path="/prospection/carte"
          element={
            <RoleBasedRoute allowedRoles={['admin', 'courtier']}>
              <ProspectionMap />
            </RoleBasedRoute>
          }
        />
        
        
        {/* Estimation Overview */}
        <Route
          path="/estimation/:id/overview"
          element={
            <ProtectedRoute>
              <EstimationOverview />
            </ProtectedRoute>
          }
        />
        {/* Redirection /estimation/:id vers overview */}
        <Route
          path="/estimation/:id"
          element={<Navigate to="overview" replace />}
        />
        
        {/* Estimation Modules */}
        <Route
          path="/estimation/:id/1"
          element={
            <ProtectedRoute>
              <Module1Identification />
            </ProtectedRoute>
          }
        />
        <Route
          path="/estimation/:id/2"
          element={
            <ProtectedRoute>
              <Module2Caracteristiques />
            </ProtectedRoute>
          }
        />
        <Route
          path="/estimation/:id/3"
          element={
            <ProtectedRoute>
              <Module3AnalyseTerrain />
            </ProtectedRoute>
          }
        />
        <Route
          path="/estimation/:id/photos"
          element={
            <ProtectedRoute>
              <ModulePhotos />
            </ProtectedRoute>
          }
        />
        <Route
          path="/estimation/:id/4"
          element={
            <ProtectedRoute>
              <Module4PreEstimation />
            </ProtectedRoute>
          }
        />
        <Route
          path="/estimation/:id/5"
          element={
            <ProtectedRoute>
              <Module5Strategie />
            </ProtectedRoute>
          }
        />
        <Route
          path="/estimation/:id/history"
          element={
            <ProtectedRoute>
              <HistoryView />
            </ProtectedRoute>
          }
        />
        <Route
          path="/estimation/:id/presentation"
          element={
            <ProtectedRoute>
              <PresentationPage />
            </ProtectedRoute>
          }
        />
        {/* Route publique pour partage client */}
        <Route
          path="/presentation/:id"
          element={<PresentationPage />}
        />
        
        {/* Fallback module routes */}
        <Route
          path="/estimation/:id/:module"
          element={
            <ProtectedRoute>
              <Module1Identification />
            </ProtectedRoute>
          }
        />
        
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AppWithWarning />
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
