import { Search, Command } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  placeholder?: string;
  className?: string;
  showShortcut?: boolean;
}

const SearchBar = ({ 
  placeholder = "Buscar ferramentas, cursos, prompts...", 
  className,
  showShortcut = true 
}: SearchBarProps) => {
  return (
    <div className={cn("relative w-full max-w-xl", className)}>
      <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        type="text"
        placeholder={placeholder}
        className="h-10 w-full rounded-xl border border-border bg-card pl-11 pr-16 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
      />
      {showShortcut && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded-md">
          <Command className="h-3 w-3" />
          <span>K</span>
        </div>
      )}
    </div>
  );
};

export default SearchBar;
