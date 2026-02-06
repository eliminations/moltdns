/**
 * RentAHuman.ai Integration
 *
 * RentAHuman is a marketplace where AI agents can hire real humans
 * for physical/IRL tasks. Humans register with skills and availability,
 * and AI agents book them for tasks.
 *
 * API Docs: https://rentahuman.ai/api-docs
 */

const RENTAHUMAN_API_BASE = "https://rentahuman.ai/api";

export interface RentAHumanProfile {
  id: string;
  name: string;
  email: string;
  skills: string[];
  hourly_rate: number;
  crypto_wallets: { chain: string; address: string }[];
  availability: string;
  location: string | null;
  languages: string[];
  bio: string | null;
  avatar_url: string | null;
  rating: number;
  completed_tasks: number;
  created_at: string;
  updated_at: string;
}

export interface RentAHumanListResponse {
  success: boolean;
  humans: RentAHumanProfile[];
  total: number;
  offset: number;
  limit: number;
  has_more: boolean;
}

export interface RentAHumanBooking {
  id: string;
  human_id: string;
  agent_id: string;
  task_title: string;
  status: "pending" | "accepted" | "in_progress" | "completed" | "cancelled";
  start_time: string;
  estimated_hours: number;
  created_at: string;
}

class RentAHumanClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.RENTAHUMAN_API_URL || RENTAHUMAN_API_BASE;
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
      throw new Error(`RentAHuman API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * List available humans
   */
  async getHumans(options: {
    skill?: string;
    minRate?: number;
    maxRate?: number;
    name?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<RentAHumanListResponse> {
    const params = new URLSearchParams({
      limit: String(options.limit || 50),
      offset: String(options.offset || 0),
    });

    if (options.skill) params.set("skill", options.skill);
    if (options.minRate) params.set("minRate", String(options.minRate));
    if (options.maxRate) params.set("maxRate", String(options.maxRate));
    if (options.name) params.set("name", options.name);

    return this.fetch<RentAHumanListResponse>(
      `/humans?${params.toString()}`
    );
  }

  /**
   * Get a specific human profile by ID
   */
  async getHumanById(humanId: string): Promise<RentAHumanProfile> {
    return this.fetch<RentAHumanProfile>(`/humans/${humanId}`);
  }

  /**
   * List bookings (requires auth)
   */
  async getBookings(options: {
    humanId?: string;
    agentId?: string;
    status?: string;
    limit?: number;
  } = {}): Promise<{ bookings: RentAHumanBooking[]; total: number }> {
    const params = new URLSearchParams({
      limit: String(options.limit || 25),
    });

    if (options.humanId) params.set("humanId", options.humanId);
    if (options.agentId) params.set("agentId", options.agentId);
    if (options.status) params.set("status", options.status);

    return this.fetch(`/bookings?${params.toString()}`);
  }
}

/**
 * Transform RentAHuman profile to our internal agent format
 * Humans are treated as "agents" in the registry — human agents for hire
 */
export function transformRentAHumanAgent(human: RentAHumanProfile) {
  return {
    name: human.name,
    description: human.bio || `Human agent available for hire — ${human.skills.slice(0, 3).join(", ")}`,
    avatar: human.avatar_url,
    platform: "rentahuman" as const,
    platformId: human.id,
    platformUrl: `https://rentahuman.ai/humans/${human.id}`,
    category: human.skills[0] || "general",
    tags: human.skills.slice(0, 5),
    capabilities: human.skills,
    popularity: human.completed_tasks,
    lastActive: new Date(human.updated_at),
    platformCreatedAt: new Date(human.created_at),
    verified: human.crypto_wallets.length > 0,
  };
}

export const rentahumanClient = new RentAHumanClient();
export default RentAHumanClient;
