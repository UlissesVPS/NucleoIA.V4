import type { LucideIcon } from "lucide-react";

export interface NavItem {
  icon: LucideIcon;
  label: string;
  labelKey: string;
  href: string;
  badge?: string;
  highlight?: boolean;
}
