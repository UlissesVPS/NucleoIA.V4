import { LucideIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { forwardRef } from "react";

interface InputWithIconProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon: LucideIcon;
  iconPosition?: "left" | "right";
  rightElement?: React.ReactNode;
}

const InputWithIcon = forwardRef<HTMLInputElement, InputWithIconProps>(
  ({ icon: Icon, iconPosition = "left", rightElement, className, ...props }, ref) => {
    return (
      <div className="relative">
        {iconPosition === "left" && (
          <Icon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        )}
        <Input
          ref={ref}
          className={cn(
            iconPosition === "left" && "pl-11",
            iconPosition === "right" && "pr-11",
            rightElement && "pr-11",
            className
          )}
          {...props}
        />
        {iconPosition === "right" && !rightElement && (
          <Icon className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        )}
        {rightElement && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {rightElement}
          </div>
        )}
      </div>
    );
  }
);

InputWithIcon.displayName = "InputWithIcon";

export default InputWithIcon;
