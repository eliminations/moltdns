/**
 * Olas (Autonolas) Integration
 *
 * Olas is an on-chain protocol for creating and managing
 * autonomous agent services. Agents are represented as NFTs
 * and operate via the Olas protocol on multiple chains.
 *
 * Registry: https://registry.olas.network
 * Docs: https://docs.autonolas.network
 */

const OLAS_API_BASE = "https://registry.olas.network/api";

export interface OlasAgent {
  id: string;
  name: string;
  description: string;
  service_id: number;
  chain: string;
  owner_address: string;
  agent_hash: string;
  code_uri: string;
  slots: number;
  bond: number;
  state: "active" | "registered" | "deployed" | "terminated";
  components: number;
  created_at: string;
  updated_at: string;
}

export interface OlasListResponse {
  success: boolean;
  data: OlasAgent[];
  total: number;
  offset: number;
  limit: number;
}

class OlasClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.OLAS_API_URL || OLAS_API_BASE;
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

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`Olas API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get agent services from Olas registry
   */
  async getAgents(options: {
    limit?: number;
    offset?: number;
    chain?: string;
    state?: string;
  } = {}): Promise<OlasListResponse> {
    const params = new URLSearchParams({
      limit: String(options.limit || 50),
      offset: String(options.offset || 0),
    });

    if (options.chain) params.set("chain", options.chain);
    if (options.state) params.set("state", options.state);

    return this.fetch<OlasListResponse>(
      `/services?${params.toString()}`
    );
  }

  /**
   * Get a specific service by ID
   */
  async getAgent(serviceId: string): Promise<OlasAgent> {
    const response = await this.fetch<{ success: boolean; data: OlasAgent }>(
      `/services/${serviceId}`
    );
    if (!response.data) {
      throw new Error(`Olas service ${serviceId} not found`);
    }
    return response.data;
  }

  /**
   * Search services by keyword
   */
  async searchAgents(query: string, limit = 25): Promise<OlasAgent[]> {
    const params = new URLSearchParams({
      search: query,
      limit: String(limit),
    });

    const response = await this.fetch<OlasListResponse>(
      `/services?${params.toString()}`
    );
    return response.data ?? [];
  }
}

/**
 * Transform Olas agent to our internal format
 */
export function transformOlasAgent(agent: OlasAgent) {
  return {
    name: agent.name || `Olas Service #${agent.service_id}`,
    description: agent.description,
    avatar: null,
    platform: "olas" as const,
    platformId: agent.id,
    platformUrl: `https://registry.olas.network/services/${agent.service_id}`,
    category: agent.chain || "on-chain",
    tags: [agent.chain, agent.state].filter(Boolean),
    capabilities: [
      agent.code_uri ? "open-source" : "closed-source",
      agent.chain,
      `${agent.components} components`,
    ].filter(Boolean),
    popularity: agent.slots,
    lastActive: new Date(agent.updated_at),
    platformCreatedAt: new Date(agent.created_at),
    verified: agent.state === "active" || agent.state === "deployed",
  };
}

export const olasClient = new OlasClient();
export default OlasClient;
