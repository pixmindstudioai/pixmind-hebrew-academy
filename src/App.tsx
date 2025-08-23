
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navigation from "./components/Navigation";
import Index from "./pages/Index";
import Courses from "./pages/Courses";
import LessonView from "./pages/LessonView";
import NotFound from "./pages/NotFound";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminShell from "./components/admin/AdminShell";
import ModerationPage from "./pages/admin/ModerationPage";
import ContentPage from "./pages/admin/ContentPage";
import SettingsPage from "./pages/admin/SettingsPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <div className="min-h-screen bg-background">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<><Navigation /><Index /></>} />
            <Route path="/courses" element={<><Navigation /><Courses /></>} />
            <Route path="/lesson/:lessonId" element={<><Navigation /><LessonView /></>} />
            
            {/* Admin Routes */}
            <Route path="/admin/*" element={
              <Routes>
                <Route index element={<AdminDashboard />} />
                <Route path="moderation" element={<AdminShell />}>
                  <Route index element={<ModerationPage />} />
                </Route>
                <Route path="content" element={<AdminShell />}>
                  <Route index element={<ContentPage />} />
                </Route>
                <Route path="settings" element={<AdminShell />}>
                  <Route index element={<SettingsPage />} />
                </Route>
              </Routes>
            } />
            
            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
