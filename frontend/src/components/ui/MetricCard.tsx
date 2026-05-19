type Props = {
  label: string;
  value: string;
  delta: string;
};

export function MetricCard({ label, value, delta }: Props) {
  const positive = delta.startsWith("+");
  return (
    <div className="panel p-5">
      <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{label}</p>
      <div className="mt-6 flex items-end justify-between">
        <p className="font-display text-3xl font-bold text-white">{value}</p>
        <span className={`rounded-full px-3 py-1 text-xs ${positive ? "bg-emerald-500/15 text-emerald-300" : "bg-rose-500/15 text-rose-300"}`}>
          {delta}
        </span>
      </div>
    </div>
  );
}

