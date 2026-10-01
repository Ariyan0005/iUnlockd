import { lazy, Suspense, type ReactNode } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth";
import { ThemeProvider } from "@/lib/theme";
import { Loader2 } from "lucide-react";

const Layout = lazy(() => import("@/components/Layout"));
const Home = lazy(() => import("@/pages/Home"));
const Login = lazy(() => import("@/pages/Login"));
const Register = lazy(() => import("@/pages/Register"));
const VerifyEmail = lazy(() => import("@/pages/VerifyEmail"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const IMEIServices = lazy(() => import("@/pages/IMEIServices"));
const IMEIChecker = lazy(() => import("@/pages/IMEIChecker"));
const ServerServices = lazy(() => import("@/pages/ServerServices"));
const ServiceDetail = lazy(() => import("@/pages/ServiceDetail"));
const AddFund = lazy(() => import("@/pages/AddFund"));
const Deposit = lazy(() => import("@/pages/Deposit"));
const MyDeposits = lazy(() => import("@/pages/MyDeposits"));
const Orders = lazy(() => import("@/pages/Orders"));
const Account = lazy(() => import("@/pages/Account"));
const Admin = lazy(() => import("@/pages/Admin"));
const AdminSetup = lazy(() => import("@/pages/AdminSetup"));
const ManualPayment = lazy(() => import("@/pages/ManualPayment"));
const ForgotPassword = lazy(() => import("@/pages/ForgotPassword"));
const ToolRent = lazy(() => import("@/pages/ToolRent"));
const ToolActivationCredits = lazy(() => import("@/pages/ToolActivationCredits"));
const Services = lazy(() => import("@/pages/Services"));
const Statement = lazy(() => import("@/pages/Statement"));
const Invoices = lazy(() => import("@/pages/Invoices"));
const Contact = lazy(() => import("@/pages/Contact"));
const Terms = lazy(() => import("@/pages/Terms"));
const Privacy = lazy(() => import("@/pages/Privacy"));
const NotFound = lazy(() => import("@/pages/not-found"));
const DeviceCheckPage = lazy(() => import("@/pages/DeviceCheckPage"));
const AdminCheckApis = lazy(() => import("@/pages/AdminCheckApis"));

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

  // Wait for the session to be verified before mounting protected pages.
  // This prevents pages such as Admin from starting their first data fetch
  // during the auth transition after navigation from the public site.
  if (isLoading) return <PageLoader />;

  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== "admin") return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const base = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

  return (
    <BrowserRouter basename={base}>
      <Suspense fallback={<PageLoader />}>
        <Routes>
        {/* Auth pages */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Admin */}
        <Route path="/admin/setup" element={<AdminSetup />} />
        <Route path="/admin/check-apis" element={<ProtectedRoute adminOnly><AdminCheckApis /></ProtectedRoute>} />
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
                <Route path="/imei-checker" element={<IMEIChecker />} />
                <Route path="/check" element={<IMEIChecker />} />
                {Object.keys({
                  "iphone-imei-check": true,
                  "apple-serial-check": true,
                  "icloud-check": true,
                  "apple-warranty-check": true,
                  "iphone-carrier-check": true,
                  "samsung-imei-check": true,
                  "xiaomi-mi-status-check": true,
                  "google-pixel-imei-check": true,
                  "imei-blacklist-check": true,
                  "fmi-check": true,
                }).map((slug) => <Route key={slug} path={`/${slug}`} element={<DeviceCheckPage fixedSlug={slug} />} />)}
                <Route path="/server-services" element={<ServerServices />} />
                <Route path="/tool-rent" element={<ToolRent />} />
                <Route path="/tool-activation-credits" element={<ToolActivationCredits />} />
                <Route path="/services" element={<Services />} />
                <Route path="/imei-services/:slug" element={<ServiceDetail />} />
                <Route path="/services/:slug" element={<ServiceDetail />} />
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
      </Suspense>
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
