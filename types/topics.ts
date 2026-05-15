export type Topic = {
  title: string;
  num_quizzes_generated: number;
  created_at: unknown;
  document_storage_url: string;
  guildId: string;
};

export type TopicWithId = Topic & { id: string };
