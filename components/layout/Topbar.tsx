"use client";

import React from "react";

import { useGuild } from "@/app/providers";

export default function Topbar() {
  const { guildId, setGuildId, guilds, loading } = useGuild();

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-zinc-200 bg-white/90 px-6 py-4 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90">
      <div className="flex flex-col">
        <span className="text-sm uppercase tracking-[0.2em] text-zinc-500">
          Analytics
        </span>
        <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Dashboard
        </h1>
      </div>
      <div className="flex items-center gap-3">
        <label
          htmlFor="guild-select"
          className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-500"
        >
          Servidor
        </label>
        <select
          id="guild-select"
          className="h-10 min-w-[220px] rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          disabled={loading || guilds.length === 0}
          value={guildId ?? ""}
          onChange={(event) => setGuildId(event.target.value)}
        >
          {loading && <option value="">Cargando...</option>}
          {!loading && guilds.length === 0 && (
            <option value="">No hay servidores</option>
          )}
          {guilds.map((guild) => (
            <option key={guild.id} value={guild.id}>
              {guild.name}
            </option>
          ))}
        </select>
      </div>
    </header>
  );
}
