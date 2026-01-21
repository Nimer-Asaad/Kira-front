import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";
import AuthContext from "./context/AuthContext";
import { AssistantProvider } from "./context/AssistantContext";
import { ThemeProvider } from "./context/ThemeContext";
import { ModeProvider } from "./context/ModeContext";
import { ChatPanelProvider, useChatPanel } from "./context/ChatPanelContext";
import "./i18n"; // Initialize i18n

// Layouts
import HrLayout from "./components/HrLayout";
import PersonalLayout from "./components/PersonalLayout";
import UserLayout from "./components/UserLayout";
import ChatRightPanel from "./components/ChatRightPanel";
import AssistantDrawer from "./components/assistant/AssistantDrawer";

// Landing Page
import ChooseMode from "./pages/Landing/ChooseMode";

// Auth Pages
import Login from "./pages/Auth/login";
import SignUp from "./pages/Auth/SignUp";

// Admin Pages
import Dashboard from "./pages/Admin/Dashboard";
import ManagerTasks from "./pages/Admin/ManagerTasks";
import CreateTask from "./pages/Admin/CreateTask";
import ManageUsers from "./pages/Admin/ManageUsers";
import Reports from "./pages/Admin/Reports";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";

// HR Pages
import HrDashboard from "./pages/HR/HrDashboard";
import Applicants from "./pages/HR/Applicants";
import Inbox from "./pages/HR/Inbox";
import Trainees from "./pages/HR/Trainees";

// User Pages
import UserDashboard from "./pages/User/UserDashboard";
import MyTasks from "./pages/User/MyTasks";

// Personal Pages
import PersonalDashboard from "./pages/Personal/PersonalDashboard";
import PersonalInbox from "./pages/Personal/PersonalInbox";
import PersonalTasks from "./pages/Personal/PersonalTasks";
import PersonalPlanner from "./pages/Personal/PersonalPlanner";
import PersonalCalendar from "./pages/Personal/PersonalCalendar";
import PersonalReports from "./pages/Personal/PersonalReports";
import PersonalSettings from "./pages/Personal/PersonalSettings";
import PersonalAssistant from "./pages/Personal/PersonalAssistant";

// Trainee Pages
import TraineeTasks from "./pages/Trainee/TraineeTasks";
import TraineeDashboard from "./pages/Trainee/Dashboard";
import TraineeChat from "./pages/Trainee/TraineeChat";

// Admin Chat
import AdminChat from "./pages/Admin/AdminChat";

// Chat Page
import ChatPage from "./pages/Chat/ChatPage";

// Assistant Page
import AssistantPage from "./pages/AssistantPage";

// Routes
import PrivateRoute from "./routes/PrivateRoute";

const AppContent = () => {
  const { user } = React.useContext(AuthContext);
  const { chatPanelOpen, closeChatPanel } = useChatPanel();
  const profileElement =
    user?.role === "personal" ? (
      <Navigate to="/personal/profile" replace />
    ) : user?.role === "user" ? (
      <Navigate to="/user/profile" replace />
    ) : (
      <Profile />
    );

  return (
    <Router>
      {user && <ChatRightPanel isOpen={chatPanelOpen} onClose={closeChatPanel} currentUser={user} />}
      <AssistantDrawer />
      <Routes>
        {/* Root - Redirect to choose-mode (Main Landing Page) */}
        <Route
          path="/"
          element={<Navigate to="/choose-mode" replace />}
        />

        {/* Landing Page - Main Page */}
        <Route path="/choose-mode" element={<ChooseMode />} />

        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />

        {/* Admin Routes */}
        <Route
          path="/admin/dashboard"
          element={
            <PrivateRoute role="admin">
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/tasks"
          element={
            <PrivateRoute role="admin">
              <ManagerTasks />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/create-task"
          element={
            <PrivateRoute role="admin">
              <CreateTask />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <PrivateRoute role="admin">
              <ManageUsers />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/reports"
          element={
            <PrivateRoute role="admin">
              <Reports />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/chat"
          element={
            <PrivateRoute role="admin">
              <AdminChat />
            </PrivateRoute>
          }
        />

        {/* HR Routes */}
        <Route
          path="/hr/dashboard"
          element={
            <PrivateRoute role={["hr", "admin"]}>
              <HrDashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/hr/applicants"
          element={
            <PrivateRoute role={["hr", "admin"]}>
              <Applicants />
            </PrivateRoute>
          }
        />
        <Route
          path="/hr/inbox"
          element={
            <PrivateRoute role={["hr", "admin"]}>
              <Inbox />
            </PrivateRoute>
          }
        />
        <Route
          path="/hr/trainees"
          element={
            <PrivateRoute role={["hr", "admin"]}>
              <Trainees />
            </PrivateRoute>
          }
        />
        <Route
          path="/hr/chat"
          element={
            <PrivateRoute role={["hr", "admin"]}>
              <HrLayout>
                <ChatPage />
              </HrLayout>
            </PrivateRoute>
          }
        />

        {/* User Routes */}
        <Route
          path="/user"
          element={
            <PrivateRoute role="user">
              <UserLayout />
            </PrivateRoute>
          }
        >
          <Route
            index
            element={<Navigate to="/user/dashboard" replace />}
          />
          <Route path="dashboard" element={<UserDashboard />} />
          <Route path="my-tasks" element={<MyTasks />} />
          <Route path="profile" element={<Profile variant="user" />} />
        </Route>

        {/* Personal Routes - Nested with PersonalLayout */}
        <Route
          path="/personal"
          element={
            <PrivateRoute role={["personal", "user"]}>
              <PersonalLayout />
            </PrivateRoute>
          }
        >
          <Route
            index
            element={<Navigate to="/personal/dashboard" replace />}
          />
          <Route path="dashboard" element={<PersonalDashboard />} />
          <Route path="tasks" element={<PersonalTasks />} />
          <Route path="planner" element={<PersonalPlanner />} />
          <Route path="calendar" element={<PersonalCalendar />} />
          <Route path="inbox" element={<PersonalInbox />} />
          <Route path="reports" element={<PersonalReports />} />
          <Route path="profile" element={<Profile variant="personal" />} />
          <Route path="settings" element={<PersonalSettings />} />
          <Route path="assistant" element={<PersonalAssistant />} />
        </Route>
        <Route
          path="/trainee/tasks"
          element={
            <PrivateRoute role={["trainee", "user"]}>
              <TraineeTasks />
            </PrivateRoute>
          }
        />
        <Route
          path="/trainee/dashboard"
          element={
            <PrivateRoute role={["trainee", "user"]}>
              <TraineeDashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/trainee/chat"
          element={
            <PrivateRoute role={["trainee", "user"]}>
              <TraineeChat />
            </PrivateRoute>
          }
        />

        {/* Kira Assistant Route (all roles) */}
        <Route
          path="/assistant"
          element={
            <PrivateRoute>
              <AssistantPage />
            </PrivateRoute>
          }
        />

        {/* Shared Profile */}
        <Route
          path="/profile"
          element={
            <PrivateRoute>
              {profileElement}
            </PrivateRoute>
          }
        />

        {/* Settings */}
        <Route
          path="/settings"
          element={
            <PrivateRoute>
              <Settings />
            </PrivateRoute>
          }
        />
      </Routes>
    </Router>
  );
};

const App = () => {
  return (
    <ThemeProvider>
      <ModeProvider>
        <AuthProvider>
          <AssistantProvider>
            <ChatPanelProvider>
              <AppContent />
              <Toaster position="top-right" />
            </ChatPanelProvider>
          </AssistantProvider>
        </AuthProvider>
      </ModeProvider>
    </ThemeProvider>
  );
};

export default App;
