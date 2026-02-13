import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ProtectedRoute, AdminRoute, SuperAdminRoute } from "@/components/ProtectedRoute";

// Layouts
import MainLayout from "@/components/layout/MainLayout";

// Pages
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import Dashboard from "@/pages/Dashboard";
import AILibrary from "@/pages/AILibrary";
import Authenticator from "@/pages/Authenticator";
import Dicloak from "@/pages/Dicloak";
import Prompts from "@/pages/Prompts";
import MyPrompts from "@/pages/MyPrompts";
import Courses from "@/pages/Courses";
import CourseDetail from "@/pages/CourseDetail";
import Products from "@/pages/Products";
import AdminProducts from "@/pages/AdminProducts";
import Admin from "@/pages/Admin";
import Sistema from "@/pages/Sistema";
import GetStarted from "@/pages/GetStarted";
import Profile from "@/pages/Profile";
import Settings from "@/pages/Settings";
import Faq from "@/pages/Faq";
import Networking from "@/pages/Networking";
import NotFound from "@/pages/NotFound";
import FirstAccess from "@/pages/FirstAccess";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              {/* Public routes (no auth required) */}
              <Route path="/login" element={<Login />} />
              <Route path="/auth/magic" element={<Login />} />
              <Route path="/primeiro-acesso" element={<FirstAccess />} />
              <Route path="/solicitar-acesso" element={<Signup />} />

              {/* Protected routes (authenticated users) */}
              <Route element={<ProtectedRoute />}>
                <Route element={<MainLayout />}>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/comece-aqui" element={<GetStarted />} />
                  <Route path="/ias" element={<AILibrary />} />
                  <Route path="/autenticador" element={<Authenticator />} />
                  <Route path="/dicloak" element={<Dicloak />} />
                  <Route path="/prompts" element={<Prompts />} />
                  <Route path="/meus-prompts" element={<MyPrompts />} />
                  <Route path="/aulas" element={<Courses />} />
                  <Route path="/aulas/:cursoId" element={<CourseDetail />} />
                  <Route path="/produtos" element={<Products />} />
                  <Route path="/perfil" element={<Profile />} />
                  <Route path="/configuracoes" element={<Settings />} />
                  <Route path="/faq" element={<Faq />} />
                  <Route path="/networking" element={<Networking />} />
                </Route>
              </Route>

              {/* Admin routes */}
              <Route element={<AdminRoute />}>
                <Route element={<MainLayout />}>
                  <Route path="/admin" element={<Admin />} />
                  <Route path="/admin/produtos" element={<AdminProducts />} />
                </Route>
              </Route>

              {/* Super admin routes */}
              <Route element={<SuperAdminRoute />}>
                <Route element={<MainLayout />}>
                  <Route path="/admin/sistema" element={<Sistema />} />
                </Route>
              </Route>

              {/* Catch-all */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
