import { Badge } from "@/components/ui/badge";
import { HandItem } from "./handItem";

export function StreetBadge({ street }: { street: HandItem["street"] }) {
  const variants: Record<string, string> = {
    SHOWDOWN:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200",
    PREFLOP:
      "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
    default:
      "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 border-blue-100",
  };
  const style = variants[street] || variants.default;
  return (
    <Badge
      variant="outline"
      className={`rounded-md px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ${style}`}
    >
      {street}
    </Badge>
  );
}
