import { useState } from "react";
import { usePlanner } from "@/lib/planner-context";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Globe, Sparkles, X, Building2, MapPin, DollarSign,
  ArrowRight, Loader2,
} from "lucide-react";
import type { CTAType, DetectedLocation } from "@/lib/schema";
import { cn } from "@/lib/utils";

export function IntakeStep() {
  const { state, updateIntake, setStep } = usePlanner();
  const { intake } = state;
  const [analyzing, setAnalyzing] = useState(false);

  const handleAnalyze = async () => {
    if (!intake.websiteUrl) return;
    setAnalyzing(true);
    // Simulate analysis
    await new Promise(r => setTimeout(r, 1500));
    updateIntake({
      detected: {
        vertical: "General",
        services: ["Digital Marketing", "Brand Strategy"],
        ctaType: "Form" as CTAType,
        businessName: intake.businessName || "Business",
        confidence: "Medium",
      },
      analyzed: true,
    });
    setAnalyzing(false);
  };

  const removeService = (service: string) => {
    if (!intake.detected) return;
    updateIntake({
      detected: { ...intake.detected, services: intake.detected.services.filter(s => s !== service) },
    });
  };

  const canContinue = intake.businessName && intake.monthlyBudget > 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-display font-bold text-foreground">Client Intake</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Start by entering your client's information. We'll analyze their website to auto-detect their business.
        </p>
      </div>

      <Card className="p-6 space-y-5 card-elevated">
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                Business Name
              </Label>
              <Input
                placeholder="Acme Corp"
                value={intake.businessName}
                onChange={e => updateIntake({ businessName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-muted-foreground" />
                Website URL
              </Label>
              <div className="flex gap-2">
                <Input
                  placeholder="https://example.com"
                  value={intake.websiteUrl}
                  onChange={e => updateIntake({ websiteUrl: e.target.value })}
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleAnalyze}
                  disabled={!intake.websiteUrl || analyzing}
                  className="flex-shrink-0"
                >
                  {analyzing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  <span className="ml-1.5 hidden sm:inline">Analyze</span>
                </Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                Locations
              </Label>
              <Input
                placeholder="Dallas, TX; Austin, TX"
                value={intake.locations}
                onChange={e => updateIntake({ locations: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-muted-foreground" />
                Monthly Budget
              </Label>
              <Input
                type="number"
                placeholder="5000"
                value={intake.monthlyBudget || ""}
                onChange={e => updateIntake({ monthlyBudget: Number(e.target.value) || 0 })}
              />
            </div>
          </div>
        </div>
      </Card>

      {intake.detected && (
        <Card className="p-5 space-y-3 card-elevated animate-fade-in border-primary/20 bg-coral-light/30">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-display font-semibold">AI Detection Results</h3>
            <Badge variant="secondary" className="text-[10px]">
              {intake.detected.confidence || "Medium"} confidence
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Vertical:</span>
            <Badge>{intake.detected.vertical}</Badge>
          </div>
          {intake.detected.services.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-1.5">Detected Services</p>
              <div className="flex gap-1.5 flex-wrap">
                {intake.detected.services.map(s => (
                  <Badge key={s} variant="secondary" className="flex items-center gap-1">
                    {s}
                    <button onClick={() => removeService(s)}><X className="w-3 h-3" /></button>
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}

      <div className="flex justify-end">
        <Button onClick={() => setStep("goals")} disabled={!canContinue} className="font-semibold">
          Continue to Goals
          <ArrowRight className="w-4 h-4 ml-1.5" />
        </Button>
      </div>
    </div>
  );
}
