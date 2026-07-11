import React from "react";
import { Card, CardContent } from "./Card";
import { cn } from "../../lib/utils";

interface StatProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  hint?: string;
  /** Gold-accented treatment — reserve for the single most important metric. */
  highlight?: boolean;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export function Stat({ title, value, icon, hint, highlight, trend, className }: StatProps) {
  return (
    <Card
      className={cn(
        "overflow-hidden",
        highlight && "border-[var(--color-accent-300)] bg-[var(--color-accent-50)]",
        className
      )}
    >
      <CardContent className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-sm font-medium text-[var(--color-text-muted)]">{title}</span>
          {icon && (
            <div
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-sm",
                highlight
                  ? "bg-[var(--color-accent-500)] text-white"
                  : "bg-[var(--color-primary-subtle)] text-[var(--color-primary)]"
              )}
            >
              {React.isValidElement(icon)
                ? React.cloneElement(icon as React.ReactElement<{ className?: string }>, {
                    className: "h-5 w-5",
                  })
                : icon}
            </div>
          )}
        </div>

        <div className="flex flex-col space-y-1">
          <span className="truncate text-2xl font-bold tracking-tight text-[var(--color-text)] tabular-nums">
            {value}
          </span>

          {(trend || hint) && (
            <div className="flex items-center pt-1">
              {trend && (
                <span
                  className={cn(
                    "inline-flex items-center text-xs font-semibold",
                    trend.isPositive ? "text-[var(--color-success)]" : "text-[var(--color-error)]"
                  )}
                >
                  {trend.isPositive ? "+" : "-"}
                  {trend.value}%
                </span>
              )}
              {(hint || trend) && (
                <span className="ml-1.5 truncate text-xs text-[var(--color-text-muted)]">
                  {hint ?? "vs last month"}
                </span>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
