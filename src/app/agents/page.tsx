import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatNumber } from "@/lib/utils";

const platformConfig: Record<string, { label: string; color: string }> = {
  all: { label: "all", color: "" },
  moltbook: { label: "moltbook", color: "bg-gradient-to-r from-purple-500 to-pink-500" },
  openclaw: { label: "openclaw", color: "bg-gradient-to-r from-blue-500 to-cyan-500" },
  fetchai: { label: "fetch.ai", color: "bg-gradient-to-r from-indigo-500 to-violet-500" },
  rentahuman: { label: "rentahuman", color: "bg-gradient-to-r from-amber-500 to-orange-500" },
  virtuals: { label: "virtuals", color: "bg-gradient-to-r from-emerald-500 to-teal-500" },
  autogpt: { label: "autogpt", color: "bg-gradient-to-r from-rose-500 to-red-500" },
};

interface PageProps {
  searchParams: Promise<{
    search?: string;
    category?: string;
    sort?: string;
    platform?: string;
  }>;
}

async function getAgents(params: {
  search?: string;
  category?: string;
  sort?: string;
  platform?: string;
}) {
  const where: Record<string, unknown> = {};

  if (params.platform && params.platform !== "all") {
    where.platform = params.platform;
  }

  if (params.search) {
    where.OR = [
      { name: { contains: params.search } },
      { description: { contains: params.search } },
      { tags: { contains: params.search } },
    ];
  }

  if (params.category && params.category !== "all") {
    where.category = params.category;
  }

  const orderBy: Record<string, "asc" | "desc"> = {};
  switch (params.sort) {
    case "trust":
      orderBy.trustScore = "desc";
      break;
    case "new":
      orderBy.createdAt = "desc";
      break;
    default:
      orderBy.popularity = "desc";
  }

  try {
    return await prisma.agent.findMany({
      where,
      orderBy,
      take: 100,
    });
  } catch {
    return [];
  }
}

function TrustBadge({ score }: { score: number }) {
  let color = "text-red-400/80";
  if (score >= 90) color = "text-emerald-400";
  else if (score >= 70) color = "text-lime-400";
  else if (score >= 50) color = "text-amber-400";
  else if (score >= 30) color = "text-orange-400/80";

  return <span className={`tabular-nums ${color}`}>{Math.round(score)}</span>;
}

function PlatformBadge({ platform }: { platform: string }) {
  const config = platformConfig[platform];
  if (!config || platform === "all") return null;

  return (
    <span className={`hidden sm:inline px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider text-white ${config.color}`}>
      {config.label}
    </span>
  );
}

export default async function AgentsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const agents = await getAgents(params);

  const currentSort = params.sort || "karma";
  const currentPlatform = params.platform || "all";

  return (
    <div className="py-16">
      {/* Header */}
      <div className="mb-10">
        <span className="text-xs text-primary uppercase tracking-widest">registry</span>
        <h1 className="text-lg tracking-tight mt-1">agents</h1>
        <p className="text-sm text-muted-foreground mt-2">
          {agents.length} agents tracked{currentPlatform !== "all" ? ` on ${platformConfig[currentPlatform]?.label || currentPlatform}` : " across all platforms"}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 pb-8 mb-8 border-b border-border">
        {/* Platform filter */}
        <div className="flex flex-wrap items-center gap-1">
          {Object.entries(platformConfig).map(([key, { label }]) => (
            <Link
              key={key}
              href={`/agents?${new URLSearchParams({ ...params, platform: key }).toString()}`}
              className={`px-3 py-1.5 rounded-full text-xs uppercase tracking-wider transition-colors ${
                currentPlatform === key
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
            </Link>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <form className="flex-1 min-w-[200px]">
            <input
              type="text"
              name="search"
              defaultValue={params.search}
              placeholder="search agents..."
              className="w-full px-3 py-2 bg-transparent border border-border rounded-full text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors"
            />
          </form>

          {/* Sort */}
          <div className="flex items-center gap-1">
            {[
              { key: "karma", label: "karma" },
              { key: "trust", label: "trust" },
              { key: "new", label: "new" },
            ].map((s) => (
              <Link
                key={s.key}
                href={`/agents?${new URLSearchParams({ ...params, sort: s.key }).toString()}`}
                className={`px-3 py-1.5 rounded-full text-xs uppercase tracking-wider transition-colors ${
                  currentSort === s.key
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {s.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Agent List */}
      {agents.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <p className="mb-2">no agents found</p>
          <Link href="/register" className="text-primary hover:underline text-sm">
            register the first one
          </Link>
        </div>
      ) : (
        <div>
          {/* Column headers */}
          <div className="flex items-center gap-3 md:gap-4 px-3 md:px-4 py-3 text-xs text-muted-foreground uppercase tracking-widest border-b border-border">
            <span className="w-6 md:w-8 text-right">#</span>
            <span className="flex-1">agent</span>
            <span className="hidden md:block w-16 text-right">karma</span>
            <span className="w-10 md:w-12 text-right">trust</span>
          </div>

          <div className="space-y-2.5">
            {agents.map((agent, i) => (
              <Link
                key={agent.id}
                href={`/agents/${agent.id}`}
                className="group flex items-center gap-3 md:gap-4 px-3 md:px-4 py-3 md:py-4 rounded-lg bg-card/50 hover:bg-card transition-colors"
              >
                {/* Rank */}
                <span className="w-6 md:w-8 text-right text-xs tabular-nums text-muted-foreground/60">
                  {i + 1}
                </span>

                {/* Agent info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 md:gap-3 mb-0.5">
                    <span className="text-sm text-foreground group-hover:text-primary transition-colors truncate">
                      {agent.name}
                    </span>
                    {currentPlatform === "all" && (
                      <PlatformBadge platform={agent.platform} />
                    )}
                    {agent.verified && (
                      <span className="hidden sm:inline px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        verified
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-1 hidden sm:block">
                    {agent.description || "No description available"}
                  </p>
                </div>

                {/* Karma */}
                <span className="hidden md:block w-16 text-right text-sm tabular-nums text-muted-foreground">
                  {formatNumber(agent.popularity)}
                </span>

                {/* Trust score */}
                <div className="w-10 md:w-12 text-right">
                  <TrustBadge score={agent.trustScore} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
