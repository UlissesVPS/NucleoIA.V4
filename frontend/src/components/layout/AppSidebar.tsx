import { Link, useLocation } from "react-router-dom";
import { ChevronLeft, ChevronRight, LogOut } from "lucide-react";
import { mainNavItems, adminNavItems, superAdminNavItems } from "@/data/navigation";
import Logo from "@/components/Logo";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { AdminToggle } from "@/components/admin";
import { useSidebar } from "@/contexts/SidebarContext";
import { useTranslation } from "@/lib/i18n";
import { usePlanAccess } from "@/hooks/usePlanAccess";

// Navigation groups for visual separation (filtered by plan access in component)
const baseNavGroups = [
  { items: [0, 1, 2] }, // Dashboard, Lista de IA's, Agentes
  { items: [3, 4, 5, 6] }, // Aulas, Prompts, Meus Prompts, Produtos VIPs
  { items: [7, 8] }, // Acesso Dicloak, Autenticador 2FA
];

const AppSidebar = () => {
  const { collapsed, toggle } = useSidebar();
  const { t } = useTranslation();
  const location = useLocation();
  const { isAdmin, user, viewMode, logout } = useAuth();
  const { canAccessAgents, canAccessPrompts } = usePlanAccess();

  // Filter nav items based on plan tier
  const navGroups = baseNavGroups.map(group => ({
    items: group.items.filter(idx => {
      if (idx === 2 && !canAccessAgents) return false; // Agentes
      if (idx === 4 && !canAccessPrompts) return false; // Prompts
      if (idx === 5 && !canAccessPrompts) return false; // Meus Prompts
      return true;
    }),
  })).filter(group => group.items.length > 0);
  const realIsSuperAdmin = user?.role === 'SUPER_ADMIN';

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
        item.highlight && "highlight",
        collapsed && "justify-center px-2"
      )}
    >
      <item.icon className="nav-icon" />
      {!collapsed && (
        <>
          <span className="flex-1">{t(item.labelKey) || item.label}</span>
          {item.badge && <span className="sidebar-badge">{item.badge}</span>}
        </>
      )}
    </Link>
  );

  const renderNavGroups = () => {
    const elements: React.ReactNode[] = [];

    navGroups.forEach((group, groupIndex) => {
      // Add items in this group
      group.items.forEach((itemIndex) => {
        if (mainNavItems[itemIndex]) {
          elements.push(
            <NavLink key={mainNavItems[itemIndex].href} item={mainNavItems[itemIndex]} />
          );
        }
      });

      // Add separator after each group (except the last)
      if (groupIndex < navGroups.length - 1) {
        elements.push(
          <div key={`separator-${groupIndex}`} className="sidebar-separator" />
        );
      }
    });

    return elements;
  };

  return (
    <aside
      className={cn(
        "sidebar-premium fixed left-0 top-0 z-40 h-screen flex-col border-r border-white/[0.04] transition-all duration-300",
        "hidden lg:flex", // Hide on mobile, show on desktop
        collapsed ? "lg:w-16" : "lg:w-64 xl:w-72 2xl:w-80"
      )}
    >
      {/* Header */}
      <div className="relative z-10 flex h-16 items-center justify-between border-b border-white/[0.04] px-4">
        {!collapsed && <Logo size="sm" />}
        {collapsed && <Logo size="sm" showText={false} />}
        <button
          onClick={toggle}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-white/50 hover:bg-white/[0.04] hover:text-white/80 transition-all duration-300"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Admin Toggle - only for real SUPER_ADMIN */}
      {!collapsed && realIsSuperAdmin && (
        <div className="relative z-10 p-3">
          <div className="sidebar-admin-toggle">
            <AdminToggle />
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="relative z-10 flex-1 space-y-1 overflow-y-auto p-3">
        {renderNavGroups()}

        {/* Separator & Admin Items - Only show if admin */}
        {isAdmin && (
          <>
            <div className="sidebar-separator" />
            {adminNavItems.map((item) => (
              <NavLink key={item.href} item={item} />
            ))}
          </>
        )}

        {/* Super Admin Only Items - always visible for real SUPER_ADMIN */}
        {realIsSuperAdmin && (
          <>
            {superAdminNavItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "sidebar-nav-item",
                  isActive(item.href) && "active",
                  collapsed && "justify-center px-2"
                )}
              >
                <item.icon className="nav-icon" />
                {!collapsed && (
                  <>
                    <span className="flex-1">{t(item.labelKey) || item.label}</span>
                    {item.badge && (
                      <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-accent/20 text-accent border border-accent/30">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </Link>
            ))}
          </>
        )}
      </nav>

      {/* User Footer */}
      <div className="sidebar-user-footer relative z-10 p-4">
        {!collapsed ? (
          <div className="space-y-2">
            <Link to="/perfil" className="flex items-center gap-3 rounded-xl p-2 hover:bg-white/[0.04] transition-all duration-300">
              <div className="sidebar-user-avatar h-10 w-10 rounded-full flex items-center justify-center text-white font-semibold">
                {user?.name?.charAt(0) || "U"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white/90 truncate">{user?.name || "Usuário"}</p>
                <p className="text-xs text-primary">{isAdmin ? t("common.superAdmin") : t("common.member")}</p>
              </div>
            </Link>
            <button
              onClick={logout}
              className="flex w-full items-center gap-3 rounded-xl p-2 text-white/50 hover:bg-red-500/10 hover:text-red-400 transition-all duration-300"
            >
              <LogOut className="h-5 w-5 ml-0.5" />
              <span className="text-sm font-medium">{t("common.logout")}</span>
            </button>
          </div>
        ) : (
          <button
            onClick={logout}
            className="flex w-full items-center justify-center rounded-xl p-2 text-white/50 hover:bg-red-500/10 hover:text-red-400 transition-all duration-300"
            title={t("common.logout")}
          >
            <LogOut className="h-5 w-5" />
          </button>
        )}
      </div>
    </aside>
  );
};

export default AppSidebar;
