/**
 * Virtuals Protocol Integration
 *
 * Virtuals is an on-chain AI agent tokenization platform on Base chain.
 * Each agent has its own ERC-20 token with a bonding curve.
 * The VIRTUAL token is the base pair for all agent tokens.
 *
 * API: https://api.virtuals.io/api
 * Docs: https://whitepaper.virtuals.io
 */

const VIRTUALS_API_BASE = "https://api.virtuals.io/api";

export interface VirtualsAgent {
  id: string;
  name: string;
  description: string;
  avatar_url: string | null;
  token_address: string;
  token_symbol: string;
  market_cap: number;
  bonding_curve_progress: number;
  creator_address: string;
  chain: string;
  personality: string | null;
  capabilities: string[];
  status: "active" | "graduated" | "bonding";
  total_holders: number;
  volume_24h: number;
  created_at: string;
  updated_at: string;
}

export interface VirtualsAgentListResponse {
  success: boolean;
  data: VirtualsAgent[];
  total: number;
  page: number;
  limit: number;
}

class VirtualsClient {
  private baseUrl: string;
  private apiKey: string | null;

  constructor() {
    this.baseUrl = process.env.VIRTUALS_API_URL || VIRTUALS_API_BASE;
    this.apiKey = process.env.VIRTUALS_API_KEY || null;
  }

  private async fetch<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "User-Agent": "AgentUber/1.0",
      ...(options.headers as Record<string, string>),
    };

    if (this.apiKey) {
      headers["X-API-Key"] = this.apiKey;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`Virtuals API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get public agents from the Virtuals registry
   */
  async getAgents(options: {
    limit?: number;
    page?: number;
    sort?: "market_cap" | "volume" | "holders" | "newest";
    status?: "active" | "graduated" | "bonding";
    chain?: string;
  } = {}): Promise<VirtualsAgentListResponse> {
    const params = new URLSearchParams({
      limit: String(options.limit || 50),
      page: String(options.page || 1),
      sort: options.sort || "market_cap",
    });

    if (options.status) params.set("status", options.status);
    if (options.chain) params.set("chain", options.chain);

    return this.fetch<VirtualsAgentListResponse>(
      `/agents?${params.toString()}`
    );
  }

  /**
   * Get a specific agent by token address
   */
  async getAgentByToken(tokenAddress: string): Promise<VirtualsAgent> {
    const response = await this.fetch<{ success: boolean; data: VirtualsAgent }>(
      `/agents/${tokenAddress}`
    );
    return response.data;
  }

  /**
   * Search agents by name or description
   */
  async searchAgents(query: string, limit = 25): Promise<VirtualsAgent[]> {
    const params = new URLSearchParams({
      q: query,
      limit: String(limit),
    });

    const response = await this.fetch<{ success: boolean; data: VirtualsAgent[] }>(
      `/agents/search?${params.toString()}`
    );
    return response.data;
  }
}

/**
 * Transform Virtuals agent to our internal format
 */
export function transformVirtualsAgent(agent: VirtualsAgent) {
  return {
    name: agent.name,
    description: agent.description,
    avatar: agent.avatar_url,
    platform: "virtuals" as const,
    platformId: agent.id,
    platformUrl: `https://app.virtuals.io/virtuals/${agent.token_address}`,
    category: agent.status === "graduated" ? "graduated" : "bonding",
    tags: [agent.chain, agent.token_symbol, agent.status].filter(Boolean),
    capabilities: agent.capabilities,
    popularity: agent.total_holders,
    lastActive: new Date(agent.updated_at),
    platformCreatedAt: new Date(agent.created_at),
    verified: agent.status === "graduated" || agent.bonding_curve_progress >= 100,
  };
}

export const virtualsClient = new VirtualsClient();
export default VirtualsClient;
