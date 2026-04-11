import { cn } from "@/lib/utils";

export function RibeyeLogo({ collapsed = false, className }: { collapsed?: boolean; className?: string }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div className="w-8 h-8 flex items-center justify-center">
        <svg width="32" height="32" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Horns - small subtle bumps */}
          <path d="M34 26 C32 18, 28 14, 26 12 C25 10, 26 9, 28 10 C31 13, 34 18, 35 24" fill="#3C2415"/>
          <path d="M66 26 C68 18, 72 14, 74 12 C75 10, 74 9, 72 10 C69 13, 66 18, 65 24" fill="#3C2415"/>
          {/* Ears - pointed, angled outward */}
          <path d="M14 44 C8 36, 6 30, 8 28 C10 26, 14 28, 18 34 C22 38, 24 42, 22 44 Z" fill="#3C2415"/>
          <path d="M86 44 C92 36, 94 30, 92 28 C90 26, 86 28, 82 34 C78 38, 76 42, 78 44 Z" fill="#3C2415"/>
          {/* Head - wide, shield-like shape */}
          <path d="M22 40 C22 28, 32 20, 50 20 C68 20, 78 28, 78 40 L78 60 C78 78, 66 90, 50 90 C34 90, 22 78, 22 60 Z" fill="#3C2415"/>
          {/* Muzzle - large cream area covering lower face */}
          <path d="M28 58 C28 52, 36 48, 50 48 C64 48, 72 52, 72 58 L72 72 C72 82, 62 88, 50 88 C38 88, 28 82, 28 72 Z" fill="#F5E6D3"/>
          {/* Nostrils */}
          <ellipse cx="42" cy="68" rx="5" ry="4" fill="#3C2415"/>
          <ellipse cx="58" cy="68" rx="5" ry="4" fill="#3C2415"/>
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
