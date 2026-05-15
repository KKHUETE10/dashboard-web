import { collection, getDocs, query } from "firebase/firestore";

import { db } from "@/lib/firebase";
import type { TopicQuestionWithId, TopicWithId } from "@/types";

type TopicsFilters = {
  guildId: string;
};

export async function fetchTopics(filters: TopicsFilters) {
  const topicsQuery = query(
    collection(db, "servers", filters.guildId, "topics")
  );
  const snapshot = await getDocs(topicsQuery);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<TopicWithId, "id">),
  }));
}

export async function fetchTopicQuestions(guildId: string, topicId: string) {
  const questionsQuery = query(
    collection(db, "servers", guildId, "topics", topicId, "questions")
  );
  const snapshot = await getDocs(questionsQuery);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<TopicQuestionWithId, "id">),
  }));
}
