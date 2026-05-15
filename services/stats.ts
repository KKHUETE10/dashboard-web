import { collection, getDocs, query, type QueryConstraint } from "firebase/firestore";

import { db } from "@/lib/firebase";
import type { StatWithId } from "@/types";

type StatsFilters = {
  guildId: string;
};

export async function fetchStats(filters: StatsFilters) {
  const constraints: QueryConstraint[] = [];
  const statsQuery = query(
    collection(db, "servers", filters.guildId, "stats"),
    ...constraints
  );
  const snapshot = await getDocs(statsQuery);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<StatWithId, "id">),
  }));
}
