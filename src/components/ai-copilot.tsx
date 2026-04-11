import { useState } from "react";
import { cn } from "@/lib/utils";
import { usePlanner } from "@/lib/planner-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sparkles, RefreshCw, PanelRightClose, ChevronRight, ChevronDown,
  Copy, Phone, Check, Globe, Target, MapPin, Users, Layers
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { ConfidenceLevel } from "@/lib/schema";

function ConfidenceBadge({ level }: { level: ConfidenceLevel }) {
  const colors: Record<ConfidenceLevel, string> = {
    High: "bg-emerald-100 text-emerald-700",
    Medium: "bg-amber-100 text-amber-700",
    Low: "bg-red-100 text-red-700",
  };
  return (
    <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider", colors[level])}>
      {level}
    </span>
  );
}

interface CopilotProps {
  open: boolean;
  onToggle: () => void;
}

export function AICopilot({ open, onToggle }: CopilotProps) {
  const { state, setRecommendations } = usePlanner();
  const [refreshing, setRefreshing] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedNotes, setCopiedNotes] = useState(false);
  const { toast } = useToast();

  const handleRegenerate = async () => {
    setRefreshing(true);
    await new Promise(r => setTimeout(r, 1000));
    setRecommendations({
      whatWeRecommend: [
        "Multi-channel approach combining search, social, and video",
        "Geo-targeted campaigns within the primary service area",
        "Retargeting strategy to capture warm leads",
      ],
      whyThisWorks: [
        "Captures high-intent search traffic while building brand awareness",
        "Multiple touchpoints increase conversion probability",
        "Budget allocation optimized for the selected goal",
      ],
      whatWeNeedFromClient: [
        "Creative assets (logo, brand guidelines, images)",
        "Access to Google Analytics and ad accounts",
        "Budget approval and campaign timeline confirmation",
      ],
      confidence: "High",
    });
    setRefreshing(false);
  };

  const copyClientEmail = () => {
    const businessName = state.intake.businessName || "your business";
    let text = `Hi,\n\nAfter reviewing ${businessName}'s online presence, here's what we recommend:\n\n`;
    const rec = state.recommendations;
    if (rec) {
      text += "WHAT WE RECOMMEND:\n";
      rec.whatWeRecommend.forEach(r => { text += `- ${r}\n`; });
    }
    text += `\nLet's schedule a call to finalize the plan.\n\nBest regards`;
    navigator.clipboard.writeText(text);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
    toast({ title: "Copied", description: "Client email copied to clipboard." });
  };

  const copyCallNotes = () => {
    const businessName = state.intake.businessName || "Client";
    let text = `CALL NOTES - ${businessName}\nGoal: ${state.goals.goal || "TBD"} | Budget: $${state.intake.monthlyBudget?.toLocaleString()}/mo\n`;
    navigator.clipboard.writeText(text);
    setCopiedNotes(true);
    setTimeout(() => setCopiedNotes(false), 2000);
    toast({ title: "Copied", description: "Call notes copied." });
  };

  if (!open) return null;

  const rec = state.recommendations;

  return (
    <div className="w-80 flex-shrink-0 border-l border-border bg-card flex flex-col">
      <div className="flex items-center justify-between gap-2 p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <h3 className="text-sm font-display font-bold text-foreground">AI Copilot</h3>
        </div>
        <div className="flex items-center gap-1">
          <Button size="icon" variant="ghost" onClick={handleRegenerate} className="h-8 w-8">
            <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin")} />
          </Button>
          <Button size="icon" variant="ghost" onClick={onToggle} className="h-8 w-8">
            <PanelRightClose className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex gap-1 p-3 border-b border-border">
        <Button size="sm" variant="outline" onClick={copyClientEmail} className="flex-1 text-xs h-8">
          {copiedEmail ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
          {copiedEmail ? "Copied" : "Client Email"}
        </Button>
        <Button size="sm" variant="outline" onClick={copyCallNotes} className="flex-1 text-xs h-8">
          {copiedNotes ? <Check className="w-3 h-3 mr-1" /> : <Phone className="w-3 h-3 mr-1" />}
          {copiedNotes ? "Copied" : "Call Notes"}
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {rec ? (
          <>
            <SectionCard title="What we recommend" items={rec.whatWeRecommend} confidence={rec.confidence} />
            <SectionCard title="Why this works" items={rec.whyThisWorks} confidence={rec.confidence} />
            <SectionCard title="What we need" items={rec.whatWeNeedFromClient} confidence={rec.confidence} isChecklist />
          </>
        ) : (
          <div className="p-4 rounded-lg bg-muted/50 text-center">
            <Sparkles className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">
              Complete intake and select a goal, then click regenerate for AI recommendations.
            </p>
          </div>
        )}

        <button
          onClick={() => setShowDetails(!showDetails)}
          className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground w-full py-2 hover:text-foreground rounded-lg px-2 transition-colors"
        >
          {showDetails ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          {showDetails ? "Hide details" : "Show plan details"}
        </button>

        {showDetails && (
          <div className="space-y-2 animate-fade-in">
            <DetailItem icon={Globe} title="Business" value={state.intake.businessName || "Not set"} />
            <DetailItem icon={Target} title="Goal" value={state.goals.goal || "Not set"} />
            <DetailItem icon={MapPin} title="Geo" value={state.geo.geoValue || "Not set"} />
            <DetailItem icon={Users} title="Audiences" value={`${state.audiences.audiences.length} segments`} />
            <DetailItem icon={Layers} title="Channels" value={`${state.channels.allocations.filter(a => a.enabled).length} active`} />
          </div>
        )}
      </div>
    </div>
  );
}

function DetailItem({ icon: Icon, title, value }: { icon: typeof Globe; title: string; value: string }) {
  return (
    <div className="p-3 rounded-lg bg-muted/50 flex items-center gap-2">
      <Icon className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
      <span className="text-xs font-medium text-muted-foreground">{title}:</span>
      <span className="text-xs font-semibold text-foreground truncate">{value}</span>
    </div>
  );
}

function SectionCard({ title, items, confidence, isChecklist }: {
  title: string; items: string[]; confidence: ConfidenceLevel; isChecklist?: boolean;
}) {
  return (
    <div className="p-3 rounded-lg bg-muted/50 space-y-2">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">{title}</h4>
        <ConfidenceBadge level={confidence} />
      </div>
      <ul className="space-y-1">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-1.5 text-xs text-foreground">
            {isChecklist ? (
              <div className="w-3 h-3 mt-0.5 rounded-sm border border-border flex-shrink-0" />
            ) : (
              <ChevronRight className="w-3 h-3 mt-0.5 text-primary flex-shrink-0" />
            )}
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
