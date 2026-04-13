import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, Users, Eye, Radio, DollarSign, TrendingUp, Activity, Search } from "lucide-react";

/* ── fetch all campaign_performance rows ── */
async function fetchAllPerformance() {
  const rows: any[] = [];
  let from = 0;
  const PAGE = 1000;
  while (true) {
    const { data, error } = await supabase
      .from("campaign_performance")
      .select("*")
      .range(from, from + PAGE - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    rows.push(...data);
    if (data.length < PAGE) break;
    from += PAGE;
  }
  return rows;
}

/* ── helpers ── */
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
  const { data: rawRows = [], isLoading } = useQuery({
    queryKey: ["reports-performance"],
    queryFn: fetchAllPerformance,
    staleTime: 60_000,
  });

  /* ── filters ── */
  const [selectedAdvertiser, setSelectedAdvertiser] = useState<string>("__all__");
  const [selectedChannel, setSelectedChannel] = useState<string>("__all__");
  const [selectedGoal, setSelectedGoal] = useState<string>("__all__");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  /* ── derived filter options ── */
  const advertisers = useMemo(() => {
    const map = new Map<string, string>();
    rawRows.forEach((r: any) => {
      if (r.advertiser_code && !map.has(r.advertiser_code))
        map.set(r.advertiser_code, r.advertiser_name || r.advertiser_code);
    });
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [rawRows]);

  const channels = useMemo(() => [...new Set(rawRows.map((r: any) => r.digital_channel).filter(Boolean))].sort(), [rawRows]);
  const goals = useMemo(() => [...new Set(rawRows.map((r: any) => r.goal).filter(Boolean))].sort(), [rawRows]);

  /* ── filtered data ── */
  const filtered = useMemo(() => {
    return rawRows.filter((r: any) => {
      if (selectedAdvertiser !== "__all__" && r.advertiser_code !== selectedAdvertiser) return false;
      if (selectedChannel !== "__all__" && r.digital_channel !== selectedChannel) return false;
      if (selectedGoal !== "__all__" && r.goal !== selectedGoal) return false;
      if (dateFrom && r.campaign_day < dateFrom) return false;
      if (dateTo && r.campaign_day > dateTo) return false;
      if (searchTerm) {
        const s = searchTerm.toLowerCase();
        const hay = [r.advertiser_name, r.line_item_name, r.creative_name, r.publisher, r.dma].filter(Boolean).join(" ").toLowerCase();
        if (!hay.includes(s)) return false;
      }
      return true;
    });
  }, [rawRows, selectedAdvertiser, selectedChannel, selectedGoal, dateFrom, dateTo, searchTerm]);

  /* ── aggregated metrics ── */
  const agg = useMemo(() => {
    let impressions = 0, reach = 0, frequency = 0, vcrSum = 0, vcrCount = 0, acrSum = 0, acrCount = 0;
    const advertiserSet = new Set<string>();
    const channelSet = new Set<string>();
    const dmaSet = new Set<string>();

    filtered.forEach((r: any) => {
      impressions += Number(r.impressions || 0);
      reach += Number(r.reach || 0);
      if (r.frequency) { frequency += Number(r.frequency); }
      if (r.vcr) { vcrSum += Number(r.vcr); vcrCount++; }
      if (r.acr) { acrSum += Number(r.acr); acrCount++; }
      if (r.advertiser_code) advertiserSet.add(r.advertiser_code);
      if (r.digital_channel) channelSet.add(r.digital_channel);
      if (r.dma) dmaSet.add(r.dma);
    });

    return {
      totalRows: filtered.length,
      impressions,
      reach,
      avgFrequency: filtered.length ? frequency / filtered.length : 0,
      avgVCR: vcrCount ? vcrSum / vcrCount : 0,
      avgACR: acrCount ? acrSum / acrCount : 0,
      advertisers: advertiserSet.size,
      channels: channelSet.size,
      dmas: dmaSet.size,
    };
  }, [filtered]);

  /* ── channel breakdown ── */
  const channelBreakdown = useMemo(() => {
    const map = new Map<string, { impressions: number; reach: number; rows: number }>();
    filtered.forEach((r: any) => {
      const ch = r.digital_channel || "Unknown";
      const cur = map.get(ch) || { impressions: 0, reach: 0, rows: 0 };
      cur.impressions += Number(r.impressions || 0);
      cur.reach += Number(r.reach || 0);
      cur.rows++;
      map.set(ch, cur);
    });
    return Array.from(map.entries())
      .map(([channel, m]) => ({ channel, ...m }))
      .sort((a, b) => b.impressions - a.impressions);
  }, [filtered]);

  /* ── advertiser breakdown ── */
  const advertiserBreakdown = useMemo(() => {
    const map = new Map<string, { name: string; impressions: number; reach: number; rows: number; channels: Set<string>; dmas: Set<string> }>();
    filtered.forEach((r: any) => {
      const code = r.advertiser_code;
      const cur = map.get(code) || { name: r.advertiser_name || code, impressions: 0, reach: 0, rows: 0, channels: new Set(), dmas: new Set() };
      cur.impressions += Number(r.impressions || 0);
      cur.reach += Number(r.reach || 0);
      cur.rows++;
      if (r.digital_channel) cur.channels.add(r.digital_channel);
      if (r.dma) cur.dmas.add(r.dma);
      map.set(code, cur);
    });
    return Array.from(map.values())
      .map(a => ({ ...a, channels: a.channels.size, dmas: a.dmas.size }))
      .sort((a, b) => b.impressions - a.impressions);
  }, [filtered]);

  /* ── DMA breakdown ── */
  const dmaBreakdown = useMemo(() => {
    const map = new Map<string, { impressions: number; reach: number; rows: number }>();
    filtered.forEach((r: any) => {
      const dma = r.dma || "Unknown";
      const cur = map.get(dma) || { impressions: 0, reach: 0, rows: 0 };
      cur.impressions += Number(r.impressions || 0);
      cur.reach += Number(r.reach || 0);
      cur.rows++;
      map.set(dma, cur);
    });
    return Array.from(map.entries())
      .map(([dma, m]) => ({ dma, ...m }))
      .sort((a, b) => b.impressions - a.impressions)
      .slice(0, 30);
  }, [filtered]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center space-y-3">
          <Activity className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading campaign data…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto bg-background">
      <div className="max-w-[1400px] mx-auto p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Reports</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Aggregated campaign performance across all advertisers
          </p>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Advertiser</label>
                <Select value={selectedAdvertiser} onValueChange={setSelectedAdvertiser}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">All Advertisers</SelectItem>
                    {advertisers.map(([code, name]) => (
                      <SelectItem key={code} value={code}>{name}</SelectItem>
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
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Search</label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder="Name, DMA, publisher…"
                    className="h-9 text-xs pl-7"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <SummaryCard icon={Eye} label="Impressions" value={fmt(agg.impressions)} />
          <SummaryCard icon={Users} label="Reach" value={fmt(agg.reach)} />
          <SummaryCard icon={Radio} label="Avg Frequency" value={agg.avgFrequency.toFixed(2)} />
          <SummaryCard icon={TrendingUp} label="Avg VCR" value={pct(agg.avgVCR)} />
          <SummaryCard icon={BarChart3} label="Channels" value={String(agg.channels)} />
          <SummaryCard icon={DollarSign} label="DMAs" value={String(agg.dmas)} />
        </div>

        {/* Tabs: By Channel / By Advertiser / By DMA */}
        <Tabs defaultValue="channel" className="space-y-4">
          <TabsList>
            <TabsTrigger value="channel">By Channel</TabsTrigger>
            <TabsTrigger value="advertiser">By Advertiser</TabsTrigger>
            <TabsTrigger value="dma">By DMA</TabsTrigger>
          </TabsList>

          <TabsContent value="channel">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Channel Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
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
                    {channelBreakdown.map(row => (
                      <TableRow key={row.channel}>
                        <TableCell className="font-medium">{row.channel}</TableCell>
                        <TableCell className="text-right">{fmt(row.impressions)}</TableCell>
                        <TableCell className="text-right">{fmt(row.reach)}</TableCell>
                        <TableCell className="text-right">{row.rows.toLocaleString()}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary rounded-full"
                                style={{ width: `${agg.impressions ? (row.impressions / agg.impressions) * 100 : 0}%` }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground w-10 text-right">
                              {agg.impressions ? ((row.impressions / agg.impressions) * 100).toFixed(1) : 0}%
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {channelBreakdown.length === 0 && (
                      <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No data</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="advertiser">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Advertiser Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
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
                    {advertiserBreakdown.map(row => (
                      <TableRow key={row.name}>
                        <TableCell className="font-medium">{row.name}</TableCell>
                        <TableCell className="text-right">{fmt(row.impressions)}</TableCell>
                        <TableCell className="text-right">{fmt(row.reach)}</TableCell>
                        <TableCell className="text-right">{row.channels}</TableCell>
                        <TableCell className="text-right">{row.dmas}</TableCell>
                        <TableCell className="text-right">{row.rows.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                    {advertiserBreakdown.length === 0 && (
                      <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No data</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="dma">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Top DMAs</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
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
                    {dmaBreakdown.map(row => (
                      <TableRow key={row.dma}>
                        <TableCell className="font-medium">{row.dma}</TableCell>
                        <TableCell className="text-right">{fmt(row.impressions)}</TableCell>
                        <TableCell className="text-right">{fmt(row.reach)}</TableCell>
                        <TableCell className="text-right">{row.rows.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                    {dmaBreakdown.length === 0 && (
                      <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No data</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

/* ── Small summary card ── */
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
