import { Card } from "@/components/ui/card";

export function StatCard({
  icon,
  label,
  value,
  description,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  description?: string;
}) {
  return (
    <Card className="relative overflow-hidden border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            {label}
          </p>
          <div className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            {value}
          </div>
          {description && (
            <p className="text-xs text-slate-400">{description}</p>
          )}
        </div>
        <div className="rounded-xl bg-slate-100 p-2.5 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          {icon}
        </div>
      </div>
    </Card>
  );
}
