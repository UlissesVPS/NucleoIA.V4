import { Shield, User } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/AuthContext";

const AdminToggle = () => {
  const { viewMode, toggleAdminDemo } = useAuth();

  const isAdminMode = viewMode === "admin";

  return (
    <div className="flex items-center gap-3">
      <div
        className={`p-1.5 rounded-lg transition-all duration-300 ${
          isAdminMode
            ? "bg-primary/20 text-primary"
            : "bg-white/[0.06] text-white/50"
        }`}
        style={isAdminMode ? { filter: "drop-shadow(0 0 6px hsl(24 100% 55% / 0.3))" } : undefined}
      >
        {isAdminMode ? <Shield className="h-4 w-4" /> : <User className="h-4 w-4" />}
      </div>
      <div className="flex flex-col">
        <span className="text-xs font-medium text-white/80">
          {isAdminMode ? "Modo Admin" : "Visão Membro"}
        </span>
        <span className="text-[10px] text-white/40">
          {isAdminMode ? "Acesso total" : "Simulando membro"}
        </span>
      </div>
      <Switch
        checked={isAdminMode}
        onCheckedChange={toggleAdminDemo}
        className="ml-auto"
      />
    </div>
  );
};

export default AdminToggle;
