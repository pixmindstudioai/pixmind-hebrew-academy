import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppShell } from "./components/shell/AppShell";
import Index from "./pages/Index";
import Courses from "./pages/Courses";
import CourseDetail from "./pages/CourseDetail";
import LessonView from "./pages/LessonView";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import Tasks from "./pages/Tasks";
import TaskView from "./pages/TaskView";
import Notebook from "./pages/Notebook";
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
import MCPToolsPage from "./pages/admin/MCPToolsPage";
import BundlesPage from "./pages/admin/BundlesPage";

import DiscussionsPage from "./pages/admin/DiscussionsPage";
import AnnouncementsPage from "./pages/admin/AnnouncementsPage";
import CalendarPage from "./pages/admin/CalendarPage";
import TasksAdminPage from "./pages/admin/TasksPage";
import TaskReviewPage from "./pages/admin/TaskReviewPage";
import Community from "./pages/Community";
import Announcements from "./pages/Announcements";
import Calendar from "./pages/Calendar";
import MaterialsRemoved from "./pages/MaterialsRemoved";
import Feed from "./pages/Feed";
import Messages from "./pages/Messages";
import Leaderboard from "./pages/Leaderboard";
import BadgesPage from "./pages/admin/BadgesPage";
import FeedModerationPage from "./pages/admin/FeedModerationPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <div className="min-h-screen bg-background">
          <Routes>
            {/* Authentication Routes (no shell) */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/materials" element={<MaterialsRemoved />} />
            <Route path="/admin/materials" element={<MaterialsRemoved />} />

            {/* Admin Routes (own shell) */}
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
                <Route path="bundles" element={<AdminShell />}>
                  <Route index element={<BundlesPage />} />
                </Route>
                <Route path="discussions" element={<AdminShell />}>
                  <Route index element={<DiscussionsPage />} />
                </Route>
                <Route path="feed-moderation" element={<AdminShell />}>
                  <Route index element={<FeedModerationPage />} />
                </Route>
                <Route path="badges" element={<AdminShell />}>
                  <Route index element={<BadgesPage />} />
                </Route>
                <Route path="announcements" element={<AdminShell />}>
                  <Route index element={<AnnouncementsPage />} />
                </Route>
                <Route path="calendar" element={<AdminShell />}>
                  <Route index element={<CalendarPage />} />
                </Route>
                <Route path="tasks" element={<AdminShell />}>
                  <Route index element={<TasksAdminPage />} />
                </Route>
                <Route path="task-review" element={<AdminShell />}>
                  <Route index element={<TaskReviewPage />} />
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
                <Route path="mcp-tools" element={<AdminShell />}>
                  <Route index element={<MCPToolsPage />} />
                </Route>
              </Routes>
            } />

            {/* Member / public app — wrapped by the Claws-style AppShell.
                Visitors keep the public top nav; members get sidebar + top bar + bottom tabs. */}
            <Route element={<AppShell />}>
              <Route path="/" element={<Index />} />
              <Route path="/courses" element={<Courses />} />
              <Route path="/courses/:moduleId" element={<CourseDetail />} />
              <Route path="/lesson/:lessonId" element={<LessonView />} />
              <Route path="/tasks" element={<Tasks />} />
              <Route path="/tasks/:taskId" element={<TaskView />} />
              <Route path="/notebook" element={<Notebook />} />
              <Route path="/community" element={<Community />} />
              <Route path="/feed" element={<Feed />} />
              <Route path="/messages" element={<Messages />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/announcements" element={<Announcements />} />
              <Route path="/calendar" element={<Calendar />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/profile/:userId" element={<Profile />} />
            </Route>

            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
