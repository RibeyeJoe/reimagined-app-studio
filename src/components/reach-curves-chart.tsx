import { useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from "recharts";
import type { ChannelAllocation } from "@/lib/schema";

const COLORS = [
  "hsl(var(--primary))", "#ef4444", "#f59e0b", "#10b981", "#6366f1",
  "#ec4899", "#14b8a6", "#f97316", "#8b5cf6", "#06b6d4",
];

/**
 * Modeled reach curve: logarithmic growth with diminishing returns.
 * reach(spend) = maxReach * (1 - e^(-k * spend))
 * k varies by channel type to reflect different saturation rates.
 */
const CHANNEL_K: Record<string, number> = {
  Search: 0.0004, Social: 0.00025, Display: 0.0002, OLV: 0.00015,
  CTV: 0.00012, "YouTube/YouTubeTV": 0.00018, "Amazon/Prime Video/Twitch": 0.00015,
  Linear: 0.0001, Radio: 0.00022, Audio: 0.0002, DOOH: 0.00014,
  OOH: 0.0001, Email: 0.0006, Netflix: 0.00012,
};

const CHANNEL_MAX_REACH: Record<string, number> = {
  Search: 50000, Social: 120000, Display: 200000, OLV: 150000,
  CTV: 300000, "YouTube/YouTubeTV": 250000, "Amazon/Prime Video/Twitch": 180000,
  Linear: 500000, Radio: 80000, Audio: 100000, DOOH: 120000,
  OOH: 200000, Email: 30000, Netflix: 250000,
};

function reachAtSpend(channel: string, spend: number): number {
  const k = CHANNEL_K[channel] || 0.0002;
  const max = CHANNEL_MAX_REACH[channel] || 100000;
  return Math.round(max * (1 - Math.exp(-k * spend)));
}

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
      let combinedReach = 0;

      enabledChannels.forEach(ch => {
        const channelSpend = fraction * ch.budget * 1.5; // scale proportionally
        const reach = reachAtSpend(ch.channel, channelSpend);
        point[ch.channel] = reach;
        combinedReach += reach;
      });

      // De-duplicate combined reach (overlap factor ~30%)
      point["Combined"] = Math.round(combinedReach * 0.7);
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
              tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v}
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
          const currentReach = reachAtSpend(ch.channel, ch.budget);
          const maxReach = CHANNEL_MAX_REACH[ch.channel] || 100000;
          const saturation = Math.round((currentReach / maxReach) * 100);
          return (
            <div key={ch.channel} className="text-[10px] text-muted-foreground">
              <span className="font-semibold text-foreground">{ch.channel}</span>: {saturation}% saturated
              ({currentReach.toLocaleString()} reach at ${ch.budget.toLocaleString()})
            </div>
          );
        })}
      </div>
    </div>
  );
}
