import {
  LayoutDashboard,
  Bot,
  GraduationCap,
  FileText,
  Crown,
  Shield,
  KeyRound,
  Settings,
  Sparkles,
  PenLine,
  Server,
} from "lucide-react";
import type { NavItem } from "@/types";

export const mainNavItems: NavItem[] = [
  { icon: Sparkles, label: "Comece Aqui", labelKey: "nav.getStarted", href: "/comece-aqui", highlight: true },
  { icon: LayoutDashboard, label: "Dashboard", labelKey: "nav.dashboard", href: "/" },
  { icon: Bot, label: "Lista de IA's", labelKey: "nav.aiList", href: "/ias" },
  { icon: GraduationCap, label: "Aulas", labelKey: "nav.lessons", href: "/aulas" },
  { icon: FileText, label: "Prompts", labelKey: "nav.prompts", href: "/prompts" },
  { icon: PenLine, label: "Meus Prompts", labelKey: "nav.myPrompts", href: "/meus-prompts" },
  { icon: Crown, label: "Produtos VIPs", labelKey: "nav.vipProducts", href: "/produtos" },
  { icon: KeyRound, label: "Acesso Dicloak", labelKey: "nav.dicloakAccess", href: "/dicloak" },
  { icon: Shield, label: "Autenticador 2FA", labelKey: "nav.authenticator", href: "/autenticador" },
];

export const adminNavItems: NavItem[] = [
  { icon: Settings, label: "Painel Super Admin", labelKey: "nav.superAdminPanel", href: "/admin" },
];

// Item exclusivo para Super Admin (castroweverton001@gmail.com)
export const superAdminNavItems: NavItem[] = [
  { icon: Server, label: "Sistema", labelKey: "nav.system", href: "/admin/sistema", badge: "SA" },
];
