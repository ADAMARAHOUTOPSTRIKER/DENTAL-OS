"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  CartesianGrid,
} from "recharts";
import { revenueTrend, actsMix, weeklyLoad } from "@/lib/data";

const axis = { fontSize: 11, fill: "#0d304066" };

export function RevenueArea() {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={revenueTrend} margin={{ top: 10, right: 8, left: -18, bottom: 0 }}>
        <defs>
          <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2ec4b6" stopOpacity={0.4} />
            <stop offset="100%" stopColor="#2ec4b6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#0d304012" vertical={false} />
        <XAxis dataKey="m" tick={axis} axisLine={false} tickLine={false} />
        <YAxis tick={axis} axisLine={false} tickLine={false} width={40} />
        <Tooltip
          cursor={{ stroke: "#2ec4b6", strokeWidth: 1 }}
          contentStyle={{ borderRadius: 12, border: "1px solid #0d304014", fontSize: 12, boxShadow: "0 12px 32px -16px rgba(8,34,46,0.25)" }}
          formatter={((v: number) => [`${v} K MAD`, "Revenu"]) as never}
        />
        <Area
          type="monotone"
          dataKey="v"
          stroke="#0d8a80"
          strokeWidth={2.5}
          fill="url(#rev)"
          isAnimationActive={false}
          dot={{ r: 3, fill: "#0d8a80" }}
          activeDot={{ r: 5 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function ActsDonut() {
  return (
    <div className="flex items-center gap-4">
      <ResponsiveContainer width={150} height={150}>
        <PieChart>
          <Pie
            data={actsMix}
            dataKey="value"
            nameKey="name"
            innerRadius={45}
            outerRadius={70}
            paddingAngle={2}
            stroke="none"
            isAnimationActive={false}
          >
            {actsMix.map((a) => (
              <Cell key={a.name} fill={a.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ borderRadius: 12, border: "1px solid #0d304014", fontSize: 12 }}
            formatter={((v: number, n: string) => [`${v}%`, n]) as never}
          />
        </PieChart>
      </ResponsiveContainer>
      <ul className="flex-1 space-y-2">
        {actsMix.map((a) => (
          <li key={a.name} className="flex items-center gap-2 text-xs">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: a.color }} />
            <span className="flex-1 text-ink-800/70">{a.name}</span>
            <span className="font-semibold text-ink-900">{a.value}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function WeeklyBars() {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={weeklyLoad} margin={{ top: 10, right: 8, left: -22, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#0d304012" vertical={false} />
        <XAxis dataKey="d" tick={axis} axisLine={false} tickLine={false} />
        <YAxis tick={axis} axisLine={false} tickLine={false} />
        <Tooltip
          cursor={{ fill: "#2ec4b60d" }}
          contentStyle={{ borderRadius: 12, border: "1px solid #0d304014", fontSize: 12 }}
          formatter={((v: number) => [`${v} RDV`, ""]) as never}
        />
        <Bar dataKey="v" radius={[6, 6, 0, 0]} isAnimationActive={false} fill="#2ec4b6" barSize={26} />
      </BarChart>
    </ResponsiveContainer>
  );
}
