import Link from "next/link";

const navItems = [
  { href: "/dashboard", label: "Overview" },
  { href: "/students", label: "Students" },
  { href: "/topics", label: "Topics" },
  { href: "/quiz-analytics", label: "Quiz Analytics" },
];

export default function Sidebar() {
  return (
    <aside className="hidden h-screen w-60 flex-col border-r border-zinc-200 bg-white px-6 py-8 dark:border-zinc-800 dark:bg-zinc-950 lg:flex">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900" />
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
            SaaS
          </p>
          <p className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            Edu Analytics
          </p>
        </div>
      </div>
      <nav className="mt-10 flex flex-1 flex-col gap-2">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-900 dark:hover:text-white"
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-xs text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
        Filtrado global por servidor.
      </div>
    </aside>
  );
}
