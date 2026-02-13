import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, LogOut } from "lucide-react";
import { mainNavItems, adminNavItems, superAdminNavItems } from "@/data/navigation";
import Logo from "@/components/Logo";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/lib/i18n";
import { AdminToggle } from "@/components/admin";

const navGroups = [
  { items: [0, 1] },
  { items: [2, 3, 4, 5] },
  { items: [6, 7, 8] },
];

interface MobileNavProps {
  className?: string;
}

const MobileNav = ({ className }: MobileNavProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { isAdmin, user, viewMode, logout } = useAuth();
  const realIsSuperAdmin = user?.role === "SUPER_ADMIN";
  const { t } = useTranslation();

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const isActive = (href: string) => {
    if (href === "/") return location.pathname === "/";
    return location.pathname.startsWith(href);
  };

  const NavLink = ({ item }: { item: typeof mainNavItems[0] }) => (
    <Link
      to={item.href}
      className={cn(
        "sidebar-nav-item",
        isActive(item.href) && "active",
        item.highlight && "highlight"
      )}
      onClick={() => setIsOpen(false)}
    >
      <item.icon className="nav-icon" />
      <span className="flex-1">{t(item.labelKey) || item.label}</span>
      {item.badge && <span className="sidebar-badge">{item.badge}</span>}
    </Link>
  );

  const renderNavGroups = () => {
    const elements: React.ReactNode[] = [];
    navGroups.forEach((group, groupIndex) => {
      group.items.forEach((itemIndex) => {
        if (mainNavItems[itemIndex]) {
          elements.push(
            <NavLink key={mainNavItems[itemIndex].href} item={mainNavItems[itemIndex]} />
          );
        }
      });
      if (groupIndex < navGroups.length - 1) {
        elements.push(
          <div key={"sep-" + groupIndex} className="sidebar-separator" />
        );
      }
    });
    return elements;
  };

  const handleLogout = () => {
    setIsOpen(false);
    logout();
  };

  return (
    <div className={cn("lg:hidden", className)}>
      <button
        onClick={() => setIsOpen(true)}
        className="flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        aria-label="Abrir menu"
      >
        <Menu className="h-6 w-6" />
      </button>

      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm transition-opacity duration-300",
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setIsOpen(false)}
      />

      {/* Drawer */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-[70] h-[100dvh] w-[80vw] max-w-[300px] flex flex-col border-r border-white/[0.06] transition-transform duration-300 ease-out overflow-hidden",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
        style={{ background: "#0e0e10" }}
      >
        {/* Header */}
        <div className="flex h-14 items-center justify-between border-b border-white/[0.06] px-4 shrink-0">
          <Logo size="sm" />
          <button
            onClick={() => setIsOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-white/50 hover:bg-white/[0.06] hover:text-white/80 transition-all"
            aria-label="Fechar menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Admin Toggle */}
        {realIsSuperAdmin && (
          <div className="p-3 shrink-0">
            <div className="sidebar-admin-toggle">
              <AdminToggle />
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-3 overscroll-contain">
          {renderNavGroups()}

          {isAdmin && (
            <>
              <div className="sidebar-separator" />
              {adminNavItems.map((item) => (
                <NavLink key={item.href} item={item} />
              ))}
            </>
          )}

          {realIsSuperAdmin && (
            <>
              {superAdminNavItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    "sidebar-nav-item",
                    isActive(item.href) && "active"
                  )}
                  onClick={() => setIsOpen(false)}
                >
                  <item.icon className="nav-icon" />
                  <span className="flex-1">{t(item.labelKey) || item.label}</span>
                  {item.badge && (
                    <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-accent/20 text-accent border border-accent/30">
                      {item.badge}
                    </span>
                  )}
                </Link>
              ))}
            </>
          )}
        </nav>

        {/* User Footer */}
        <div className="border-t border-white/[0.06] p-3 shrink-0" style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom, 0px))" }}>
          <Link
            to="/perfil"
            className="flex items-center gap-3 rounded-xl p-2 hover:bg-white/[0.06] transition-all"
            onClick={() => setIsOpen(false)}
          >
            <div className="sidebar-user-avatar h-9 w-9 rounded-full flex items-center justify-center text-white text-sm font-semibold">
              {user?.name?.charAt(0) || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white/90 truncate">{user?.name || "Usuário"}</p>
              <p className="text-xs text-primary">{realIsSuperAdmin ? (viewMode === "admin" ? t("common.superAdmin") : t("common.simulatingMember")) : isAdmin ? t("common.admin") : "Membro"}</p>
            </div>
          </Link>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl p-2 mt-1 text-white/50 hover:bg-red-500/10 hover:text-red-400 transition-all"
          >
            <LogOut className="h-5 w-5 ml-0.5" />
            <span className="text-sm font-medium">{t("common.logout")}</span>
          </button>
        </div>
      </aside>
    </div>
  );
};

export default MobileNav;
