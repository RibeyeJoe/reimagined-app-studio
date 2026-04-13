import { useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from "recharts";
import type { ChannelAllocation } from "@/lib/schema";
import { channelReach, deduplicatedReach, REACH_PARAMS, DEFAULT_CPMS } from "@/lib/calculations";

const COLORS = [
  "hsl(var(--primary))", "#ef4444", "#f59e0b", "#10b981", "#6366f1",
  "#ec4899", "#14b8a6", "#f97316", "#8b5cf6", "#06b6d4",
];

interface ReachCurvesChartProps {
  allocations: ChannelAllocation[];
  totalBudget: number;
}

export function ReachCurvesChart({ allocations, totalBudget }: ReachCurvesChartProps) {
  const enabledChannels = allocations.filter(a => a.enabled && a.budget > 0);

  const data = useMemo(() => {
    const maxSpend = Math.max(totalBudget * 1.5, 10000);
    const steps = 20;
    const points: any[] = [];

    for (let i = 0; i <= steps; i++) {
      const fraction = i / steps;
      const point: any = { spend: Math.round(fraction * maxSpend) };
      const channelReaches: number[] = [];

      enabledChannels.forEach(ch => {
        const channelSpend = fraction * ch.budget * 1.5;
        const cpm = DEFAULT_CPMS[ch.channel] || 15;
        const impressions = Math.round((channelSpend / cpm) * 1000);
        const reachFraction = channelReach(ch.channel, channelSpend);
        const reachCount = Math.min(Math.round(reachFraction * 98_000_000), impressions);
        point[ch.channel] = reachCount;
        channelReaches.push(reachCount / 98_000_000);
      });

      const dedupFraction = deduplicatedReach(channelReaches);
      const totalImps = enabledChannels.reduce((s, ch) => {
        const spend = fraction * ch.budget * 1.5;
        const cpm2 = DEFAULT_CPMS[ch.channel] || 15;
        return s + Math.round((spend / cpm2) * 1000);
      }, 0);
      point["Combined"] = Math.min(Math.round(dedupFraction * 98_000_000), totalImps);
      points.push(point);
    }
    return points;
  }, [enabledChannels, totalBudget]);

  if (enabledChannels.length === 0) return null;

  return (
    <div className="space-y-3">
      <div>
        <h4 className="text-sm font-display font-bold text-foreground">Estimated Reach Curves</h4>
        <p className="text-[10px] text-muted-foreground">
          Modeled incremental reach vs. spend — shows diminishing returns per channel
        </p>
      </div>
      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis
              dataKey="spend"
              tickFormatter={v => `$${(v / 1000).toFixed(0)}K`}
              className="text-[10px]"
              tick={{ fontSize: 10 }}
            />
            <YAxis
              tickFormatter={v => v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v}
              className="text-[10px]"
              tick={{ fontSize: 10 }}
            />
            <Tooltip
              formatter={(v: number, name: string) => [v.toLocaleString(), name]}
              labelFormatter={v => `Spend: $${Number(v).toLocaleString()}`}
              contentStyle={{ fontSize: 11 }}
            />
            <Legend wrapperStyle={{ fontSize: 10 }} />
            {enabledChannels.map((ch, i) => (
              <Line
                key={ch.channel}
                type="monotone"
                dataKey={ch.channel}
                stroke={COLORS[i % COLORS.length]}
                strokeWidth={1.5}
                dot={false}
              />
            ))}
            <Line
              type="monotone"
              dataKey="Combined"
              stroke="hsl(var(--foreground))"
              strokeWidth={2.5}
              strokeDasharray="6 3"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="flex items-center gap-4 flex-wrap">
        {enabledChannels.map(ch => {
          const reachFraction = channelReach(ch.channel, ch.budget);
          const params = REACH_PARAMS[ch.channel];
          const rMax = params?.rMax ?? 1;
          const saturation = Math.round((reachFraction / rMax) * 100);
          const reachCount = Math.round(reachFraction * 98_000_000);
          return (
            <div key={ch.channel} className="text-[10px] text-muted-foreground">
              <span className="font-semibold text-foreground">{ch.channel}</span>: {saturation}% saturated
              ({reachCount.toLocaleString()} reach at ${ch.budget.toLocaleString()})
            </div>
          );
        })}
      </div>
    </div>
  );
}
