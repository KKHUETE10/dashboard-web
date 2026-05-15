"use client";

import React from "react";
import { collection, getDocs } from "firebase/firestore";

import { db } from "@/lib/firebase";
import type { Guild } from "@/types";

type GuildContextValue = {
  guildId: string | null;
  setGuildId: (id: string) => void;
  guilds: Guild[];
  loading: boolean;
};

const GuildContext = React.createContext<GuildContextValue | undefined>(undefined);

export function GuildProvider({ children }: { children: React.ReactNode }) {
  const [guilds, setGuilds] = React.useState<Guild[]>([]);
  const [guildId, setGuildId] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState<boolean>(true);

  React.useEffect(() => {
    let isMounted = true;

    async function loadGuilds() {
      try {
        const snapshot = await getDocs(collection(db, "servers"));
        if (!isMounted) {
          return;
        }

        const items = snapshot.docs.map((doc) => {
          const data = doc.data() as {
            server_id?: string;
            server_name?: string;
            name?: string;
            title?: string;
          };

          return {
            id: data.server_id ?? doc.id,
            name: data.server_name ?? data.name ?? data.title ?? doc.id,
          } as Guild;
        });

        setGuilds(items);
        if (!guildId && items.length > 0) {
          setGuildId(items[0].id);
        }
      } catch (error) {
        console.error("Failed to load guilds", error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadGuilds();

    return () => {
      isMounted = false;
    };
  }, []);

  const value = React.useMemo(
    () => ({ guildId, setGuildId, guilds, loading }),
    [guildId, guilds, loading]
  );

  return <GuildContext.Provider value={value}>{children}</GuildContext.Provider>;
}

export function useGuild() {
  const context = React.useContext(GuildContext);
  if (!context) {
    throw new Error("useGuild must be used within GuildProvider");
  }
  return context;
}
