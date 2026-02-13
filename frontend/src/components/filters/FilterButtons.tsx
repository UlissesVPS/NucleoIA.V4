import type { FilterOption } from "@/constants/filters";
import { cn } from "@/lib/utils";
import Badge from "@/components/Badge";

interface FilterButtonsProps {
  filters: FilterOption[];
  activeFilter: string;
  onFilterChange: (filterId: string) => void;
  counts?: Record<string, number>;
  className?: string;
}

const FilterButtons = ({ filters, activeFilter, onFilterChange, counts, className }: FilterButtonsProps) => {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {filters.map((filter) => {
        const Icon = filter.icon;
        const count = counts?.[filter.id];
        
        return (
          <button
            key={filter.id}
            onClick={() => onFilterChange(filter.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all",
              activeFilter === filter.id
                ? "bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-glow"
                : "bg-card text-muted-foreground hover:bg-muted hover:text-foreground border border-border"
            )}
          >
            {Icon && <Icon className="h-4 w-4" />}
            <span>{filter.label}</span>
            {count !== undefined && (
              <Badge variant="count" className="ml-1">
                {count}
              </Badge>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default FilterButtons;
