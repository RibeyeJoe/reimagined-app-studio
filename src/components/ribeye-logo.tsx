import { cn } from "@/lib/utils";
import ribeyeCowLogo from "@/assets/ribeye-cow-logo.png";

export function RibeyeLogo({ collapsed = false, className }: { collapsed?: boolean; className?: string }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <img src={ribeyeCowLogo} alt="Ribeye" className="w-8 h-8 object-contain" />
      {!collapsed && (
        <div className="flex items-center gap-2">
          <span className="font-display font-bold text-base tracking-tight text-sidebar-foreground">
            ribeye
          </span>
          <span className="text-[11px] text-muted-foreground font-medium px-1.5 py-0.5 bg-muted rounded">
            Omni Planner
          </span>
        </div>
      )}
    </div>
  );
}
