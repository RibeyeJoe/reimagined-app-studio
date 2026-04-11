import { cn } from "@/lib/utils";

export function RibeyeLogo({ collapsed = false, className }: { collapsed?: boolean; className?: string }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      {/* Ribeye cow logo matching ribeye.media branding */}
      <div className="w-8 h-8 flex items-center justify-center">
        <svg width="32" height="32" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Horns */}
          <path d="M22 42 C18 30, 12 22, 6 16 C4 14, 5 12, 7 12 C12 13, 20 20, 24 30" fill="hsl(16 85% 55%)" strokeWidth="0"/>
          <path d="M78 42 C82 30, 88 22, 94 16 C96 14, 95 12, 93 12 C88 13, 80 20, 76 30" fill="hsl(16 85% 55%)" strokeWidth="0"/>
          {/* Ears */}
          <ellipse cx="18" cy="44" rx="10" ry="7" fill="hsl(16 85% 55%)" transform="rotate(-15 18 44)"/>
          <ellipse cx="82" cy="44" rx="10" ry="7" fill="hsl(16 85% 55%)" transform="rotate(15 82 44)"/>
          {/* Head */}
          <ellipse cx="50" cy="56" rx="32" ry="34" fill="hsl(16 85% 55%)"/>
          {/* Eyes */}
          <circle cx="36" cy="48" r="4" fill="white"/>
          <circle cx="64" cy="48" r="4" fill="white"/>
          <circle cx="36" cy="48" r="2" fill="hsl(0 0% 15%)"/>
          <circle cx="64" cy="48" r="2" fill="hsl(0 0% 15%)"/>
          {/* Muzzle */}
          <ellipse cx="50" cy="68" rx="18" ry="13" fill="hsl(16 85% 45%)"/>
          {/* Nostrils */}
          <circle cx="43" cy="67" r="3" fill="hsl(16 85% 35%)"/>
          <circle cx="57" cy="67" r="3" fill="hsl(16 85% 35%)"/>
          {/* Mouth */}
          <path d="M45 76 Q48 79 50 79 Q52 79 55 76" stroke="hsl(16 85% 35%)" strokeWidth="2" strokeLinecap="round" fill="none"/>
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
