"use client";

import React from "react";

import DataTable from "@/components/DataTable";
import FilterBar from "@/components/FilterBar";
import { useGuild } from "@/app/providers";
import { fetchStats } from "@/services/stats";
import type { StatWithId } from "@/types";

type QuizRow = {
  id: string;
  user_id: string;
  name: string;
  topic: string;
  correct: number;
  total: number;
  accuracy: string;
  timestamp: string;
};

type Filters = {
  user: string;
  topic: string;
  date: string;
};

function toDateLabel(value: unknown) {
  if (!value) {
    return "Unknown";
  }

  if (typeof value === "string") {
    return value.slice(0, 10);
  }

  const maybeTimestamp = value as { toDate?: () => Date };
  if (maybeTimestamp.toDate) {
    return maybeTimestamp.toDate().toISOString().slice(0, 10);
  }

  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  return "Unknown";
}

function buildRows(stats: StatWithId[]): QuizRow[] {
  return stats.map((stat) => {
    const accuracy =
      stat.total > 0 ? `${Math.round((stat.correct / stat.total) * 100)}%` : "0%";

    return {
      id: stat.id,
      user_id: stat.user_id ?? "",
      name: stat.name ?? stat.user_id ?? "",
      topic: stat.topic ?? "Unknown",
      correct: stat.correct ?? 0,
      total: stat.total ?? 0,
      accuracy,
      timestamp: toDateLabel(stat.timestamp ?? ""),
    };
  });
}

function uniqueValues(items: string[]) {
  return Array.from(new Set(items)).filter(Boolean).sort();
}

function buildUserOptions(rows: QuizRow[]) {
  const map = new Map<string, string>();

  rows.forEach((row) => {
    if (!map.has(row.user_id) && row.name) {
      map.set(row.user_id, row.name);
    }
  });

  return Array.from(map.entries())
    .map(([id, name]) => ({ id, name }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export default function QuizAnalyticsPage() {
  const { guildId } = useGuild();
  const [stats, setStats] = React.useState<StatWithId[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [filters, setFilters] = React.useState<Filters>({
    user: "",
    topic: "",
    date: "",
  });

  React.useEffect(() => {
    if (!guildId) {
      return;
    }

    let isMounted = true;

    async function load() {
      setLoading(true);
      try {
        const safeGuildId = guildId ?? "";
        const statsData = await fetchStats({ guildId: safeGuildId });
        if (!isMounted) {
          return;
        }

        setStats(statsData);
      } catch (error) {
        console.error("Failed to load quiz analytics", error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      isMounted = false;
    };
  }, [guildId]);

  const rows = buildRows(stats);

  const filteredRows = rows.filter((row) => {
    const matchUser = !filters.user || row.user_id === filters.user;
    const matchTopic = !filters.topic || row.topic === filters.topic;
    const matchDate = !filters.date || row.timestamp === filters.date;

    return matchUser && matchTopic && matchDate;
  });

  const userOptions = buildUserOptions(rows);
  const topicOptions = uniqueValues(rows.map((row) => row.topic));
  const dateOptions = uniqueValues(rows.map((row) => row.timestamp));

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-2">
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
          Quiz analytics
        </p>
        <h1 className="text-3xl font-semibold text-zinc-900 dark:text-zinc-100">
          Raw attempts
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Filter by user, topic, and date.
        </p>
      </header>

      {loading ? (
        <div className="rounded-2xl border border-dashed border-zinc-200 bg-white p-6 text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950">
          Loading data...
        </div>
      ) : (
        <div className="space-y-6">
          <FilterBar>
            <div className="flex items-center gap-2">
              <label
                htmlFor="filter-user"
                className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-500"
              >
                Usuario
              </label>
              <select
                id="filter-user"
                className="h-10 min-w-[200px] rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                value={filters.user}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    user: event.target.value,
                  }))
                }
              >
                <option value="">Todos</option>
                {userOptions.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label
                htmlFor="filter-topic"
                className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-500"
              >
                Topic
              </label>
              <select
                id="filter-topic"
                className="h-10 min-w-[200px] rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                value={filters.topic}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    topic: event.target.value,
                  }))
                }
              >
                <option value="">Todos</option>
                {topicOptions.map((topic) => (
                  <option key={topic} value={topic}>
                    {topic}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label
                htmlFor="filter-date"
                className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-500"
              >
                Fecha
              </label>
              <select
                id="filter-date"
                className="h-10 min-w-[200px] rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                value={filters.date}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    date: event.target.value,
                  }))
                }
              >
                <option value="">Todas</option>
                {dateOptions.map((date) => (
                  <option key={date} value={date}>
                    {date}
                  </option>
                ))}
              </select>
            </div>
          </FilterBar>

          <DataTable
            columns={[
              { key: "user_id", header: "User ID" },
              { key: "name", header: "Name" },
              { key: "topic", header: "Topic" },
              { key: "correct", header: "Correct" },
              { key: "total", header: "Total" },
              { key: "accuracy", header: "Accuracy" },
              { key: "timestamp", header: "Timestamp" },
            ]}
            rows={filteredRows}
          />
        </div>
      )}
    </div>
  );
}
