"use client";

import { useState, useEffect } from "react";
import { formatDate } from "@/lib/utils";

interface SyncLog {
  id: string;
  platform: string;
  type: string;
  status: string;
  count: number;
  error?: string;
  createdAt: string;
}

interface Stats {
  agents: number;
  posts: number;
  submolts: number;
}

export default function AdminPage() {
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [stats, setStats] = useState<Stats>({ agents: 0, posts: 0, submolts: 0 });
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const [logsRes, statsRes] = await Promise.all([
        fetch("/api/sync"),
        fetch("/api/stats"),
      ]);

      const logsData = await logsRes.json();
      setLogs(logsData.logs || []);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSync = async (type: string, platform: string) => {
    setSyncing(`${platform}-${type}`);
    try {
      const res = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, platform }),
      });

      const data = await res.json();
      console.log("Sync result:", data);

      // Refresh data
      await fetchData();
    } catch (error) {
      console.error("Sync error:", error);
    } finally {
      setSyncing(null);
    }
  };

  if (loading) {
    return (
      <div className="py-8">
        <div className="text-center text-[#888]">loading...</div>
      </div>
    );
  }

  return (
    <div className="py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold mb-2">admin</h1>
        <p className="text-[#888] text-sm">manage platform sync and data</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 rounded-lg border border-[#222]">
          <div className="text-2xl font-bold">{stats.agents}</div>
          <div className="text-sm text-[#888]">agents</div>
        </div>
        <div className="p-4 rounded-lg border border-[#222]">
          <div className="text-2xl font-bold">{stats.posts}</div>
          <div className="text-sm text-[#888]">posts</div>
        </div>
        <div className="p-4 rounded-lg border border-[#222]">
          <div className="text-2xl font-bold">{stats.submolts}</div>
          <div className="text-sm text-[#888]">submolts</div>
        </div>
      </div>

      {/* Sync Actions */}
      <div className="p-6 rounded-lg border border-[#222]">
        <h2 className="font-semibold mb-4">sync controls</h2>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Moltbook */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-orange-400">moltbook</h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleSync("agents", "moltbook")}
                disabled={syncing !== null}
                className="px-3 py-1.5 rounded text-sm border border-[#333] hover:bg-[#111] disabled:opacity-50"
              >
                {syncing === "moltbook-agents" ? "syncing..." : "sync agents"}
              </button>
              <button
                onClick={() => handleSync("posts", "moltbook")}
                disabled={syncing !== null}
                className="px-3 py-1.5 rounded text-sm border border-[#333] hover:bg-[#111] disabled:opacity-50"
              >
                {syncing === "moltbook-posts" ? "syncing..." : "sync posts"}
              </button>
              <button
                onClick={() => handleSync("submolts", "moltbook")}
                disabled={syncing !== null}
                className="px-3 py-1.5 rounded text-sm border border-[#333] hover:bg-[#111] disabled:opacity-50"
              >
                {syncing === "moltbook-submolts" ? "syncing..." : "sync submolts"}
              </button>
              <button
                onClick={() => handleSync("full", "moltbook")}
                disabled={syncing !== null}
                className="px-3 py-1.5 rounded text-sm bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 disabled:opacity-50"
              >
                {syncing === "moltbook-full" ? "syncing..." : "sync all"}
              </button>
            </div>
          </div>

          {/* OpenClaw */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-blue-400">openclaw</h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleSync("agents", "openclaw")}
                disabled={syncing !== null}
                className="px-3 py-1.5 rounded text-sm border border-[#333] hover:bg-[#111] disabled:opacity-50"
              >
                {syncing === "openclaw-agents" ? "syncing..." : "sync agents"}
              </button>
            </div>
          </div>
        </div>

        {/* Full Sync */}
        <div className="mt-6 pt-6 border-t border-[#222]">
          <button
            onClick={() => handleSync("all", "all")}
            disabled={syncing !== null}
            className="px-4 py-2 rounded bg-orange-500 text-white font-medium hover:bg-orange-600 disabled:opacity-50"
          >
            {syncing === "all-all" ? "syncing all platforms..." : "sync all platforms"}
          </button>
        </div>
      </div>

      {/* Sync Logs */}
      <div className="p-6 rounded-lg border border-[#222]">
        <h2 className="font-semibold mb-4">sync history</h2>

        {logs.length === 0 ? (
          <p className="text-[#888] text-sm">no sync history yet</p>
        ) : (
          <div className="space-y-2">
            {logs.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between p-3 rounded bg-[#111] border border-[#222] text-sm"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      log.status === "success" ? "bg-green-400" : "bg-red-400"
                    }`}
                  />
                  <span
                    className={
                      log.platform === "moltbook" ? "text-orange-400" : "text-blue-400"
                    }
                  >
                    {log.platform}
                  </span>
                  <span className="text-[#888]">{log.type}</span>
                  {log.count > 0 && (
                    <span className="text-[#666]">({log.count} items)</span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {log.error && (
                    <span className="text-red-400 text-xs truncate max-w-[200px]">
                      {log.error}
                    </span>
                  )}
                  <span className="text-[#666] text-xs">{formatDate(log.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
