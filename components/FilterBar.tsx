type FilterBarProps = {
  children: React.ReactNode;
};

export default function FilterBar({ children }: FilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm dark:border-zinc-800 dark:bg-zinc-950">
      {children}
    </div>
  );
}
