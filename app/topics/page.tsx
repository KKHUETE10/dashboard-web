"use client";

import React from "react";
import {
  Bar,
  BarChart,
  Cell,
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
import { fetchTopicQuestions, fetchTopics } from "@/services/topics";
import type { StatWithId, TopicQuestionWithId, TopicWithId } from "@/types";

const chartColors = {
  primary: "#2563eb",
  accent: "#f97316",
};

type TopicRow = {
  id: string;
  name: string;
  quizzes: number;
  correct: number;
  total: number;
  accuracy: string;
};

type TopicComparisonPoint = {
  name: string;
  accuracy: number;
};

type QuestionRow = {
  id: string;
  question: string;
  success: number;
  failures: number;
  rate: string;
};

function buildTopicRows(stats: StatWithId[]): TopicRow[] {
  const bucket = new Map<
    string,
    { correct: number; total: number; quizzes: number }
  >();

  stats.forEach((stat) => {
    const key = stat.topic ?? "Unknown";
    const current = bucket.get(key) ?? { correct: 0, total: 0, quizzes: 0 };

    bucket.set(key, {
      correct: current.correct + (stat.correct ?? 0),
      total: current.total + (stat.total ?? 0),
      quizzes: current.quizzes + 1,
    });
  });

  return Array.from(bucket.entries())
    .map(([name, data]) => ({
      id: name,
      name,
      quizzes: data.quizzes,
      correct: data.correct,
      total: data.total,
      accuracy:
        data.total > 0
          ? `${Math.round((data.correct / data.total) * 100)}%`
          : "0%",
    }))
    .sort((a, b) => b.quizzes - a.quizzes);
}

function buildTopicComparison(rows: TopicRow[]): TopicComparisonPoint[] {
  return rows.slice(0, 8).map((row) => ({
    name: row.name,
    accuracy: parseFloat(row.accuracy) / 100,
  }));
}

function buildQuestionRows(questions: TopicQuestionWithId[]): QuestionRow[] {
  return questions
    .map((question) => {
      const total = (question.success ?? 0) + (question.failures ?? 0);
      const rate = total > 0 ? question.success / total : 0;

      return {
        id: question.id,
        question: question.question,
        success: question.success,
        failures: question.failures,
        rate: `${Math.round(rate * 100)}%`,
      };
    })
    .sort((a, b) => b.failures - a.failures)
    .slice(0, 6);
}

export default function TopicsPage() {
  const { guildId } = useGuild();
  const [stats, setStats] = React.useState<StatWithId[]>([]);
  const [topics, setTopics] = React.useState<TopicWithId[]>([]);
  const [questions, setQuestions] = React.useState<TopicQuestionWithId[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [selectedTopic, setSelectedTopic] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!guildId) {
      return;
    }

    let isMounted = true;

    async function load() {
      setLoading(true);
      try {
        const safeGuildId = guildId ?? "";
        const [statsData, topicsData] = await Promise.all([
          fetchStats({ guildId: safeGuildId }),
          fetchTopics({ guildId: safeGuildId }),
        ]);

        if (!isMounted) {
          return;
        }

        setStats(statsData);
        setTopics(topicsData);

        const initialTopic = topicsData[0]?.id ?? null;
        setSelectedTopic(initialTopic);

        if (initialTopic) {
          const questionsData = await fetchTopicQuestions(
            safeGuildId,
            initialTopic
          );
          if (isMounted) {
            setQuestions(questionsData);
          }
        }
      } catch (error) {
        console.error("Failed to load topics data", error);
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

  React.useEffect(() => {
    if (!selectedTopic || !guildId) {
      return;
    }

    let isMounted = true;

    async function loadQuestions() {
      try {
        const safeGuildId = guildId ?? "";
        const questionsData = await fetchTopicQuestions(
          safeGuildId,
          selectedTopic
        );
        if (isMounted) {
          setQuestions(questionsData);
        }
      } catch (error) {
        console.error("Failed to load questions", error);
      }
    }

    loadQuestions();

    return () => {
      isMounted = false;
    };
  }, [guildId, selectedTopic]);

  const topicRows = buildTopicRows(stats);
  const comparisonData = buildTopicComparison(topicRows);
  const questionsRows = buildQuestionRows(questions);

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-2">
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
          Topics
        </p>
        <h1 className="text-3xl font-semibold text-zinc-900 dark:text-zinc-100">
          Topic performance
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Performance and difficulty by topic.
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
                htmlFor="topic-select"
                className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-500"
              >
                Topic
              </label>
              <select
                id="topic-select"
                className="h-10 min-w-[220px] rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                value={selectedTopic ?? ""}
                onChange={(event) => setSelectedTopic(event.target.value)}
              >
                {topics.map((topic) => (
                  <option key={topic.id} value={topic.id}>
                    {topic.title}
                  </option>
                ))}
              </select>
            </div>
          </FilterBar>

          <div className="grid gap-6 lg:grid-cols-2">
            <ChartCard title="Topics table" description="Aggregated by topic">
              <DataTable
                columns={[
                  { key: "name", header: "Topic" },
                  { key: "quizzes", header: "Quizzes" },
                  { key: "correct", header: "Correct" },
                  { key: "total", header: "Total" },
                  { key: "accuracy", header: "Accuracy" },
                ]}
                rows={topicRows}
              />
            </ChartCard>
            <ChartCard title="Accuracy by topic" description="Comparison">
              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={comparisonData}>
                    <XAxis dataKey="name" />
                    <YAxis
                      tickFormatter={(value) => `${Math.round(value * 100)}%`}
                    />
                    <Tooltip
                      formatter={(value: number) =>
                        `${Math.round(value * 100)}%`
                      }
                    />
                    <Bar dataKey="accuracy" radius={[6, 6, 0, 0]}>
                      {comparisonData.map((entry, index) => (
                        <Cell
                          key={entry.name}
                          fill={
                            index % 3 === 0
                              ? chartColors.primary
                              : index % 3 === 1
                              ? chartColors.accent
                              : chartColors.secondary
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
          </div>

          <ChartCard title="Most failed questions" description="Optional analysis">
            <DataTable
              columns={[
                { key: "question", header: "Question" },
                { key: "success", header: "Success" },
                { key: "failures", header: "Failures" },
                { key: "rate", header: "Success rate" },
              ]}
              rows={questionsRows}
            />
          </ChartCard>
        </div>
      )}
    </div>
  );
}
