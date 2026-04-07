"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Daily = { name: string; fallas: number };
type Weekly = { name: string; registros: number };

type Props = {
  daily: Daily[];
  weekly: Weekly[];
};

const NAVY = "#0f2744";
const TEAL = "#0d9488";
const CYAN = "#22d3ee";

const tooltipStyle = {
  backgroundColor: "rgba(255,255,255,0.92)",
  border: `1px solid rgba(13, 148, 136, 0.25)`,
  borderRadius: "12px",
  boxShadow: "0 12px 40px rgba(15, 39, 68, 0.12)",
};

export default function DashboardCharts({ daily, weekly }: Props) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-2xl border border-white/25 bg-white/35 p-5 shadow-xl backdrop-blur-xl">
        <h3 className="text-sm font-semibold text-brand-navy dark:text-slate-100">Fallas por día</h3>
        <p className="text-xs text-slate-600 dark:text-slate-400">Últimos 14 días — registros guardados</p>
        <div className="mt-4 h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={daily} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="fillFallas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={TEAL} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={CYAN} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#99f6e4" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 10, fill: NAVY }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 10, fill: NAVY }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                labelStyle={{ color: NAVY, fontWeight: 600 }}
              />
              <Area
                type="monotone"
                dataKey="fallas"
                stroke={TEAL}
                strokeWidth={2}
                fill="url(#fillFallas)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-2xl border border-white/25 bg-white/35 p-5 shadow-xl backdrop-blur-xl">
        <h3 className="text-sm font-semibold text-brand-navy dark:text-slate-100">Tendencia semanal</h3>
        <p className="text-xs text-slate-600 dark:text-slate-400">Registros por semana (inicio lunes)</p>
        <div className="mt-4 h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={weekly} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#99f6e4" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 10, fill: NAVY }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 10, fill: NAVY }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                labelStyle={{ color: NAVY, fontWeight: 600 }}
              />
              <Line
                type="monotone"
                dataKey="registros"
                stroke={CYAN}
                strokeWidth={3}
                dot={{ fill: TEAL, strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
