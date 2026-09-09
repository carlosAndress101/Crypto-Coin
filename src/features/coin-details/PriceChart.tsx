import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { QueryState } from "@/components/QueryState";
import { coingecko } from "@/lib/coingecko";
import { formatCurrency } from "@/lib/format";
import { CHART_METRICS, CHART_RANGES } from "@/types/coingecko";
import type { ChartMetric, ChartRange } from "@/types/coingecko";

const METRIC_LABEL: Record<ChartMetric, string> = {
  prices: "Price",
  market_caps: "Market cap",
  total_volumes: "Total volume",
};

interface PriceChartProps {
  coinId: string;
  currency: string;
}

interface TooltipPayload {
  active?: boolean;
  label?: string | number;
  payload?: { value?: number }[];
  currency: string;
}

function ChartTooltip({ active, label, payload, currency }: TooltipPayload) {
  const value = payload?.[0]?.value;
  if (!active || value === undefined) return null;

  return (
    <div className="rounded bg-surface-control px-2 py-1 text-sm">
      <p className="text-accent">
        {label} · {formatCurrency(value, currency, { maximumFractionDigits: 5 })}
      </p>
    </div>
  );
}

function ToggleGroup<T extends string | number>({
  label,
  options,
  value,
  onChange,
  render,
}: {
  label: string;
  options: readonly T[];
  value: T;
  onChange: (next: T) => void;
  render: (option: T) => string;
}) {
  return (
    <fieldset className="flex flex-wrap gap-2 border-0 p-0">
      <legend className="sr-only">{label}</legend>
      {options.map((option) => (
        <button
          key={String(option)}
          type="button"
          aria-pressed={option === value}
          onClick={() => onChange(option)}
          className={`rounded px-2 py-0.5 text-sm capitalize transition-colors ${
            option === value
              ? "bg-accent/25 text-accent"
              : "bg-surface-control text-fg-muted hover:text-fg"
          }`}
        >
          {render(option)}
        </button>
      ))}
    </fieldset>
  );
}

export function PriceChart({ coinId, currency }: PriceChartProps) {
  const [metric, setMetric] = useState<ChartMetric>("prices");
  const [range, setRange] = useState<ChartRange>(7);

  const query = useQuery({
    // `currency` forma parte de la clave: antes el gráfico pedía siempre USD e
    // ignoraba la divisa elegida, así que contradecía a la tabla de al lado.
    queryKey: ["market-chart", coinId, currency, range],
    queryFn: ({ signal }) => coingecko.marketChart(coinId, currency, range, signal),
    staleTime: 5 * 60_000,
  });

  const series = (query.data?.[metric] ?? []).map(([timestamp, value]) => ({
    date: new Date(timestamp).toLocaleDateString(),
    value,
  }));

  return (
    <div className="flex h-full w-full flex-col gap-3">
      <div className="min-h-56 flex-1">
        <QueryState
          isPending={query.isPending}
          error={query.error}
          isEmpty={series.length === 0}
          onRetry={() => void query.refetch()}
          loadingLabel="Loading chart…"
          emptyMessage="No chart data for this range."
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={series}>
              <CartesianGrid stroke="var(--color-line)" />
              <XAxis dataKey="date" hide />
              <YAxis dataKey="value" hide domain={["auto", "auto"]} />
              {/* En Recharts 3 el orden del JSX decide el apilado, porque SVG no tiene
                  z-index. El Tooltip va al final para quedar por encima de la línea. */}
              <Line
                type="monotone"
                dataKey="value"
                stroke="var(--color-accent)"
                strokeWidth={2}
                dot={false}
                name={METRIC_LABEL[metric]}
              />
              <Tooltip
                content={<ChartTooltip currency={currency} />}
                cursor={false}
                wrapperStyle={{ outline: "none" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </QueryState>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <ToggleGroup
          label="Chart metric"
          options={CHART_METRICS}
          value={metric}
          onChange={setMetric}
          render={(option) => METRIC_LABEL[option]}
        />
        <ToggleGroup
          label="Time range"
          options={CHART_RANGES}
          value={range}
          onChange={setRange}
          render={(option) => `${option}d`}
        />
      </div>
    </div>
  );
}
