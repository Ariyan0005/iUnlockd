import { type ReactNode } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth";
import { ThemeProvider } from "@/lib/theme";
import Layout from "@/components/Layout";
import { Loader2 } from "lucide-react";

import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import VerifyEmail from "@/pages/VerifyEmail";
import Dashboard from "@/pages/Dashboard";
import IMEIServices from "@/pages/IMEIServices";
import ServerServices from "@/pages/ServerServices";
import ServiceDetail from "@/pages/ServiceDetail";
import AddFund from "@/pages/AddFund";
import Deposit from "@/pages/Deposit";
import MyDeposits from "@/pages/MyDeposits";
import Orders from "@/pages/Orders";
import Account from "@/pages/Account";
import Admin from "@/pages/Admin";
import AdminSetup from "@/pages/AdminSetup";
import ManualPayment from "@/pages/ManualPayment";
import ForgotPassword from "@/pages/ForgotPassword";
import ToolRent from "@/pages/ToolRent";
import Statement from "@/pages/Statement";
import Invoices from "@/pages/Invoices";
import Contact from "@/pages/Contact";
import Terms from "@/pages/Terms";
import Privacy from "@/pages/Privacy";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );
}

function ProtectedRoute({ children, adminOnly = false }: { children: ReactNode; adminOnly?: boolean }) {
  const { user, isLoading } = useAuth();
  const hasToken = !!localStorage.getItem("iu_token");

  // If no token at all — redirect immediately, no spinner needed
  if (!hasToken && !user) return <Navigate to="/login" replace />;

  // Token exists but auth is still verifying — show content optimistically
  // (API calls will fail with 401 if token is bad, handled per-page)
  if (isLoading) return <>{children}</>;

  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== "admin") return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const base = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

  return (
    <BrowserRouter basename={base}>
      <Routes>
        {/* Auth pages */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Admin */}
        <Route path="/admin/setup" element={<AdminSetup />} />
        <Route path="/admin" element={<ProtectedRoute adminOnly><Admin /></ProtectedRoute>} />

        {/* Redirect wrong paths */}
        <Route path="/iunlockd" element={<Navigate to="/" replace />} />
        <Route path="/iunlockd/*" element={<Navigate to="/" replace />} />

        {/* Main layout pages */}
        <Route
          path="/*"
          element={
            <Layout>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/imei-services" element={<IMEIServices />} />
                <Route path="/server-services" element={<ServerServices />} />
                <Route path="/tool-rent" element={<ToolRent />} />
                <Route path="/services/:id" element={<ServiceDetail />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/add-fund" element={<ProtectedRoute><AddFund /></ProtectedRoute>} />
                <Route path="/deposit" element={<ProtectedRoute><Deposit /></ProtectedRoute>} />
                <Route path="/my-deposits" element={<ProtectedRoute><MyDeposits /></ProtectedRoute>} />
                <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
                <Route path="/account" element={<ProtectedRoute><Account /></ProtectedRoute>} />
                <Route path="/manual-payment" element={<ProtectedRoute><ManualPayment /></ProtectedRoute>} />
                <Route path="/statement" element={<ProtectedRoute><Statement /></ProtectedRoute>} />
                <Route path="/invoices" element={<ProtectedRoute><Invoices /></ProtectedRoute>} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Layout>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <AppRoutes />
            <Toaster />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
