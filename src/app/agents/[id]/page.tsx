import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatDate, formatNumber, parseTags } from "@/lib/utils";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getAgent(id: string) {
  try {
    const agent = await prisma.agent.findUnique({
      where: { id },
      include: {
        reviews: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });
    return agent;
  } catch {
    return null;
  }
}

function TrustBadge({ score }: { score: number }) {
  let color = "text-red-400";
  let label = "untrusted";
  if (score >= 90) { color = "text-emerald-400"; label = "highly trusted"; }
  else if (score >= 70) { color = "text-lime-400"; label = "trusted"; }
  else if (score >= 50) { color = "text-amber-400"; label = "moderate"; }
  else if (score >= 30) { color = "text-orange-400/80"; label = "low trust"; }

  return (
    <div className="text-center">
      <div className={`text-4xl font-bold tabular-nums ${color}`}>{Math.round(score)}</div>
      <div className="text-sm text-muted-foreground mt-1">{label}</div>
    </div>
  );
}

function ScoreBar({ label, value, weight }: { label: string; value: number; weight: string }) {
  let color = "bg-red-400";
  if (value >= 80) color = "bg-emerald-400";
  else if (value >= 60) color = "bg-lime-400";
  else if (value >= 40) color = "bg-amber-400";
  else if (value >= 20) color = "bg-orange-400";

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="tabular-nums">{Math.round(value)} <span className="text-muted-foreground/60">({weight})</span></span>
      </div>
      <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

export default async function AgentProfilePage({ params }: PageProps) {
  const { id } = await params;
  const agent = await getAgent(id);

  if (!agent) {
    notFound();
  }

  const tags = parseTags(agent.tags);
  const capabilities = parseTags(agent.capabilities);

  return (
    <div className="py-10 space-y-8">
      {/* Back link */}
      <Link href="/agents" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
        ← back to agents
      </Link>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header */}
          <div className="p-6 rounded-lg border border-border bg-card">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl font-semibold tracking-tight">{agent.name}</h1>
                  <span className="px-2 py-0.5 rounded text-xs bg-primary/15 text-primary border border-primary/20">
                    {agent.platform}
                  </span>
                  {agent.verified && (
                    <span className="px-2 py-0.5 rounded text-xs bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                      verified
                    </span>
                  )}
                </div>
                {agent.category && (
                  <div className="text-sm text-muted-foreground">{agent.category}</div>
                )}
              </div>
              {agent.platformUrl && (
                <a
                  href={agent.platformUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded border border-border text-sm text-muted-foreground hover:text-foreground hover:border-muted-foreground/30 transition-colors"
                >
                  view on {agent.platform} →
                </a>
              )}
            </div>

            <p className="text-muted-foreground mb-6">
              {agent.description || "No description available"}
            </p>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 py-4 border-t border-border">
              <div>
                <div className="text-lg font-semibold tabular-nums text-primary/80">{formatNumber(agent.popularity)}</div>
                <div className="text-xs text-muted-foreground">karma</div>
              </div>
              <div>
                <div className="text-lg font-semibold">{formatDate(agent.lastActive)}</div>
                <div className="text-xs text-muted-foreground">last active</div>
              </div>
              <div>
                <div className="text-lg font-semibold">{formatDate(agent.platformCreatedAt)}</div>
                <div className="text-xs text-muted-foreground">created</div>
              </div>
            </div>
          </div>

          {/* Tags & Capabilities */}
          {(tags.length > 0 || capabilities.length > 0) && (
            <div className="p-6 rounded-lg border border-border bg-card">
              {tags.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-xs text-muted-foreground uppercase tracking-wider mb-2">tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <span key={tag} className="px-2 py-1 rounded text-xs bg-secondary text-secondary-foreground">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {capabilities.length > 0 && (
                <div>
                  <h3 className="text-xs text-muted-foreground uppercase tracking-wider mb-2">capabilities</h3>
                  <div className="flex flex-wrap gap-2">
                    {capabilities.map((cap) => (
                      <span key={cap} className="px-2 py-1 rounded text-xs bg-primary/15 text-primary">
                        {cap}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Reviews */}
          <div className="p-6 rounded-lg border border-border bg-card">
            <h2 className="font-semibold mb-4">reviews</h2>
            {agent.reviews.length === 0 ? (
              <p className="text-muted-foreground text-sm">no reviews yet</p>
            ) : (
              <div className="space-y-4">
                {agent.reviews.map((review) => (
                  <div key={review.id} className="p-3 rounded-md bg-secondary border border-border">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <span key={i} className={i < review.rating ? "text-amber-400" : "text-muted-foreground/30"}>
                            ★
                          </span>
                        ))}
                      </div>
                      <span className="text-xs text-muted-foreground">{formatDate(review.createdAt)}</span>
                    </div>
                    {review.comment && (
                      <p className="text-sm text-muted-foreground">{review.comment}</p>
                    )}
                    {review.author && (
                      <p className="text-xs text-muted-foreground/60 mt-2">— {review.author}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar - Trust Score */}
        <div className="space-y-6">
          <div className="p-6 rounded-lg border border-border bg-card sticky top-20">
            <h2 className="font-semibold mb-6 text-center text-xs uppercase tracking-wider text-muted-foreground">trust score</h2>

            <div className="mb-8">
              <TrustBadge score={agent.trustScore} />
            </div>

            <div className="space-y-4">
              <ScoreBar label="verification" value={agent.verificationScore} weight="25%" />
              <ScoreBar label="activity" value={agent.activityConsistency} weight="20%" />
              <ScoreBar label="community" value={agent.communityFeedback} weight="20%" />
              <ScoreBar label="code audit" value={agent.codeAuditScore} weight="15%" />
              <ScoreBar label="transparency" value={agent.transparencyScore} weight="20%" />
            </div>

            <div className="mt-6 pt-6 border-t border-border">
              {agent.verified ? (
                <div className="flex items-center gap-2 p-3 rounded-md bg-emerald-500/10 border border-emerald-500/20">
                  <span className="text-emerald-400">✓</span>
                  <div>
                    <div className="text-sm font-medium text-emerald-400">verified on-chain</div>
                    <div className="text-xs text-muted-foreground">ownership confirmed</div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 p-3 rounded-md bg-amber-500/10 border border-amber-500/20">
                  <span className="text-amber-400">!</span>
                  <div>
                    <div className="text-sm font-medium text-amber-400">unverified</div>
                    <div className="text-xs text-muted-foreground">ownership not confirmed</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
