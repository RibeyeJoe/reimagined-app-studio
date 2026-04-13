import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { usePlanner } from "@/lib/planner-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, Users, Eye, Radio, TrendingUp, Activity, Search } from "lucide-react";

function fmt(n: number | null | undefined, dec = 0): string {
  if (n == null) return "—";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toFixed(dec);
}
function pct(n: number | null | undefined): string {
  if (n == null) return "—";
  return (n * 100).toFixed(1) + "%";
}

export default function ReportsPage() {
  const { state } = usePlanner();
  const [selectedAdvertiser, setSelectedAdvertiser] = useState(state.performanceAdvertiserCode ?? "__all__");
  const [selectedChannel, setSelectedChannel] = useState("__all__");
  const [selectedGoal, setSelectedGoal] = useState("__all__");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Filter options
  const [advertisers, setAdvertisers] = useState<{ code: string; name: string }[]>([]);
  const [channels, setChannels] = useState<string[]>([]);
  const [goals, setGoals] = useState<string[]>([]);

  // Data
  const [summary, setSummary] = useState<any>(null);
  const [channelData, setChannelData] = useState<any[]>([]);
  const [advertiserData, setAdvertiserData] = useState<any[]>([]);
  const [dmaData, setDmaData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tabLoading, setTabLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("channel");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (state.performanceAdvertiserCode && selectedAdvertiser === "__all__") {
      setSelectedAdvertiser(state.performanceAdvertiserCode);
    }
  }, [state.performanceAdvertiserCode, selectedAdvertiser]);

  // Load filter options once
  useEffect(() => {
    const loadFilters = async () => {
      const [advRes, chRes, goalRes] = await Promise.all([
        supabase.rpc("report_advertisers_list"),
        supabase.rpc("report_channels_list"),
        supabase.rpc("report_goals_list"),
      ]);

      if (advRes.error) throw advRes.error;
      if (chRes.error) throw chRes.error;
      if (goalRes.error) throw goalRes.error;

      setAdvertisers((advRes.data || []).map((r: any) => ({ code: r.code, name: r.name })));
      setChannels((chRes.data || []).map((r: any) => r.channel));
      setGoals((goalRes.data || []).map((r: any) => r.goal));
    };

    loadFilters().catch((error) => {
      console.error("Report filter load failed", error);
      setErrorMessage(error.message || "Failed to load report filters.");
    });
  }, []);

  const filterParams = {
    p_advertiser: selectedAdvertiser === "__all__" ? null : selectedAdvertiser,
    p_channel: selectedChannel === "__all__" ? null : selectedChannel,
    p_goal: selectedGoal === "__all__" ? null : selectedGoal,
    p_date_from: dateFrom || null,
    p_date_to: dateTo || null,
  };

  // Load summary + active tab data when filters change
  const loadTabData = async (tab: string, params = filterParams) => {
    setTabLoading(true);
    try {
      if (tab === "channel") {
        const { data, error } = await supabase.rpc("report_by_channel", params);
        if (error) throw error;
        setChannelData(data || []);
      } else if (tab === "advertiser") {
        const { data, error } = await supabase.rpc("report_by_advertiser", params);
        if (error) throw error;
        setAdvertiserData(data || []);
      } else if (tab === "dma") {
        const { data, error } = await supabase.rpc("report_by_dma", params);
        if (error) throw error;
        setDmaData(data || []);
      }
    } finally {
      setTabLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const loadReports = async () => {
      setLoading(true);
      setErrorMessage("");

      try {
        const [summaryRes] = await Promise.all([
          supabase.rpc("report_summary", filterParams),
          loadTabData(activeTab, filterParams),
        ]);

        if (summaryRes.error) throw summaryRes.error;

        if (!cancelled) {
          setSummary(summaryRes.data?.[0] || null);
        }
      } catch (error: any) {
        if (!cancelled) {
          console.error("Report data load failed", error);
          setSummary(null);
          setChannelData([]);
          setAdvertiserData([]);
          setDmaData([]);
          setErrorMessage(error.message || "Failed to load reports.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadReports();

    return () => {
      cancelled = true;
    };
  }, [selectedAdvertiser, selectedChannel, selectedGoal, dateFrom, dateTo, activeTab]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  const totalImpressions = Number(summary?.total_impressions || 0);

  if (loading && !summary) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center space-y-3">
          <Activity className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading reports…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto bg-background">
      <div className="max-w-[1400px] mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Reports</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Aggregated campaign performance across all advertisers
          </p>
        </div>

        {errorMessage && (
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-destructive">{errorMessage}</p>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Advertiser</label>
                <Select value={selectedAdvertiser} onValueChange={setSelectedAdvertiser}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">All Advertisers</SelectItem>
                    {advertisers.map(a => (
                      <SelectItem key={a.code} value={a.code}>{a.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Channel</label>
                <Select value={selectedChannel} onValueChange={setSelectedChannel}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">All Channels</SelectItem>
                    {channels.map(ch => (
                      <SelectItem key={ch} value={ch}>{ch}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Objective</label>
                <Select value={selectedGoal} onValueChange={setSelectedGoal}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">All Objectives</SelectItem>
                    {goals.map(g => (
                      <SelectItem key={g} value={g}>{g}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">From</label>
                <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="h-9 text-xs" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">To</label>
                <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="h-9 text-xs" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <SummaryCard icon={Eye} label="Impressions" value={fmt(Number(summary.total_impressions))} />
            <SummaryCard icon={Users} label="Reach" value={fmt(Number(summary.total_reach))} />
            <SummaryCard icon={Radio} label="Avg Frequency" value={Number(summary.avg_frequency).toFixed(2)} />
            <SummaryCard icon={TrendingUp} label="Avg VCR" value={Number(summary.avg_vcr).toFixed(1) + "%"} />
            <SummaryCard icon={BarChart3} label="Channels" value={String(summary.unique_channels)} />
            <SummaryCard icon={Activity} label="DMAs" value={String(summary.unique_dmas)} />
          </div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
          <TabsList>
            <TabsTrigger value="channel">By Channel</TabsTrigger>
            <TabsTrigger value="advertiser">By Advertiser</TabsTrigger>
            <TabsTrigger value="dma">By DMA</TabsTrigger>
          </TabsList>

          <TabsContent value="channel">
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base">Channel Breakdown</CardTitle></CardHeader>
              <CardContent className="p-0">
                {tabLoading ? <LoadingRows /> : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Channel</TableHead>
                        <TableHead className="text-right">Impressions</TableHead>
                        <TableHead className="text-right">Reach</TableHead>
                        <TableHead className="text-right">Records</TableHead>
                        <TableHead className="text-right">Share</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {channelData.map((row: any) => (
                        <TableRow key={row.channel}>
                          <TableCell className="font-medium">{row.channel}</TableCell>
                          <TableCell className="text-right">{fmt(Number(row.impressions))}</TableCell>
                          <TableCell className="text-right">{fmt(Number(row.reach))}</TableCell>
                          <TableCell className="text-right">{Number(row.row_count).toLocaleString()}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                                <div className="h-full bg-primary rounded-full" style={{ width: `${totalImpressions ? (Number(row.impressions) / totalImpressions) * 100 : 0}%` }} />
                              </div>
                              <span className="text-xs text-muted-foreground w-10 text-right">
                                {totalImpressions ? ((Number(row.impressions) / totalImpressions) * 100).toFixed(1) : 0}%
                              </span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {channelData.length === 0 && <EmptyRow cols={5} />}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="advertiser">
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base">Advertiser Breakdown</CardTitle></CardHeader>
              <CardContent className="p-0">
                {tabLoading ? <LoadingRows /> : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Advertiser</TableHead>
                        <TableHead className="text-right">Impressions</TableHead>
                        <TableHead className="text-right">Reach</TableHead>
                        <TableHead className="text-right">Channels</TableHead>
                        <TableHead className="text-right">DMAs</TableHead>
                        <TableHead className="text-right">Records</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {advertiserData.map((row: any) => (
                        <TableRow key={row.advertiser_code}>
                          <TableCell className="font-medium">{row.advertiser_name}</TableCell>
                          <TableCell className="text-right">{fmt(Number(row.impressions))}</TableCell>
                          <TableCell className="text-right">{fmt(Number(row.reach))}</TableCell>
                          <TableCell className="text-right">{row.channel_count}</TableCell>
                          <TableCell className="text-right">{row.dma_count}</TableCell>
                          <TableCell className="text-right">{Number(row.row_count).toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                      {advertiserData.length === 0 && <EmptyRow cols={6} />}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="dma">
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base">Top DMAs</CardTitle></CardHeader>
              <CardContent className="p-0">
                {tabLoading ? <LoadingRows /> : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>DMA</TableHead>
                        <TableHead className="text-right">Impressions</TableHead>
                        <TableHead className="text-right">Reach</TableHead>
                        <TableHead className="text-right">Records</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dmaData.map((row: any) => (
                        <TableRow key={row.dma}>
                          <TableCell className="font-medium">{row.dma}</TableCell>
                          <TableCell className="text-right">{fmt(Number(row.impressions))}</TableCell>
                          <TableCell className="text-right">{fmt(Number(row.reach))}</TableCell>
                          <TableCell className="text-right">{Number(row.row_count).toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                      {dmaData.length === 0 && <EmptyRow cols={4} />}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Icon className="w-4 h-4 text-primary" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-lg font-bold text-foreground">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function LoadingRows() {
  return (
    <div className="p-8 text-center">
      <Activity className="w-5 h-5 animate-spin mx-auto text-primary mb-2" />
      <p className="text-xs text-muted-foreground">Loading…</p>
    </div>
  );
}

function EmptyRow({ cols }: { cols: number }) {
  return (
    <TableRow>
      <TableCell colSpan={cols} className="text-center text-muted-foreground py-8">No data</TableCell>
    </TableRow>
  );
}
