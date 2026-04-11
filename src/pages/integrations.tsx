import { useState } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Plug,
  Wifi,
  WifiOff,
  AlertCircle,
  CheckCircle2,
  Upload,
  KeyRound,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

type IntegrationStatus = "not_configured" | "connected" | "error";

interface Integration {
  name: string;
  category: string;
  status: IntegrationStatus;
  authType: "oauth" | "api_key" | "file_upload";
  lastSynced?: string;
}

const INITIAL_INTEGRATIONS: Integration[] = [
  // Original 6
  { name: "Google Ads", category: "Search & Display", status: "not_configured", authType: "oauth" },
  { name: "Meta Ads", category: "Social", status: "not_configured", authType: "oauth" },
  { name: "The Trade Desk", category: "DSP", status: "not_configured", authType: "api_key" },
  { name: "Google Analytics", category: "Data & Analytics", status: "not_configured", authType: "oauth" },
  { name: "Amazon DSP", category: "DSP", status: "not_configured", authType: "api_key" },
  { name: "Spotify Ad Studio", category: "Audio", status: "not_configured", authType: "api_key" },
  // CRM
  { name: "Salesforce", category: "CRM", status: "not_configured", authType: "oauth" },
  { name: "HubSpot", category: "CRM", status: "not_configured", authType: "oauth" },
  // OMS / Order Management
  { name: "FatTail", category: "OMS", status: "not_configured", authType: "api_key" },
  { name: "Operative", category: "OMS", status: "not_configured", authType: "api_key" },
  { name: "Boostr", category: "OMS", status: "not_configured", authType: "api_key" },
  // DSP (additional)
  { name: "DV360", category: "DSP", status: "not_configured", authType: "oauth" },
  { name: "Xandr", category: "DSP", status: "not_configured", authType: "api_key" },
  { name: "Yahoo DSP", category: "DSP", status: "not_configured", authType: "api_key" },
  // Ad Server
  { name: "Google Campaign Manager 360", category: "Ad Server", status: "not_configured", authType: "oauth" },
  { name: "Flashtalking", category: "Ad Server", status: "not_configured", authType: "api_key" },
  // SSP / Supply
  { name: "Google Ad Manager", category: "SSP / Supply", status: "not_configured", authType: "oauth" },
  { name: "Magnite", category: "SSP / Supply", status: "not_configured", authType: "api_key" },
  { name: "Index Exchange", category: "SSP / Supply", status: "not_configured", authType: "api_key" },
  { name: "OpenX", category: "SSP / Supply", status: "not_configured", authType: "api_key" },
  // Analytics (additional)
  { name: "Adobe Analytics", category: "Data & Analytics", status: "not_configured", authType: "api_key" },
  { name: "GA4", category: "Data & Analytics", status: "not_configured", authType: "oauth" },
  // Data Import
  { name: "CSV / Excel Upload", category: "Data Import", status: "not_configured", authType: "file_upload" },
];

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>(INITIAL_INTEGRATIONS);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [apiKeyValue, setApiKeyValue] = useState("");
  const [connecting, setConnecting] = useState(false);

  const connected = integrations.filter((i) => i.status === "connected").length;
  const errors = integrations.filter((i) => i.status === "error").length;
  const notConfigured = integrations.filter((i) => i.status === "not_configured").length;

  const selected = selectedIdx !== null ? integrations[selectedIdx] : null;

  const handleConnect = () => {
    if (selectedIdx === null) return;
    setConnecting(true);
    // Simulate connection
    setTimeout(() => {
      setIntegrations((prev) =>
        prev.map((item, i) =>
          i === selectedIdx
            ? { ...item, status: "connected" as const, lastSynced: new Date().toLocaleString() }
            : item
        )
      );
      setConnecting(false);
      setSelectedIdx(null);
      setApiKeyValue("");
      toast.success(`${integrations[selectedIdx].name} connected successfully`);
    }, 1500);
  };

  const statusBadge = (item: Integration) => {
    if (item.status === "connected") {
      return (
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span className="text-xs text-emerald-600 font-medium">Connected</span>
          </div>
          {item.lastSynced && (
            <span className="text-[10px] text-muted-foreground">Synced {item.lastSynced}</span>
          )}
        </div>
      );
    }
    if (item.status === "error") {
      return (
        <div className="flex items-center gap-1.5">
          <WifiOff className="w-4 h-4 text-destructive" />
          <span className="text-xs text-destructive font-medium">Error</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1.5">
        <AlertCircle className="w-4 h-4 text-muted-foreground" />
        <span className="text-xs text-muted-foreground font-medium">Not Configured</span>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center justify-between gap-2 px-4 py-3 border-b border-border flex-shrink-0 bg-card/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <SidebarTrigger />
          <h1 className="text-sm font-display font-bold text-foreground">Integrations</h1>
        </div>
      </header>
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-5xl mx-auto space-y-6">
          <div>
            <h2 className="text-2xl font-display font-bold text-foreground">Integrations</h2>
            <p className="text-sm text-muted-foreground mt-1">Connect to your ad tech platforms.</p>
          </div>

          {/* Summary tiles */}
          <div className="grid grid-cols-3 gap-3">
            <Card className="p-4 flex items-center gap-3 card-elevated">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                <Wifi className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-display font-bold text-emerald-600">{connected}</p>
                <p className="text-xs text-muted-foreground">Connected</p>
              </div>
            </Card>
            <Card className="p-4 flex items-center gap-3 card-elevated">
              <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                <WifiOff className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-display font-bold text-destructive">{errors}</p>
                <p className="text-xs text-muted-foreground">Errors</p>
              </div>
            </Card>
            <Card className="p-4 flex items-center gap-3 card-elevated">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-display font-bold text-muted-foreground">{notConfigured}</p>
                <p className="text-xs text-muted-foreground">Not Configured</p>
              </div>
            </Card>
          </div>

          {/* Integration rows */}
          <div className="space-y-3">
            {integrations.map((item, idx) => (
              <Card
                key={item.name}
                className="p-4 card-elevated cursor-pointer hover:ring-1 hover:ring-primary/30 transition-all"
                onClick={() => {
                  setSelectedIdx(idx);
                  setApiKeyValue("");
                }}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center">
                      {item.authType === "file_upload" ? (
                        <Upload className="w-5 h-5 text-muted-foreground" />
                      ) : (
                        <Plug className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-display font-bold">{item.name}</p>
                      <Badge variant="outline" className="text-[10px] mt-0.5">
                        {item.category}
                      </Badge>
                    </div>
                  </div>
                  {statusBadge(item)}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Connect dialog */}
      <Dialog open={selectedIdx !== null} onOpenChange={(open) => !open && setSelectedIdx(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">
              {selected?.status === "connected" ? "Manage" : "Connect"} {selected?.name}
            </DialogTitle>
            <DialogDescription>
              {selected?.status === "connected"
                ? `Last synced: ${selected.lastSynced}. You can disconnect or re-authenticate below.`
                : selected?.authType === "oauth"
                  ? "Sign in with your account to authorize access."
                  : selected?.authType === "file_upload"
                    ? "Upload a CSV or Excel file to import data from any platform."
                    : "Enter your API key to connect this platform."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {selected?.status === "connected" ? (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span className="text-sm font-medium text-emerald-700">Connected &amp; syncing</span>
              </div>
            ) : selected?.authType === "oauth" ? (
              <Button className="w-full gap-2" onClick={handleConnect} disabled={connecting}>
                <ExternalLink className="w-4 h-4" />
                {connecting ? "Authorizing…" : `Sign in with ${selected.name}`}
              </Button>
            ) : selected?.authType === "file_upload" ? (
              <div className="space-y-3">
                <Label htmlFor="file-upload">Select file</Label>
                <Input id="file-upload" type="file" accept=".csv,.xlsx,.xls" />
                <Button className="w-full gap-2" onClick={handleConnect} disabled={connecting}>
                  <Upload className="w-4 h-4" />
                  {connecting ? "Uploading…" : "Upload & Connect"}
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <Label htmlFor="api-key">API Key</Label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="api-key"
                    type="password"
                    placeholder="Paste your API key"
                    className="pl-9"
                    value={apiKeyValue}
                    onChange={(e) => setApiKeyValue(e.target.value)}
                  />
                </div>
                <Button
                  className="w-full"
                  onClick={handleConnect}
                  disabled={connecting || !apiKeyValue.trim()}
                >
                  {connecting ? "Connecting…" : "Connect"}
                </Button>
              </div>
            )}
          </div>

          {selected?.status === "connected" && (
            <DialogFooter>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  if (selectedIdx === null) return;
                  setIntegrations((prev) =>
                    prev.map((item, i) =>
                      i === selectedIdx
                        ? { ...item, status: "not_configured" as const, lastSynced: undefined }
                        : item
                    )
                  );
                  setSelectedIdx(null);
                  toast.info(`${selected.name} disconnected`);
                }}
              >
                Disconnect
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
