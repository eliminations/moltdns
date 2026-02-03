/**
 * Moltbook API Integration
 *
 * Official API: https://www.moltbook.com/skill.md
 * Moltbook is a social platform for AI agents with Reddit-like interface
 *
 * IMPORTANT: Always use www.moltbook.com - without www will strip auth headers!
 */

const MOLTBOOK_API_BASE = "https://www.moltbook.com/api/v1";

export interface MoltbookAgent {
  id: string;
  name: string;
  description: string;
  avatar_url: string;
  created_at: string;
  karma: number;
  post_count: number;
  comment_count: number;
  submolts: string[];
  is_verified: boolean;
  last_active: string;
  capabilities: string[];
  owner_id?: string;
}

export interface MoltbookAgentProfile {
  id: string;
  name: string;
  description: string | null;
  karma: number;
  created_at: string;
  last_active: string | null;
  is_active: boolean;
  is_claimed: boolean;
  follower_count: number;
  following_count: number;
  avatar_url: string | null;
  owner: {
    x_handle: string | null;
    x_name: string | null;
    x_avatar: string | null;
    x_bio: string | null;
    x_follower_count: number;
    x_following_count: number;
    x_verified: boolean;
  } | null;
  recentPosts: MoltbookPost[];
}

export interface MoltbookPost {
  id: string;
  title: string;
  content: string;
  url?: string;
  author: {
    id: string;
    name: string;
    avatar_url?: string;
  };
  submolt: {
    id: string;
    name: string;
    display_name?: string;
  };
  upvotes: number;
  downvotes: number;
  comment_count: number;
  created_at: string;
}

export interface MoltbookComment {
  id: string;
  content: string;
  author: {
    id: string;
    name: string;
    avatar_url?: string;
  };
  upvotes: number;
  downvotes: number;
  created_at: string;
  post_id: string;
}

export interface MoltbookSubmolt {
  id: string;
  name: string;
  display_name?: string;
  description: string;
  subscriber_count: number;
  created_at: string;
  last_activity_at?: string;
  featured_at?: string | null;
  created_by?: string | null;
}

export interface MoltbookApiResponse<T> {
  success: boolean;
  data?: T;
  posts?: T;
  count?: number;
  has_more?: boolean;
  next_offset?: number;
  meta?: {
    total: number;
    page: number;
    limit: number;
  };
}

export interface MoltbookPostsResponse {
  success: boolean;
  posts: MoltbookPost[];
  count: number;
  has_more: boolean;
  next_offset: number;
}

class MoltbookClient {
  private apiKey: string | null;
  private baseUrl: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.MOLTBOOK_API_KEY || null;
    this.baseUrl = process.env.MOLTBOOK_API_URL || MOLTBOOK_API_BASE;
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
      headers["Authorization"] = `Bearer ${this.apiKey}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`Moltbook API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Extract unique agents from posts
   * The Moltbook API doesn't have a dedicated agents endpoint,
   * so we extract agents from post authors
   */
  async getAgentsFromPosts(options: {
    limit?: number;
  } = {}): Promise<{ agents: MoltbookAgent[]; postCount: number }> {
    const postLimit = Math.min(options.limit || 100, 200);
    const allPosts: MoltbookPost[] = [];
    let offset = 0;
    const batchSize = 50;

    // Fetch posts in batches to get more authors
    while (allPosts.length < postLimit) {
      const response = await this.getPosts({
        sort: "new",
        limit: batchSize,
        offset,
      });
      allPosts.push(...response.posts);
      if (!response.has_more || response.posts.length === 0) break;
      offset += batchSize;
    }

    // Extract unique agents from post authors
    const agentMap = new Map<string, MoltbookAgent>();

    for (const post of allPosts) {
      const authorId = post.author.id;
      if (!agentMap.has(authorId)) {
        // Create agent from post author data
        agentMap.set(authorId, {
          id: authorId,
          name: post.author.name,
          description: `Agent on Moltbook`,
          avatar_url: post.author.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(post.author.name)}`,
          created_at: post.created_at,
          karma: post.upvotes - post.downvotes,
          post_count: 1,
          comment_count: 0,
          submolts: [post.submolt.name],
          is_verified: false,
          last_active: post.created_at,
          capabilities: [],
        });
      } else {
        // Update existing agent's stats
        const agent = agentMap.get(authorId)!;
        agent.karma += post.upvotes - post.downvotes;
        agent.post_count += 1;
        if (!agent.submolts.includes(post.submolt.name)) {
          agent.submolts.push(post.submolt.name);
        }
        // Update last_active if this post is newer
        if (new Date(post.created_at) > new Date(agent.last_active)) {
          agent.last_active = post.created_at;
        }
      }
    }

    return {
      agents: Array.from(agentMap.values()).sort((a, b) => b.karma - a.karma),
      postCount: allPosts.length,
    };
  }

  /**
   * Get agent profile by name (returns real karma, description, owner info)
   */
  async getAgentProfile(name: string): Promise<MoltbookAgentProfile> {
    const response = await this.fetch<{ success: boolean; agent: MoltbookAgentProfile; recentPosts: MoltbookPost[] }>(
      `/agents/profile?name=${encodeURIComponent(name)}`
    );
    if (!response.agent) {
      throw new Error(`Agent ${name} not found`);
    }
    return { ...response.agent, recentPosts: response.recentPosts || [] };
  }

  /**
   * Get a specific agent by ID
   */
  async getAgent(agentId: string): Promise<MoltbookAgent> {
    const response = await this.fetch<MoltbookApiResponse<MoltbookAgent>>(
      `/agents/${agentId}`
    );
    if (!response.data) {
      throw new Error(`Agent ${agentId} not found`);
    }
    return response.data;
  }

  /**
   * Search agents by name or description
   */
  async searchAgents(query: string, limit = 25): Promise<MoltbookAgent[]> {
    const params = new URLSearchParams({
      q: query,
      limit: String(limit),
    });

    const response = await this.fetch<MoltbookApiResponse<MoltbookAgent[]>>(
      `/agents/search?${params.toString()}`
    );
    return response.data ?? [];
  }

  /**
   * Get top submolts (communities)
   */
  async getSubmolts(limit = 20): Promise<MoltbookSubmolt[]> {
    const response = await this.fetch<{ success: boolean; submolts: MoltbookSubmolt[] }>(
      `/submolts?limit=${limit}&sort=subscribers`
    );
    return response.submolts ?? [];
  }

  /**
   * Get posts from a submolt
   */
  async getPosts(options: {
    submolt?: string;
    sort?: "hot" | "new" | "top";
    limit?: number;
    offset?: number;
  } = {}): Promise<MoltbookPostsResponse> {
    const params = new URLSearchParams({
      sort: options.sort || "hot",
      limit: String(options.limit || 25),
    });

    if (options.submolt) {
      params.set("submolt", options.submolt);
    }

    if (options.offset) {
      params.set("offset", String(options.offset));
    }

    return this.fetch<MoltbookPostsResponse>(
      `/posts?${params.toString()}`
    );
  }

  /**
   * Get a specific post by ID
   */
  async getPost(postId: string): Promise<MoltbookPost> {
    const response = await this.fetch<MoltbookApiResponse<MoltbookPost>>(
      `/posts/${postId}`
    );
    if (!response.data) {
      throw new Error(`Post ${postId} not found`);
    }
    return response.data;
  }

  /**
   * Get comments for a post
   */
  async getComments(postId: string, options: {
    sort?: "best" | "new" | "top";
    limit?: number;
  } = {}): Promise<MoltbookComment[]> {
    const params = new URLSearchParams({
      sort: options.sort || "best",
      limit: String(options.limit || 50),
    });

    const response = await this.fetch<MoltbookApiResponse<MoltbookComment[]>>(
      `/posts/${postId}/comments?${params.toString()}`
    );
    return response.data ?? [];
  }

  /**
   * Create a new post (requires authentication)
   */
  async createPost(data: {
    title: string;
    content: string;
    submolt_id?: string;
  }): Promise<MoltbookPost> {
    const response = await this.fetch<MoltbookApiResponse<MoltbookPost>>(
      "/posts",
      {
        method: "POST",
        body: JSON.stringify({
          title: data.title,
          content: data.content,
          submolt_id: data.submolt_id || "29beb7ee-ca7d-4290-9c2f-09926264866f", // default general submolt
        }),
      }
    );
    if (!response.data) {
      throw new Error("Failed to create post");
    }
    return response.data;
  }

  /**
   * Create a comment on a post (requires authentication)
   */
  async createComment(postId: string, content: string): Promise<MoltbookComment> {
    const response = await this.fetch<MoltbookApiResponse<MoltbookComment>>(
      `/posts/${postId}/comments`,
      {
        method: "POST",
        body: JSON.stringify({ content }),
      }
    );
    if (!response.data) {
      throw new Error("Failed to create comment");
    }
    return response.data;
  }

  /**
   * Vote on a post (requires authentication)
   */
  async vote(postId: string, direction: "up" | "down"): Promise<{ success: boolean }> {
    return this.fetch(`/posts/${postId}/vote`, {
      method: "POST",
      body: JSON.stringify({ direction }),
    });
  }

  /**
   * Get agent activity metrics
   */
  async getAgentMetrics(agentId: string, days = 30): Promise<{
    daily_karma: { date: string; karma: number }[];
    posts: number;
    comments: number;
    engagement_rate: number;
  }> {
    return this.fetch(`/agents/${agentId}/metrics?days=${days}`);
  }

  /**
   * Get posts by a specific agent
   */
  async getAgentPosts(agentId: string, options: {
    sort?: "new" | "top";
    limit?: number;
  } = {}): Promise<MoltbookPost[]> {
    const params = new URLSearchParams({
      sort: options.sort || "new",
      limit: String(options.limit || 25),
    });

    const response = await this.fetch<MoltbookApiResponse<MoltbookPost[]>>(
      `/agents/${agentId}/posts?${params.toString()}`
    );
    return response.data ?? [];
  }

  /**
   * Check API connection status
   */
  async testConnection(): Promise<{ status: string; authenticated: boolean }> {
    try {
      await this.fetch("/health");
      return { status: "connected", authenticated: !!this.apiKey };
    } catch {
      return { status: "disconnected", authenticated: false };
    }
  }
}

/**
 * Transform Moltbook agent to our internal format
 */
export function transformMoltbookAgent(agent: MoltbookAgent) {
  return {
    name: agent.name,
    description: agent.description,
    avatar: agent.avatar_url,
    platform: "moltbook" as const,
    platformId: agent.id,
    platformUrl: `https://www.moltbook.com/u/${encodeURIComponent(agent.name)}`,
    category: agent.submolts[0] || "general",
    tags: agent.submolts,
    capabilities: agent.capabilities,
    popularity: agent.karma,
    lastActive: new Date(agent.last_active),
    platformCreatedAt: new Date(agent.created_at),
    verified: agent.is_verified,
  };
}

export const moltbookClient = new MoltbookClient();
export default MoltbookClient;
