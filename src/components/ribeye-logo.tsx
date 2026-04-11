import { cn } from "@/lib/utils";

export function RibeyeLogo({ collapsed = false, className }: { collapsed?: boolean; className?: string }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div className="w-8 h-8 flex items-center justify-center">
        <svg width="32" height="32" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Horns */}
          <path d="M30 32 C28 22, 24 16, 20 12 C18 10, 19 8, 21 9 C26 12, 30 18, 32 26" fill="#3C2415"/>
          <path d="M70 32 C72 22, 76 16, 80 12 C82 10, 81 8, 79 9 C74 12, 70 18, 68 26" fill="#3C2415"/>
          {/* Ears */}
          <ellipse cx="16" cy="42" rx="12" ry="8" fill="#3C2415" transform="rotate(-20 16 42)"/>
          <ellipse cx="84" cy="42" rx="12" ry="8" fill="#3C2415" transform="rotate(20 84 42)"/>
          {/* Head */}
          <ellipse cx="50" cy="54" rx="32" ry="36" fill="#3C2415"/>
          {/* Eyes - simple dark dots */}
          <circle cx="36" cy="46" r="3" fill="#1a0e08"/>
          <circle cx="64" cy="46" r="3" fill="#1a0e08"/>
          {/* Muzzle - large cream/beige area */}
          <ellipse cx="50" cy="70" rx="20" ry="16" fill="#F5E6D3"/>
          {/* Nostrils */}
          <ellipse cx="42" cy="68" rx="4" ry="3.5" fill="#3C2415"/>
          <ellipse cx="58" cy="68" rx="4" ry="3.5" fill="#3C2415"/>
        </svg>
      </div>
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
