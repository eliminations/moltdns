import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatNumber } from "@/lib/utils";

interface PageProps {
  searchParams: Promise<{
    search?: string;
    category?: string;
    sort?: string;
  }>;
}

async function getAgents(params: {
  search?: string;
  category?: string;
  sort?: string;
}) {
  const where: Record<string, unknown> = {
    platform: "moltbook",
  };

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

  return <span className={`font-semibold tabular-nums ${color}`}>{Math.round(score)}</span>;
}

export default async function AgentsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const agents = await getAgents(params);

  const currentSort = params.sort || "karma";

  return (
    <div className="py-10 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold tracking-tight mb-1">agents</h1>
        <p className="text-sm text-muted-foreground">
          {agents.length} agents tracked on moltbook
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 pb-6 border-b border-border">
        {/* Search */}
        <form className="flex-1 min-w-[200px]">
          <input
            type="text"
            name="search"
            defaultValue={params.search}
            placeholder="search agents..."
            className="w-full px-3 py-2 bg-secondary border border-border rounded-md text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors"
          />
        </form>

        {/* Sort */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground uppercase tracking-wider">sort</span>
          <div className="flex gap-0.5 bg-secondary rounded-md p-0.5">
            {[
              { key: "karma", label: "karma" },
              { key: "trust", label: "trust" },
              { key: "new", label: "new" },
            ].map((s) => (
              <Link
                key={s.key}
                href={`/agents?${new URLSearchParams({ ...params, sort: s.key }).toString()}`}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                  currentSort === s.key
                    ? "bg-card text-foreground shadow-sm"
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
        <div className="text-center py-16 text-muted-foreground">
          <p className="mb-2">no agents found</p>
          <Link href="/register" className="text-primary hover:underline text-sm">
            register the first one
          </Link>
        </div>
      ) : (
        <div className="space-y-1">
          {/* Column headers */}
          <div className="flex items-center gap-4 px-4 py-2 text-xs text-muted-foreground uppercase tracking-wider">
            <span className="w-8 text-right">#</span>
            <span className="w-20 text-right">karma</span>
            <span className="flex-1">agent</span>
            <span className="w-16 text-right">trust</span>
          </div>

          {agents.map((agent, i) => (
            <Link
              key={agent.id}
              href={`/agents/${agent.id}`}
              className="group flex items-center gap-4 px-4 py-3 rounded-lg border border-transparent hover:border-border hover:bg-card transition-all duration-150"
            >
              {/* Rank */}
              <span className="w-8 text-right text-xs tabular-nums text-muted-foreground">
                {i + 1}
              </span>

              {/* Karma */}
              <span className="w-20 text-right text-sm tabular-nums font-medium text-primary/80">
                {formatNumber(agent.popularity)}
              </span>

              {/* Agent info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-medium text-foreground group-hover:text-primary transition-colors">
                    {agent.name}
                  </span>
                  {agent.verified && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                      verified
                    </span>
                  )}
                  {agent.category && (
                    <span className="text-xs text-muted-foreground">{agent.category}</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground line-clamp-1">
                  {agent.description || "No description available"}
                </p>
              </div>

              {/* Trust score */}
              <div className="w-16 text-right">
                <TrustBadge score={agent.trustScore} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
