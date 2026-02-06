/**
 * CrewAI Integration
 *
 * CrewAI is a multi-agent orchestration framework for building
 * and deploying teams of AI agents (crews).
 *
 * Enterprise: https://app.crewai.com
 * Docs: https://docs.crewai.com
 */

const CREWAI_API_BASE = "https://app.crewai.com/api";

export interface CrewAIAgent {
  id: string;
  name: string;
  description: string;
  role: string;
  goal: string;
  backstory: string;
  tools: string[];
  crew_id: string;
  crew_name: string;
  llm_provider: string;
  is_public: boolean;
  runs: number;
  rating: number;
  review_count: number;
  created_at: string;
  updated_at: string;
  icon_url: string | null;
}

export interface CrewAIListResponse {
  success: boolean;
  agents: CrewAIAgent[];
  total: number;
  page: number;
  per_page: number;
}

class CrewAIClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.CREWAI_API_URL || CREWAI_API_BASE;
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
      throw new Error(`CrewAI API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get public agents from CrewAI marketplace
   */
  async getPublicAgents(options: {
    limit?: number;
    page?: number;
    sort?: "popular" | "recent" | "rating";
  } = {}): Promise<CrewAIListResponse> {
    const params = new URLSearchParams({
      per_page: String(options.limit || 50),
      page: String(options.page || 1),
      sort: options.sort || "popular",
      is_public: "true",
    });

    return this.fetch<CrewAIListResponse>(
      `/marketplace/agents?${params.toString()}`
    );
  }

  /**
   * Get a specific agent by ID
   */
  async getAgent(agentId: string): Promise<CrewAIAgent> {
    const response = await this.fetch<{ success: boolean; agent: CrewAIAgent }>(
      `/marketplace/agents/${agentId}`
    );
    if (!response.agent) {
      throw new Error(`CrewAI agent ${agentId} not found`);
    }
    return response.agent;
  }

  /**
   * Search agents by keyword
   */
  async searchAgents(query: string, limit = 25): Promise<CrewAIAgent[]> {
    const params = new URLSearchParams({
      search: query,
      per_page: String(limit),
      is_public: "true",
    });

    const response = await this.fetch<CrewAIListResponse>(
      `/marketplace/agents?${params.toString()}`
    );
    return response.agents ?? [];
  }
}

/**
 * Transform CrewAI agent to our internal format
 */
export function transformCrewAIAgent(agent: CrewAIAgent) {
  return {
    name: agent.name,
    description: agent.description || agent.goal,
    avatar: agent.icon_url,
    platform: "crewai" as const,
    platformId: agent.id,
    platformUrl: `https://app.crewai.com/marketplace/agent/${agent.id}`,
    category: agent.role || "automation",
    tags: [agent.role, agent.crew_name, ...agent.tools.slice(0, 3)].filter(Boolean),
    capabilities: agent.tools,
    popularity: agent.runs,
    lastActive: new Date(agent.updated_at),
    platformCreatedAt: new Date(agent.created_at),
    verified: agent.runs > 100 || agent.rating >= 4.5,
  };
}

export const crewaiClient = new CrewAIClient();
export default CrewAIClient;
