import type { RemixiconComponentType } from "@remixicon/react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type StatCardProps = {
  label: string;
  value: string | number;
  hint?: string;
  icon: RemixiconComponentType;
  accent?: "primary" | "success" | "warning" | "danger";
};

const accentStyles: Record<NonNullable<StatCardProps["accent"]>, string> = {
  primary: "bg-primary/10 text-primary",
  success:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
  warning:
    "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
  danger: "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400",
};

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  accent = "primary",
}: StatCardProps) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-muted-foreground text-sm font-medium">{label}</p>
          <p className="font-heading text-3xl font-semibold tracking-tight">
            {value}
          </p>
          {hint && <p className="text-muted-foreground text-xs">{hint}</p>}
        </div>
        <div
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-xl",
            accentStyles[accent],
          )}
        >
          <Icon className="size-5" />
        </div>
      </CardContent>
    </Card>
  );
}
