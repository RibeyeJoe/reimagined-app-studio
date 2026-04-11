import { cn } from "@/lib/utils";

export function RibeyeLogo({ collapsed = false, className }: { collapsed?: boolean; className?: string }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      {/* Cow icon matching ribeye.media branding */}
      <div className="w-8 h-8 flex items-center justify-center text-sidebar-primary">
        <svg width="28" height="28" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M25 40 C22 28, 16 22, 10 18 C8 16, 8 14, 10 13 C14 13, 22 18, 26 26" fill="currentColor" opacity="0.9"/>
          <path d="M75 40 C78 28, 84 22, 90 18 C92 16, 92 14, 90 13 C86 13, 78 18, 74 26" fill="currentColor" opacity="0.9"/>
          <ellipse cx="50" cy="56" rx="30" ry="32" fill="currentColor"/>
          <ellipse cx="20" cy="46" rx="9" ry="7" fill="currentColor" transform="rotate(-20 20 46)"/>
          <ellipse cx="80" cy="46" rx="9" ry="7" fill="currentColor" transform="rotate(20 80 46)"/>
          <circle cx="36" cy="46" r="4.5" fill="hsl(var(--sidebar-background))"/>
          <circle cx="64" cy="46" r="4.5" fill="hsl(var(--sidebar-background))"/>
          <ellipse cx="50" cy="68" rx="16" ry="12" fill="hsl(var(--sidebar-foreground))" opacity="0.3"/>
          <circle cx="44" cy="66" r="2.5" fill="hsl(var(--sidebar-background))"/>
          <circle cx="56" cy="66" r="2.5" fill="hsl(var(--sidebar-background))"/>
          <path d="M46 74 Q48 77 50 77 Q52 77 54 74" stroke="hsl(var(--sidebar-background))" strokeWidth="2" strokeLinecap="round" fill="none"/>
        </svg>
      </div>
      {!collapsed && (
        <div className="flex flex-col">
          <span className="font-display font-bold text-sm tracking-tight text-sidebar-foreground">
            ribeye
          </span>
          <span className="text-[10px] text-sidebar-foreground/50 font-medium -mt-0.5">
            Omni Planner
          </span>
        </div>
      )}
    </div>
  );
}
