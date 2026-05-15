"use client";

import React from "react";
import {
  Bar,
  BarChart,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import ChartCard from "@/components/ChartCard";
import DataTable from "@/components/DataTable";
import StatCard from "@/components/StatCard";
import { useGuild } from "@/app/providers";
import { fetchStats } from "@/services/stats";
import { fetchTopics } from "@/services/topics";
import type { StatWithId, TopicWithId } from "@/types";

const chartColors = {
  primary: "#2563eb",
  secondary: "#22c55e",
  accent: "#ef4444",
};

type StatKpis = {
  totalQuizzes: number;
  uniqueUsers: number;
  accuracy: number;
  totalTopics: number;
};

type TimeSeriesPoint = {
  date: string;
  total: number;
};

type RatioPoint = {
  name: string;
  value: number;
};

type TopicActivityPoint = {
  name: string;
  total: number;
};

type RankingRow = {
  id: string;
  name: string;
  totalQuizzes: number;
  accuracy: string;
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

function calculateKpis(stats: StatWithId[], topics: TopicWithId[]): StatKpis {
  const totalQuizzes = stats.length;
  const uniqueUsers = new Set(stats.map((stat) => stat.user_id)).size;
  const totals = stats.reduce(
    (acc, stat) => ({
      correct: acc.correct + (stat.correct ?? 0),
      total: acc.total + (stat.total ?? 0),
    }),
    { correct: 0, total: 0 }
  );
  const accuracy = totals.total > 0 ? totals.correct / totals.total : 0;

  return {
    totalQuizzes,
    uniqueUsers,
    accuracy,
    totalTopics: topics.length,
  };
}

function buildTimeSeries(stats: StatWithId[]): TimeSeriesPoint[] {
  const bucket = new Map<string, number>();

  stats.forEach((stat) => {
    const key = toDateLabel(stat.timestamp);
    bucket.set(key, (bucket.get(key) ?? 0) + 1);
  });

  return Array.from(bucket.entries())
    .map(([date, total]) => ({ date, total }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function buildRatio(stats: StatWithId[]): RatioPoint[] {
  const totals = stats.reduce(
    (acc, stat) => ({
      correct: acc.correct + (stat.correct ?? 0),
      total: acc.total + (stat.total ?? 0),
    }),
    { correct: 0, total: 0 }
  );

  const incorrect = Math.max(totals.total - totals.correct, 0);

  return [
    { name: "Correct", value: totals.correct },
    { name: "Incorrect", value: incorrect },
  ];
}

function buildTopicActivity(stats: StatWithId[]): TopicActivityPoint[] {
  const bucket = new Map<string, number>();

  stats.forEach((stat) => {
    const key = stat.topic ?? "Unknown";
    bucket.set(key, (bucket.get(key) ?? 0) + 1);
  });

  return Array.from(bucket.entries())
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 6);
}

function buildUserRanking(stats: StatWithId[]): RankingRow[] {
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
      totalQuizzes: data.quizzes,
      accuracy:
        data.total > 0
          ? `${Math.round((data.correct / data.total) * 100)}%`
          : "0%",
    }))
    .sort((a, b) => b.totalQuizzes - a.totalQuizzes)
    .slice(0, 6);
}

function buildHardestTopics(stats: StatWithId[]): RankingRow[] {
  const bucket = new Map<
    string,
    { name: string; correct: number; total: number; quizzes: number }
  >();

  stats.forEach((stat) => {
    const key = stat.topic ?? "Unknown";
    const current = bucket.get(key) ?? {
      name: key,
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
      totalQuizzes: data.quizzes,
      accuracy:
        data.total > 0
          ? `${Math.round((data.correct / data.total) * 100)}%`
          : "0%",
    }))
    .sort((a, b) => a.accuracy.localeCompare(b.accuracy))
    .slice(0, 6);
}

export default function DashboardPage() {
  const { guildId } = useGuild();
  const [stats, setStats] = React.useState<StatWithId[]>([]);
  const [topics, setTopics] = React.useState<TopicWithId[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);

  React.useEffect(() => {
    if (!guildId) {
      return;
    }

    let isMounted = true;

    async function load() {
      setLoading(true);
      try {
        const [statsData, topicsData] = await Promise.all([
          fetchStats({ guildId }),
          fetchTopics({ guildId }),
        ]);

        if (!isMounted) {
          return;
        }

        setStats(statsData);
        setTopics(topicsData);
      } catch (error) {
        console.error("Failed to load dashboard data", error);
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

  const kpis = calculateKpis(stats, topics);
  const timeSeries = buildTimeSeries(stats);
  const ratioData = buildRatio(stats);
  const topicActivity = buildTopicActivity(stats);
  const topUsers = buildUserRanking(stats);
  const hardestTopics = buildHardestTopics(stats);

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-2">
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
          Overview
        </p>
        <h1 className="text-3xl font-semibold text-zinc-900 dark:text-zinc-100">
          Dashboard
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Global stats for the selected guild.
        </p>
      </header>

      {loading ? (
        <div className="rounded-2xl border border-dashed border-zinc-200 bg-white p-6 text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950">
          Loading data...
        </div>
      ) : (
        <div className="space-y-8">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Total quizzes" value={kpis.totalQuizzes} />
            <StatCard label="Unique users" value={kpis.uniqueUsers} />
            <StatCard
              label="Average accuracy"
              value={`${Math.round(kpis.accuracy * 100)}%`}
            />
            <StatCard label="Active topics" value={kpis.totalTopics} />
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <ChartCard
              title="Quiz evolution"
              description="Attempts over time"
            >
              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={timeSeries}>
                    <XAxis dataKey="date" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="total"
                      stroke={chartColors.primary}
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
            <ChartCard title="Global ratio" description="Correct vs incorrect">
              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={ratioData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={50}
                      outerRadius={80}
                    >
                      {ratioData.map((entry) => (
                        <Cell
                          key={entry.name}
                          fill={
                            entry.name === "Correct"
                              ? chartColors.secondary
                              : chartColors.accent
                          }
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
            <ChartCard
              title="Activity by topic"
              description="Top active topics"
            >
              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topicActivity}>
                    <XAxis dataKey="name" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="total" radius={[6, 6, 0, 0]}>
                      {topicActivity.map((entry, index) => (
                        <Cell
                          key={entry.name}
                          fill={
                            index % 3 === 0
                              ? chartColors.primary
                              : index % 3 === 1
                              ? chartColors.secondary
                              : chartColors.accent
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <ChartCard title="Top users" description="Most quizzes completed">
              <DataTable
                columns={[
                  { key: "name", header: "User" },
                  { key: "totalQuizzes", header: "Quizzes" },
                  { key: "accuracy", header: "Accuracy" },
                ]}
                rows={topUsers}
              />
            </ChartCard>
            <ChartCard title="Hardest topics" description="Lowest accuracy">
              <DataTable
                columns={[
                  { key: "name", header: "Topic" },
                  { key: "totalQuizzes", header: "Quizzes" },
                  { key: "accuracy", header: "Accuracy" },
                ]}
                rows={hardestTopics}
              />
            </ChartCard>
          </div>
        </div>
      )}
    </div>
  );
}
