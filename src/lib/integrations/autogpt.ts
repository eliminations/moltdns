/**
 * AutoGPT Marketplace Integration
 *
 * AutoGPT is an autonomous AI agent platform with a marketplace
 * where users can publish and discover agents built with the
 * block-based agent builder.
 *
 * Marketplace: https://platform.agpt.co/marketplace
 * Docs: https://docs.agpt.co
 */

const AUTOGPT_API_BASE = "https://platform.agpt.co/api";

export interface AutoGPTAgent {
  id: string;
  name: string;
  description: string;
  author: string;
  author_id: string;
  version: string;
  keywords: string[];
  categories: string[];
  downloads: number;
  rating: number;
  review_count: number;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
  icon_url: string | null;
}

export interface AutoGPTMarketplaceResponse {
  success: boolean;
  agents: AutoGPTAgent[];
  total: number;
  page: number;
  per_page: number;
  has_next: boolean;
}

class AutoGPTClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.AUTOGPT_API_URL || AUTOGPT_API_BASE;
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
      throw new Error(`AutoGPT API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get agents from the marketplace
   */
  async getMarketplaceAgents(options: {
    page?: number;
    per_page?: number;
    sort?: "popular" | "newest" | "top_rated" | "featured";
    category?: string;
    search?: string;
  } = {}): Promise<AutoGPTMarketplaceResponse> {
    const params = new URLSearchParams({
      page: String(options.page || 1),
      per_page: String(options.per_page || 50),
      sort: options.sort || "popular",
    });

    if (options.category) params.set("category", options.category);
    if (options.search) params.set("search", options.search);

    return this.fetch<AutoGPTMarketplaceResponse>(
      `/marketplace/agents?${params.toString()}`
    );
  }

  /**
   * Get a specific agent by ID
   */
  async getAgent(agentId: string): Promise<AutoGPTAgent> {
    const response = await this.fetch<{ success: boolean; agent: AutoGPTAgent }>(
      `/marketplace/agents/${agentId}`
    );
    return response.agent;
  }

  /**
   * Search marketplace agents
   */
  async searchAgents(query: string, limit = 25): Promise<AutoGPTAgent[]> {
    const response = await this.getMarketplaceAgents({
      search: query,
      per_page: limit,
    });
    return response.agents;
  }
}

/**
 * Transform AutoGPT agent to our internal format
 */
export function transformAutoGPTAgent(agent: AutoGPTAgent) {
  return {
    name: agent.name,
    description: agent.description,
    avatar: agent.icon_url,
    platform: "autogpt" as const,
    platformId: agent.id,
    platformUrl: `https://platform.agpt.co/marketplace/agent/${agent.id}`,
    category: agent.categories[0] || "general",
    tags: [...agent.categories, ...agent.keywords].slice(0, 5),
    capabilities: agent.keywords,
    popularity: agent.downloads,
    lastActive: new Date(agent.updated_at),
    platformCreatedAt: new Date(agent.created_at),
    verified: agent.is_featured,
  };
}

export const autogptClient = new AutoGPTClient();
export default AutoGPTClient;
