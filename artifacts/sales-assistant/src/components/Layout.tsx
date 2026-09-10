import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import Logo from "@/components/Logo";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Menu,
  X,
  LayoutDashboard,
  Smartphone,
  Server,
  ShoppingBag,
  Wallet,
  User,
  LogOut,
  Shield,
  ChevronDown,
  ChevronRight,
  History,
  PlusCircle,
  Wrench,
  LogIn,
  House,
  Search,
  UserPlus,
  FileText,
  Receipt,
  Phone,
} from "lucide-react";

const SERVICE_NAV = [
  { label: "IMEI Service", href: "/imei-services", icon: Smartphone },
  { label: "Server Service", href: "/server-services", icon: Server },
  { label: "Remote / Rent Service", href: "/tool-rent", icon: Wrench },
];

const NAV_USER_DESKTOP = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "IMEI Services", href: "/imei-services", icon: Smartphone },
  { label: "Server Services", href: "/server-services", icon: Server },
  { label: "Orders", href: "/orders", icon: ShoppingBag },
];

const NO_FOOTER_PATHS = ["/add-fund", "/manual-payment"];
const NO_BOTTOM_NAV_PATHS = ["/login", "/register", "/verify-email", "/forgot-password", "/admin"];

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [ordersOpen, setOrdersOpen] = useState(location.pathname.startsWith("/orders"));
  const [accountOpen, setAccountOpen] = useState(false);

  const hideFooter = NO_FOOTER_PATHS.some(p => location.pathname.startsWith(p));
  const hideBottomNav = NO_BOTTOM_NAV_PATHS.some(p => location.pathname.startsWith(p));

  const isActive = (href: string) =>
    href === "/" ? location.pathname === "/" : location.pathname.startsWith(href);

  const handleLogout = () => {
    setMobileOpen(false);
    logout();
    navigate("/");
  };

  const close = () => setMobileOpen(false);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Top Nav */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <Logo size="md" />

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {user ? (
              NAV_USER_DESKTOP.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive(item.href)
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  }`}
                >
                  {item.label}
                </Link>
              ))
            ) : (
              <>
                <Link
                  to="/"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive("/") ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  }`}
                >
                  Home
                </Link>
                <div className="w-px h-4 bg-border mx-1" />
                {SERVICE_NAV.map((item) => (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive(item.href)
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent"
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </>
            )}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {authLoading ? (
              <div className="hidden md:flex w-20 h-8 rounded-lg bg-muted animate-pulse" />
            ) : user ? (
              <>
                <Button variant="default" size="sm" onClick={() => navigate("/add-fund")} className="hidden sm:flex">
                  <PlusCircle className="w-4 h-4 mr-1" />
                  Add Fund
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="hidden md:flex gap-1">
                      <span className="max-w-[120px] truncate">{user.name}</span>
                      <ChevronDown className="w-3 h-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52">
                    <div className="px-2 py-1.5 text-xs text-muted-foreground">
                      Balance: ${parseFloat(user.balance).toFixed(2)}
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger>
                        <User className="w-4 h-4 mr-2" /> My Account
                      </DropdownMenuSubTrigger>
                      <DropdownMenuSubContent>
                        <DropdownMenuItem onClick={() => navigate("/account")}>
                          <User className="w-4 h-4 mr-2" /> Profile &amp; Password
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate("/statement")}>
                          <FileText className="w-4 h-4 mr-2" /> Statement
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate("/invoices")}>
                          <Receipt className="w-4 h-4 mr-2" /> Invoices
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate("/contact")}>
                          <Phone className="w-4 h-4 mr-2" /> Contact
                        </DropdownMenuItem>
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                    <DropdownMenuItem onClick={() => navigate("/add-fund")}>
                      <PlusCircle className="w-4 h-4 mr-2" /> Add Fund
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/my-deposits")}>
                      <History className="w-4 h-4 mr-2" /> Fund History
                    </DropdownMenuItem>
                    {user.role === "admin" && (
                      <DropdownMenuItem onClick={() => navigate("/admin")}>
                        <Shield className="w-4 h-4 mr-2" /> Admin Panel
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                      <LogOut className="w-4 h-4 mr-2" /> Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : authLoading ? null : (
              <div className="hidden md:flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => navigate("/login")}>
                  <LogIn className="w-4 h-4 mr-1.5" />
                  Login
                </Button>
                <Button size="sm" onClick={() => navigate("/register")}>
                  <UserPlus className="w-4 h-4 mr-1.5" />
                  Register
                </Button>
              </div>
            )}

            {/* Mobile: Login button when logged out */}
          {!authLoading && !user && (
            <Link to="/login" onClick={close} className="md:hidden flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors active:scale-[0.97]">
              <LogIn className="w-4 h-4" />
              Login
            </Link>
          )}
          {/* Mobile: Deposit icon when logged in */}
          {!authLoading && user && (
            <button onClick={() => { close(); navigate("/add-fund"); }} className="sm:hidden flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
              <Wallet className="w-4 h-4" />
              Deposit
            </button>
          )}
          {/* Mobile hamburger */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <button className="flex items-center justify-center w-12 h-12 rounded-lg hover:bg-accent transition-colors">
                  {mobileOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72 pt-14 px-0 flex flex-col transition-none duration-75">
                <div className="flex flex-col gap-0 px-3 flex-1 overflow-y-auto">
                  {user ? (
                    <>
                      {/* User info strip */}
                      <div className="px-3 py-2.5 mb-2.5 bg-primary/5 rounded-xl border border-primary/10">
                        <p className="font-semibold text-sm">{user.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Balance: <span className="text-primary font-medium">${parseFloat(user.balance).toFixed(2)}</span>
                        </p>
                      </div>

                      <NavItem icon={LayoutDashboard} label="Dashboard" href="/dashboard" active={isActive("/dashboard")} onClick={close} />
                      <NavItem icon={Smartphone} label="IMEI Service" href="/imei-services" active={isActive("/imei-services")} onClick={close} />
                      <NavItem icon={Server} label="Server Service" href="/server-services" active={isActive("/server-services")} onClick={close} />
                      <NavItem icon={Wrench} label="Remote / Rent Service" href="/tool-rent" active={isActive("/tool-rent")} onClick={close} />

                      <div className="my-1.5 border-t border-border" />

                      <NavItem icon={PlusCircle} label="Add Fund" href="/add-fund" active={isActive("/add-fund")} onClick={close} highlight />
                      <NavItem icon={History} label="Deposit History" href="/my-deposits" active={isActive("/my-deposits")} onClick={close} />

                      <button
                        onClick={() => setOrdersOpen(o => !o)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors w-full text-left"
                      >
                        <ShoppingBag className="w-4 h-4 shrink-0" />
                        <span className="flex-1">My Order History</span>
                        <ChevronRight className={`w-3.5 h-3.5 transition-transform ${ordersOpen ? "rotate-90" : ""}`} />
                      </button>
                      {ordersOpen && (
                        <div className="ml-7 flex flex-col gap-0.5">
                          <SubNavItem label="IMEI Orders" href="/orders?type=imei" active={location.pathname === "/orders" && location.search.includes("imei")} onClick={close} />
                          <SubNavItem label="Server Orders" href="/orders?type=server" active={location.pathname === "/orders" && location.search.includes("server")} onClick={close} />
                          <SubNavItem label="Remote / Rent Orders" href="/orders?type=tool" active={location.pathname === "/orders" && location.search.includes("tool")} onClick={close} />
                        </div>
                      )}

                      <div className="my-1.5 border-t border-border" />

                      {/* My Account expandable */}
                      <button
                        onClick={() => setAccountOpen(o => !o)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors w-full text-left ${
                          isActive("/account") || isActive("/statement") || isActive("/invoices") || isActive("/contact")
                            ? "bg-primary/10 text-primary"
                            : "text-muted-foreground hover:text-foreground hover:bg-accent"
                        }`}
                      >
                        <User className="w-4 h-4 shrink-0" />
                        <span className="flex-1">My Account</span>
                        <ChevronRight className={`w-3.5 h-3.5 transition-transform ${accountOpen ? "rotate-90" : ""}`} />
                      </button>
                      {accountOpen && (
                        <div className="ml-7 flex flex-col gap-0.5">
                          <SubNavItem label="Profile &amp; Password" href="/account" active={isActive("/account")} onClick={close} />
                          <SubNavItem label="Statement" href="/statement" active={isActive("/statement")} onClick={close} />
                          <SubNavItem label="Invoices" href="/invoices" active={isActive("/invoices")} onClick={close} />
                          <SubNavItem label="Contact" href="/contact" active={isActive("/contact")} onClick={close} />
                        </div>
                      )}

                      {user.role === "admin" && (
                        <NavItem icon={Shield} label="Admin Panel" href="/admin" active={isActive("/admin")} onClick={close} />
                      )}

                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors w-full text-left mt-1"
                      >
                        <LogOut className="w-4 h-4 shrink-0" />
                        Logout
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="flex flex-col gap-2.5 mb-5">
                        <Link
                          to="/login"
                          onClick={close}
                          className="flex items-center justify-center gap-2.5 px-4 py-3.5 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-sm active:scale-[0.98]"
                        >
                          <LogIn className="w-5 h-5" />
                          Login to your account
                        </Link>
                        <Link
                          to="/register"
                          onClick={close}
                          className="flex items-center justify-center gap-2.5 px-4 py-3.5 rounded-xl text-sm font-semibold border-2 border-primary/25 text-primary bg-primary/5 hover:bg-primary/10 transition-all active:scale-[0.98]"
                        >
                          <UserPlus className="w-5 h-5" />
                          Create new account
                        </Link>
                      </div>

                      <div className="pt-1">
                        <p className="px-3 text-base font-bold tracking-wide text-foreground mb-3">
                          Our Services
                        </p>
                        {SERVICE_NAV.map((item) => (
                          <NavItem
                            key={item.href}
                            icon={item.icon}
                            label={item.label}
                            href={item.href}
                            active={isActive(item.href)}
                            onClick={close}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <main className={`flex-1 ${hideBottomNav ? "" : "pb-20 md:pb-0"}`}>{children}</main>

      {!hideFooter && <footer className="border-t border-border bg-card mt-auto">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-col items-center gap-4 text-center">
            <a
              href="https://t.me/iUnlockd_Official"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2.5 px-5 py-3 bg-[#229ED9] text-white rounded-2xl font-semibold text-sm hover:bg-[#1a8fc4] transition-colors"
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
              </svg>
              Join Telegram Channel
            </a>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} iUnlockd. All rights reserved.
            </p>
          </div>
        </div>
      </footer>}

      {!hideBottomNav && (
        <nav
          aria-label="Mobile navigation"
          className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-card border-t border-gray-200 dark:border-border shadow-[0_-2px_12px_rgba(0,0,0,0.08)]"
        >
          <div className="grid grid-cols-5 h-16">
            <BottomNavItem href="/" icon={House} label="Home" active={isActive("/")} />
            <BottomNavItem href="/imei-services" icon={Smartphone} label="IMEI" active={isActive("/imei-services")} />
            <BottomNavItem href="/server-services" icon={Server} label="Server" active={isActive("/server-services")} />
            <BottomNavItem href="/imei-checker" icon={Search} label="IMEI Check" active={isActive("/imei-checker")} />
            <BottomNavItem
              href={user ? "/account" : "/login"}
              icon={user ? User : LogIn}
              label={user ? "Account" : "Login"}
              active={isActive(user ? "/account" : "/login")}
            />
          </div>
        </nav>
      )}
    </div>
  );
}

function BottomNavItem({
  icon: Icon,
  label,
  href,
  active,
}: {
  icon: React.ElementType;
  label: string;
  href: string;
  active: boolean;
}) {
  return (
    <Link
      to={href}
      aria-current={active ? "page" : undefined}
      className={`flex flex-col items-center justify-center gap-1 text-xs font-medium transition-colors ${
        active ? "text-primary font-semibold" : "text-gray-400 hover:text-gray-600 dark:text-muted-foreground"
      }`}
    >
      <Icon className={`w-5 h-5 transition-transform ${active ? "scale-110" : ""}`} />
      <span>{label}</span>
    </Link>
  );
}

function NavItem({
  icon: Icon, label, href, active, onClick, highlight,
}: {
  icon: React.ElementType;
  label: string;
  href: string;
  active: boolean;
  onClick: () => void;
  highlight?: boolean;
}) {
  return (
    <Link
      to={href}
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
        highlight
          ? "text-primary hover:bg-primary/10"
          : active
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:text-foreground hover:bg-accent"
      }`}
    >
      <Icon className="w-4 h-4 shrink-0" />
      {label}
    </Link>
  );
}

function SubNavItem({ label, href, active, onClick }: { label: string; href: string; active: boolean; onClick: () => void }) {
  return (
    <Link
      to={href}
      onClick={onClick}
      className={`flex items-center px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
        active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-accent"
      }`}
    >
      {label}
    </Link>
  );
}
