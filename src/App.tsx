import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navigation from "./components/Navigation";
import Index from "./pages/Index";
import Courses from "./pages/Courses";
import CourseDetail from "./pages/CourseDetail";
import LessonView from "./pages/LessonView";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import AdminLoginPage from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminShell from "./components/admin/AdminShell";
import ContentPage from "./pages/admin/ContentPage";
import CohortsPage from "./pages/admin/CohortsPage";
import UserManagementPage from "./pages/admin/UserManagementPage";
import ModerationPage from "./pages/admin/ModerationPage";
import StudentsPage from "./pages/admin/StudentsPage";
import StudentProfilePage from "./pages/admin/StudentProfilePage";
import CRMInboxPage from "./pages/admin/CRMInboxPage";
import CRMAnalyticsPage from "./pages/admin/CRMAnalyticsPage";
import SettingsPage from "./pages/admin/SettingsPage";
import PaymentsPage from "./pages/admin/PaymentsPage";
import PurchasesPage from "./pages/admin/PurchasesPage";

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
            <Route path="/courses/:moduleId" element={<><Navigation /><CourseDetail /></>} />
            <Route path="/lesson/:lessonId" element={<><Navigation /><LessonView /></>} />
            
            {/* Authentication Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/profile" element={<Profile />} />
            
            {/* Admin Routes */}
            <Route path="/admin-login" element={<AdminLoginPage />} />
            <Route path="/admin/*" element={
              <Routes>
                <Route index element={<AdminDashboard />} />
                <Route path="moderation" element={<AdminShell />}>
                  <Route index element={<ModerationPage />} />
                </Route>
                <Route path="content" element={<AdminShell />}>
                  <Route index element={<ContentPage />} />
                </Route>
                <Route path="modules/:moduleId/cohorts" element={<AdminShell />}>
                  <Route index element={<CohortsPage />} />
                </Route>
                <Route path="students" element={<AdminShell />}>
                  <Route index element={<StudentsPage />} />
                  <Route path=":studentId" element={<StudentProfilePage />} />
                </Route>
                <Route path="crm" element={<AdminShell />}>
                  <Route index element={<CRMInboxPage />} />
                  <Route path="analytics" element={<CRMAnalyticsPage />} />
                </Route>
                <Route path="users" element={<AdminShell />}>
                  <Route index element={<UserManagementPage />} />
                </Route>
                <Route path="payments" element={<AdminShell />}>
                  <Route index element={<PaymentsPage />} />
                </Route>
                <Route path="purchases" element={<AdminShell />}>
                  <Route index element={<PurchasesPage />} />
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