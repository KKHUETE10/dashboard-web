"use client";

import React from "react";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import ChartCard from "@/components/ChartCard";
import DataTable from "@/components/DataTable";
import FilterBar from "@/components/FilterBar";
import { useGuild } from "@/app/providers";
import { fetchStats } from "@/services/stats";
import type { StatWithId } from "@/types";

const chartColors = {
  primary: "#2563eb",
};

type StudentRow = {
  id: string;
  name: string;
  quizzes: number;
  correct: number;
  total: number;
  accuracy: string;
  rank: number;
};

type StudentTrendPoint = {
  date: string;
  accuracy: number;
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

function buildStudentRows(stats: StatWithId[]): StudentRow[] {
  const bucket = new Map<
    string,
    { name: string; correct: number; total: number; quizzes: number }
  >();

  stats.forEach((stat) => {
    const key = stat.user_id;
    const current = bucket.get(key) ?? {
      name: stat.name ?? stat.user_id,
      correct: 0,
      total: 0,
      quizzes: 0,
    };

    bucket.set(key, {
      name: current.name,
      correct: current.correct + (stat.correct ?? 0),
      total: current.total + (stat.total ?? 0),
      quizzes: current.quizzes + 1,
    });
  });

  return Array.from(bucket.entries())
    .map(([id, data]) => ({
      id,
      name: data.name,
      quizzes: data.quizzes,
      correct: data.correct,
      total: data.total,
      accuracy:
        data.total > 0
          ? `${Math.round((data.correct / data.total) * 100)}%`
          : "0%",
      rank: 0,
    }))
    .sort((a, b) => b.quizzes - a.quizzes)
    .map((row, index) => ({ ...row, rank: index + 1 }));
}

function buildStudentTrend(stats: StatWithId[], userId: string | null) {
  if (!userId) {
    return [] as StudentTrendPoint[];
  }

  const filtered = stats.filter((stat) => stat.user_id === userId);
  const bucket = new Map<string, { correct: number; total: number }>();

  filtered.forEach((stat) => {
    const key = toDateLabel(stat.timestamp);
    const current = bucket.get(key) ?? { correct: 0, total: 0 };

    bucket.set(key, {
      correct: current.correct + (stat.correct ?? 0),
      total: current.total + (stat.total ?? 0),
    });
  });

  return Array.from(bucket.entries())
    .map(([date, data]) => ({
      date,
      accuracy: data.total > 0 ? data.correct / data.total : 0,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export default function StudentsPage() {
  const { guildId } = useGuild();
  const [stats, setStats] = React.useState<StatWithId[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [selectedUser, setSelectedUser] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!guildId) {
      return;
    }

    let isMounted = true;

    async function load() {
      setLoading(true);
      try {
        const statsData = await fetchStats({ guildId });
        if (!isMounted) {
          return;
        }

        setStats(statsData);
        if (!selectedUser && statsData.length > 0) {
          setSelectedUser(statsData[0].user_id);
        }
      } catch (error) {
        console.error("Failed to load students data", error);
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
  }, [guildId, selectedUser]);

  const studentRows = buildStudentRows(stats);
  const studentTrend = buildStudentTrend(stats, selectedUser);

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-2">
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
          Students
        </p>
        <h1 className="text-3xl font-semibold text-zinc-900 dark:text-zinc-100">
          Student performance
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Aggregated results by user.
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
                htmlFor="student-select"
                className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-500"
              >
                Usuario
              </label>
              <select
                id="student-select"
                className="h-10 min-w-[220px] rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                value={selectedUser ?? ""}
                onChange={(event) => setSelectedUser(event.target.value)}
              >
                {studentRows.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.name}
                  </option>
                ))}
              </select>
            </div>
          </FilterBar>

          <div className="grid gap-6 lg:grid-cols-2">
            <ChartCard title="User evolution" description="Accuracy over time">
              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={studentTrend}>
                    <XAxis dataKey="date" />
                    <YAxis
                      tickFormatter={(value) => `${Math.round(value * 100)}%`}
                    />
                    <Tooltip
                      formatter={(value: number) =>
                        `${Math.round(value * 100)}%`
                      }
                    />
                    <Line
                      type="monotone"
                      dataKey="accuracy"
                      stroke={chartColors.primary}
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
            <ChartCard title="Students ranking" description="Top performers">
              <DataTable
                columns={[
                  { key: "rank", header: "Rank" },
                  { key: "name", header: "User" },
                  { key: "quizzes", header: "Quizzes" },
                  { key: "correct", header: "Correct" },
                  { key: "total", header: "Total" },
                  { key: "accuracy", header: "Accuracy" },
                ]}
                rows={studentRows}
              />
            </ChartCard>
          </div>
        </div>
      )}
    </div>
  );
}
