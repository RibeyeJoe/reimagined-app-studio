import { useState } from "react";
import { usePlanner } from "@/lib/planner-context";
import { PlannerStepper } from "@/components/planner-stepper";
import { AICopilot } from "@/components/ai-copilot";
import { IntakeStep } from "@/components/steps/intake-step";
import { GoalsStep } from "@/components/steps/goals-step";
import { GeoStep } from "@/components/steps/geo-step";
import { AudiencesStep } from "@/components/steps/audiences-step";
import { ChannelsStep } from "@/components/steps/channels-step";
import { ReviewStep } from "@/components/steps/review-step";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { PanelRight, Save, FolderOpen, RotateCcw, Trash2, Clock } from "lucide-react";
import type { StepId } from "@/lib/schema";

const STEP_COMPONENTS: Record<StepId, () => JSX.Element> = {
  intake: IntakeStep,
  goals: GoalsStep,
  geo: GeoStep,
  audiences: AudiencesStep,
  channels: ChannelsStep,
  review: ReviewStep,
};

export default function PlannerPage() {
  const { state, resetPlanner, savedSessions, saveSession, loadSession, deleteSession } = usePlanner();
  const [copilotOpen, setCopilotOpen] = useState(true);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const StepComponent = STEP_COMPONENTS[state.currentStep];

  const handleSave = () => {
    const name = saveName.trim() || `${state.intake.businessName || "Untitled"} - ${new Date().toLocaleDateString()}`;
    saveSession(name);
    setSaveName("");
    setSaveDialogOpen(false);
  };

  const handleReset = () => { resetPlanner(); setResetConfirmOpen(false); };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString() + " " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center justify-between gap-2 px-4 py-3 border-b border-border flex-shrink-0 bg-card/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <SidebarTrigger />
          <h1 className="text-sm font-display font-bold text-foreground hidden sm:block">Omni Planner</h1>
        </div>
        <div className="flex items-center gap-2">
          <PlannerStepper />

          <div className="flex items-center gap-1 ml-2 border-l pl-2 border-border">
            <Button size="sm" variant="outline" onClick={() => setSaveDialogOpen(true)} className="h-7 text-xs font-semibold">
              <Save className="w-3.5 h-3.5 mr-1" />
              <span className="hidden sm:inline">Save</span>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="outline" className="h-7 text-xs font-semibold">
                  <FolderOpen className="w-3.5 h-3.5 mr-1" />
                  <span className="hidden sm:inline">Load</span>
                  {savedSessions.length > 0 && (
                    <span className="ml-1 bg-primary text-primary-foreground rounded-full w-4 h-4 flex items-center justify-center text-[10px]">
                      {savedSessions.length}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72">
                <DropdownMenuLabel className="text-xs">Saved Plans</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {savedSessions.length === 0 ? (
                  <div className="px-2 py-3 text-xs text-muted-foreground text-center">No saved plans yet</div>
                ) : (
                  savedSessions.map(session => (
                    <DropdownMenuItem key={session.id} className="flex items-center justify-between gap-2 cursor-pointer"
                      onSelect={e => e.preventDefault()}>
                      <button className="flex-1 text-left flex flex-col gap-0.5 min-w-0"
                        onClick={() => loadSession(session.id)}>
                        <span className="text-xs font-medium truncate">{session.name}</span>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" /> {formatDate(session.createdAt)}
                        </span>
                      </button>
                      <button onClick={e => { e.stopPropagation(); deleteSession(session.id); }}
                        className="text-muted-foreground hover:text-destructive p-1">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </DropdownMenuItem>
                  ))
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button size="sm" variant="outline" onClick={() => setResetConfirmOpen(true)} className="h-7 text-xs font-semibold">
              <RotateCcw className="w-3.5 h-3.5 mr-1" />
              <span className="hidden sm:inline">Reset</span>
            </Button>
          </div>

          {!copilotOpen && (
            <Button size="icon" variant="ghost" onClick={() => setCopilotOpen(true)} className="h-8 w-8">
              <PanelRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-3xl mx-auto">
            <StepComponent />
          </div>
        </main>
        <AICopilot open={copilotOpen} onToggle={() => setCopilotOpen(!copilotOpen)} />
      </div>

      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Save Plan</DialogTitle>
            <DialogDescription>Save your current progress to come back later.</DialogDescription>
          </DialogHeader>
          <Input placeholder={`${state.intake.businessName || "Untitled"} - ${new Date().toLocaleDateString()}`}
            value={saveName} onChange={e => setSaveName(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSave()} autoFocus />
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} className="font-semibold">Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={resetConfirmOpen} onOpenChange={setResetConfirmOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display">Start Over?</DialogTitle>
            <DialogDescription>This will clear all progress. Unsaved work will be lost.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetConfirmOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleReset}>Start Over</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
