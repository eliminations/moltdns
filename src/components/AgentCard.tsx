"use client";

import Link from "next/link";
import Image from "next/image";
import { cn, formatDate, formatNumber, parseTags } from "@/lib/utils";
import { TrustScore, TrustBadge } from "./TrustScore";
import { Bot, ExternalLink, CheckCircle, Clock, Users, TrendingUp } from "lucide-react";

interface AgentCardProps {
  agent: {
    id: string;
    name: string;
    description: string | null;
    avatar: string | null;
    platform: string;
    platformUrl: string | null;
    category: string | null;
    tags: string;
    trustScore: number;
    popularity: number;
    verified: boolean;
    lastActive: Date | string | null;
  };
  variant?: "default" | "compact";
}

const platformColors: Record<string, string> = {
  moltbook: "from-purple-500 to-pink-500",
  openclaw: "from-blue-500 to-cyan-500",
  custom: "from-gray-500 to-gray-600",
};

const platformLabels: Record<string, string> = {
  moltbook: "Moltbook",
  openclaw: "OpenClaw",
  custom: "Custom",
};

export function AgentCard({ agent, variant = "default" }: AgentCardProps) {
  const tags = parseTags(agent.tags);

  if (variant === "compact") {
    return (
      <Link
        href={`/agents/${agent.id}`}
        className="group flex items-center gap-4 p-4 rounded-xl glass glass-hover transition-all"
      >
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          {agent.avatar ? (
            <Image
              src={agent.avatar}
              alt={agent.name}
              width={48}
              height={48}
              className="rounded-lg object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500/20 to-cyan-500/20 flex items-center justify-center">
              <Bot className="w-6 h-6 text-muted-foreground" />
            </div>
          )}
          {agent.verified && (
            <CheckCircle className="absolute -bottom-1 -right-1 w-4 h-4 text-green-400 fill-background" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold truncate group-hover:text-primary transition-colors">
              {agent.name}
            </h3>
            <span
              className={cn(
                "px-2 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r text-white",
                platformColors[agent.platform] || platformColors.custom
              )}
            >
              {platformLabels[agent.platform] || agent.platform}
            </span>
          </div>
          <p className="text-sm text-muted-foreground truncate">{agent.description}</p>
        </div>

        {/* Trust Score */}
        <TrustScore score={agent.trustScore} size="sm" />
      </Link>
    );
  }

  return (
    <Link
      href={`/agents/${agent.id}`}
      className="group block p-6 rounded-2xl glass glass-hover gradient-border transition-all hover:scale-[1.02]"
    >
      <div className="flex items-start justify-between mb-4">
        {/* Avatar & Name */}
        <div className="flex items-center gap-3">
          <div className="relative">
            {agent.avatar ? (
              <Image
                src={agent.avatar}
                alt={agent.name}
                width={56}
                height={56}
                className="rounded-xl object-cover"
              />
            ) : (
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500/20 to-cyan-500/20 flex items-center justify-center">
                <Bot className="w-7 h-7 text-muted-foreground" />
              </div>
            )}
            {agent.verified && (
              <CheckCircle className="absolute -bottom-1 -right-1 w-5 h-5 text-green-400 fill-background" />
            )}
          </div>
          <div>
            <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
              {agent.name}
            </h3>
            <span
              className={cn(
                "inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r text-white",
                platformColors[agent.platform] || platformColors.custom
              )}
            >
              {platformLabels[agent.platform] || agent.platform}
            </span>
          </div>
        </div>

        {/* Trust Score */}
        <TrustScore score={agent.trustScore} size="sm" />
      </div>

      {/* Description */}
      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
        {agent.description || "No description available"}
      </p>

      {/* Tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="px-2 py-1 rounded-md text-xs bg-muted/50 text-muted-foreground"
            >
              {tag}
            </span>
          ))}
          {tags.length > 3 && (
            <span className="px-2 py-1 rounded-md text-xs bg-muted/50 text-muted-foreground">
              +{tags.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-1">
          <TrendingUp className="w-4 h-4" />
          <span>{formatNumber(agent.popularity)}</span>
        </div>
        {agent.lastActive && (
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{formatDate(agent.lastActive)}</span>
          </div>
        )}
        {agent.platformUrl && (
          <div className="flex items-center gap-1 ml-auto">
            <ExternalLink className="w-4 h-4" />
          </div>
        )}
      </div>
    </Link>
  );
}

export function AgentCardSkeleton() {
  return (
    <div className="p-6 rounded-2xl glass animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-xl bg-muted/50" />
          <div>
            <div className="h-5 w-32 bg-muted/50 rounded mb-2" />
            <div className="h-4 w-20 bg-muted/50 rounded" />
          </div>
        </div>
        <div className="w-12 h-12 rounded-full bg-muted/50" />
      </div>
      <div className="h-4 w-full bg-muted/50 rounded mb-2" />
      <div className="h-4 w-2/3 bg-muted/50 rounded mb-4" />
      <div className="flex gap-2">
        <div className="h-6 w-16 bg-muted/50 rounded" />
        <div className="h-6 w-16 bg-muted/50 rounded" />
        <div className="h-6 w-16 bg-muted/50 rounded" />
      </div>
    </div>
  );
}
