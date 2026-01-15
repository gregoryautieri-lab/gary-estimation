import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import EstimationsList from "./pages/EstimationsList";
import EstimationOverview from "./pages/estimation/EstimationOverview";
import Module1Identification from "./pages/estimation/Module1Identification";
import Module2Caracteristiques from "./pages/estimation/Module2Caracteristiques";
import Module3AnalyseTerrain from "./pages/estimation/Module3AnalyseTerrain";
import ModulePhotos from "./pages/estimation/ModulePhotos";
import Module4PreEstimation from "./pages/estimation/Module4PreEstimation";
import Module5Strategie from "./pages/estimation/Module5Strategie";
import HistoryView from "./pages/estimation/HistoryView";
import Settings from "./pages/Settings";
import Admin from "./pages/Admin";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <TooltipProvider>
        <Toaster />
        <Sonner />
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
                <ProtectedRoute>
                  <Admin />
                </ProtectedRoute>
              }
            />
            
            {/* Estimation Overview (nouvelle route par défaut) */}
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
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
