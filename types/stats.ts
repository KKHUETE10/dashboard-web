export type Stat = {
  correct: number;
  total: number;
  name: string;
  timestamp: unknown;
  topic: string;
  user_id: string;
  guildId: string;
};

export type StatWithId = Stat & { id: string };
