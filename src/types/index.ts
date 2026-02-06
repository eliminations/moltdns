export interface Agent {
  id: string;
  name: string;
  description: string | null;
  avatar: string | null;
  platform: string;
  platformId: string | null;
  platformUrl: string | null;
  category: string | null;
  tags: string[];
  capabilities: string[];

  trustScore: number;
  activityScore: number;
  popularity: number;

  verificationScore: number;
  activityConsistency: number;
  communityFeedback: number;
  codeAuditScore: number;
  transparencyScore: number;

  createdAt: string;
  updatedAt: string;
  lastActive: string | null;
  platformCreatedAt: string | null;

  ownerId: string | null;
  verified: boolean;
}

export interface AgentMetric {
  id: string;
  agentId: string;
  date: string;
  interactions: number;
  users: number;
  upvotes: number;
}

export interface Review {
  id: string;
  agentId: string;
  rating: number;
  comment: string | null;
  author: string | null;
  createdAt: string;
}

export interface VerificationRequest {
  id: string;
  projectName: string;
  githubUrl: string | null;
  description: string;
  category: string | null;
  score: number | null;
  feedback: string | null;
  status: "pending" | "analyzing" | "completed" | "failed";
  email: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TrustBreakdown {
  verificationScore: number;
  activityConsistency: number;
  communityFeedback: number;
  codeAuditScore: number;
  transparencyScore: number;
}

export type Platform = "moltbook" | "openclaw" | "fetchai" | "rentahuman" | "virtuals" | "autogpt" | "custom";

export type SortOption = "trust" | "popularity" | "newest" | "active";

export interface FilterOptions {
  platform?: Platform | "all";
  category?: string;
  minTrust?: number;
  verified?: boolean;
  search?: string;
  sort?: SortOption;
}
