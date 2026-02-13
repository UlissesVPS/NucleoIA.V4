import { Bell, Settings, User, LogOut } from "lucide-react";
import SearchBar from "@/components/SearchBar";
import { Link } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";
import MobileNav from "./MobileNav";
import Logo from "@/components/Logo";
import { useAuth } from "@/contexts/AuthContext";

const Header = () => {
  const { logout } = useAuth();

  return (
    <header className="sticky top-0 z-30 flex h-14 md:h-16 items-center justify-between border-b border-border bg-background/80 backdrop-blur-md px-3 sm:px-4 md:px-6">
      {/* Left: Mobile Nav + Logo (mobile) */}
      <div className="flex items-center gap-2 lg:hidden">
        <MobileNav />
        <Logo size="sm" className="sm:flex" />
      </div>

      {/* Center: Search (hidden on mobile, visible on tablet+) */}
      <div className="hidden sm:flex flex-1 justify-center max-w-xl lg:max-w-2xl xl:max-w-3xl mx-auto px-4">
        <SearchBar className="w-full" />
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1 sm:gap-2">
        <ThemeToggle />
        <button className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
          <Bell className="h-5 w-5" />
        </button>
        <Link
          to="/configuracoes"
          className="hidden xs:flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <Settings className="h-5 w-5" />
        </Link>
        <Link
          to="/perfil"
          className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-foreground"
        >
          <User className="h-5 w-5" />
        </Link>
        <button
          onClick={logout}
          className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl text-muted-foreground hover:bg-red-500/10 hover:text-red-400 transition-colors"
          title="Sair"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
};

export default Header;
