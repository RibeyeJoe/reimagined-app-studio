import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider } from "@/components/ui/sidebar";
import { PlannerProvider } from "@/lib/planner-context";
import { AppSidebar } from "@/components/app-sidebar";
import PlannerPage from "@/pages/planner";
import OrdersPage from "@/pages/orders";
import MediaChannelsPage from "@/pages/media-channels";
import IntegrationsPage from "@/pages/integrations";
import TemplatesPage from "@/pages/templates";
import ReportsPage from "@/pages/reports";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const sidebarStyle = {
  "--sidebar-width": "14rem",
  "--sidebar-width-icon": "3rem",
} as React.CSSProperties;

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <PlannerProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <SidebarProvider style={sidebarStyle}>
            <div className="flex h-screen w-full">
              <AppSidebar />
              <div className="flex flex-col flex-1 overflow-hidden">
                <Routes>
                  <Route path="/" element={<PlannerPage />} />
                  <Route path="/planner" element={<PlannerPage />} />
                  <Route path="/orders" element={<OrdersPage />} />
                  <Route path="/media-channels" element={<MediaChannelsPage />} />
                  <Route path="/integrations" element={<IntegrationsPage />} />
                  <Route path="/templates" element={<TemplatesPage />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </div>
            </div>
          </SidebarProvider>
        </BrowserRouter>
      </PlannerProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
