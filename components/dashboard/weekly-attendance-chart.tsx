"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { asistenciaSemanal } from "@/lib/data/mock";

const chartConfig = {
  presentes: {
    label: "Presentes",
    color: "var(--primary)",
  },
  ausentes: {
    label: "Ausentes",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig;

export function WeeklyAttendanceChart() {
  return (
    <ChartContainer config={chartConfig} className="h-[240px] w-full">
      <BarChart data={asistenciaSemanal} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="dia"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
        />
        <YAxis tickLine={false} axisLine={false} tickMargin={8} width={32} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar
          dataKey="presentes"
          fill="var(--color-presentes)"
          radius={[6, 6, 0, 0]}
        />
        <Bar
          dataKey="ausentes"
          fill="var(--color-ausentes)"
          radius={[6, 6, 0, 0]}
        />
      </BarChart>
    </ChartContainer>
  );
}
