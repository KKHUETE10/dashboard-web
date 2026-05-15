type StatCardProps = {
  label: string;
  value: string | number;
  helper?: string;
};

export default function StatCard({ label, value, helper }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
        {label}
      </p>
      <div className="mt-4 text-3xl font-semibold text-zinc-900 dark:text-zinc-100">
        {value}
      </div>
      {helper && (
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">{helper}</p>
      )}
    </div>
  );
}
