import { SidebarTrigger } from "@/components/ui/sidebar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ClipboardList, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function OrdersPage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center justify-between gap-2 px-4 py-3 border-b border-border flex-shrink-0 bg-card/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <SidebarTrigger />
          <h1 className="text-sm font-display font-bold text-foreground">Insertion Orders</h1>
          <Badge variant="secondary" className="text-xs font-semibold">0</Badge>
        </div>
        <Button size="sm" variant="outline" onClick={() => navigate("/")} className="text-xs font-semibold">
          <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Back to Planner
        </Button>
      </header>
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-5xl mx-auto">
          <Card className="p-12 text-center card-elevated">
            <ClipboardList className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-base font-display font-bold text-foreground mb-1">No Insertion Orders Yet</h3>
            <p className="text-sm text-muted-foreground mb-4">Create your first insertion order from a plan in the Review step.</p>
            <Button size="sm" onClick={() => navigate("/")} className="font-semibold">Go to Planner</Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
