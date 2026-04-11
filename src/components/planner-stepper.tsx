import { cn } from "@/lib/utils";
import { STEPS, type StepId } from "@/lib/schema";
import { usePlanner } from "@/lib/planner-context";
import { Check, Globe, Target, MapPin, Users, Layers, ClipboardCheck } from "lucide-react";

const STEP_META: Record<StepId, { label: string; icon: typeof Globe }> = {
  intake: { label: "Intake", icon: Globe },
  goals: { label: "Goals & KPIs", icon: Target },
  geo: { label: "Geo", icon: MapPin },
  audiences: { label: "Audiences", icon: Users },
  channels: { label: "Channel Mix", icon: Layers },
  review: { label: "Review", icon: ClipboardCheck },
};

export function PlannerStepper() {
  const { state, setStep } = usePlanner();
  const currentIdx = STEPS.indexOf(state.currentStep);

  return (
    <nav className="flex items-center gap-1 overflow-x-auto pb-0.5">
      {STEPS.map((step, idx) => {
        const meta = STEP_META[step];
        const Icon = meta.icon;
        const isActive = step === state.currentStep;
        const isCompleted = idx < currentIdx;
        const isClickable = idx <= currentIdx;

        return (
          <div key={step} className="flex items-center gap-1 flex-shrink-0">
            {idx > 0 && (
              <div className={cn(
                "w-5 h-[2px] rounded-full transition-colors duration-300",
                isCompleted ? "bg-primary" : "bg-border"
              )} />
            )}
            <button
              onClick={() => isClickable && setStep(step)}
              disabled={!isClickable}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 whitespace-nowrap",
                isActive && "bg-primary text-primary-foreground shadow-sm",
                isCompleted && !isActive && "text-primary cursor-pointer hover:bg-primary/10",
                !isActive && !isCompleted && "text-muted-foreground",
                isClickable && !isActive && "cursor-pointer",
              )}
            >
              {isCompleted && !isActive ? (
                <Check className="w-3.5 h-3.5" />
              ) : (
                <Icon className="w-3.5 h-3.5" />
              )}
              <span className="hidden md:inline">{meta.label}</span>
            </button>
          </div>
        );
      })}
    </nav>
  );
}
