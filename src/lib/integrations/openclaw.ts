/**
 * OpenClaw API Integration
 *
 * OpenClaw is an open-source autonomous AI personal assistant
 * Docs: https://docs.openclaw.ai/start/getting-started
 * GitHub: https://github.com/openclaw/openclaw
 *
 * OpenClaw uses Model Context Protocol (MCP) for skills/integrations
 */

const OPENCLAW_API_BASE = "https://api.openclaw.ai/v1";

export interface OpenClawAgent {
  id: string;
  name: string;
  description: string;
  avatar: string;
  model_provider: string; // anthropic, openai, openrouter, local
  model_name: string;
  skills: OpenClawSkill[];
  channels: string[]; // telegram, discord, slack, etc.
  memory_enabled: boolean;
  created_at: string;
  updated_at: string;
  owner_id: string;
  is_public: boolean;
  usage_stats: {
    total_messages: number;
    active_users: number;
    uptime_percentage: number;
  };
}

export interface OpenClawSkill {
  id: string;
  name: string;
  description: string;
  category: string;
  enabled: boolean;
  config?: Record<string, unknown>;
}

export interface OpenClawRegistry {
  skills: OpenClawSkill[];
  total: number;
  categories: string[];
}

export interface OpenClawApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

class OpenClawClient {
  private apiKey: string | null;
  private baseUrl: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.OPENCLAW_API_KEY || null;
    this.baseUrl = process.env.OPENCLAW_API_URL || OPENCLAW_API_BASE;
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
      throw new Error(`OpenClaw API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get public agents from OpenClaw registry
   */
  async getPublicAgents(options: {
    limit?: number;
    offset?: number;
    category?: string;
    sort?: "popular" | "newest" | "active";
  } = {}): Promise<OpenClawApiResponse<OpenClawAgent[]>> {
    const params = new URLSearchParams({
      limit: String(options.limit || 50),
      offset: String(options.offset || 0),
      sort: options.sort || "popular",
    });

    if (options.category) {
      params.set("category", options.category);
    }

    return this.fetch<OpenClawApiResponse<OpenClawAgent[]>>(
      `/registry/agents?${params.toString()}`
    );
  }

  /**
   * Get agent by ID
   */
  async getAgent(agentId: string): Promise<OpenClawAgent> {
    const response = await this.fetch<OpenClawApiResponse<OpenClawAgent>>(
      `/agents/${agentId}`
    );

    if (!response.success) {
      throw new Error(response.error || "Failed to fetch agent");
    }

    return response.data;
  }

  /**
   * Get available skills from the MCP registry
   */
  async getSkillsRegistry(category?: string): Promise<OpenClawRegistry> {
    const params = category ? `?category=${category}` : "";
    const response = await this.fetch<OpenClawApiResponse<OpenClawRegistry>>(
      `/registry/skills${params}`
    );
    return response.data;
  }

  /**
   * Search agents by name or skill
   */
  async searchAgents(query: string, limit = 25): Promise<OpenClawAgent[]> {
    const params = new URLSearchParams({
      q: query,
      limit: String(limit),
    });

    const response = await this.fetch<OpenClawApiResponse<OpenClawAgent[]>>(
      `/registry/agents/search?${params.toString()}`
    );
    return response.data;
  }

  /**
   * Get agent health/uptime stats
   */
  async getAgentHealth(agentId: string): Promise<{
    status: "online" | "offline" | "degraded";
    uptime_percentage: number;
    last_seen: string;
    response_time_ms: number;
  }> {
    const response = await this.fetch<
      OpenClawApiResponse<{
        status: "online" | "offline" | "degraded";
        uptime_percentage: number;
        last_seen: string;
        response_time_ms: number;
      }>
    >(`/agents/${agentId}/health`);
    return response.data;
  }

  /**
   * Get skill categories
   */
  async getCategories(): Promise<string[]> {
    const response = await this.fetch<OpenClawApiResponse<string[]>>(
      `/registry/categories`
    );
    return response.data;
  }
}

/**
 * Transform OpenClaw agent to our internal format
 */
export function transformOpenClawAgent(agent: OpenClawAgent) {
  const skillCategories = [...new Set(agent.skills.map((s) => s.category))];

  return {
    name: agent.name,
    description: agent.description,
    avatar: agent.avatar,
    platform: "openclaw" as const,
    platformId: agent.id,
    platformUrl: `https://openclaw.ai/agent/${agent.id}`,
    category: skillCategories[0] || "general",
    tags: skillCategories,
    capabilities: agent.skills.map((s) => s.name),
    popularity: agent.usage_stats.total_messages,
    lastActive: new Date(agent.updated_at),
    platformCreatedAt: new Date(agent.created_at),
    verified: agent.usage_stats.uptime_percentage > 95,
  };
}

export const openclawClient = new OpenClawClient();
export default OpenClawClient;
