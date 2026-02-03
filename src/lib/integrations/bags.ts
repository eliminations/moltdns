/**
 * Bags.fm API Integration
 *
 * Official API: https://bags.fm/skill.md
 * Bags is a Solana launchpad for humans and AI agents
 */

const BAGS_AGENT_API = "https://public-api-v2.bags.fm/api/v1/agent";
const BAGS_PUBLIC_API = "https://public-api-v2.bags.fm/api/v1";

// Molt DNS Token on Bags.fm
export const MOLTDNS_TOKEN = {
  address: "1garPTJD7b233ezPKwy13CqQNnaapoGmVMBovbwBAGS",
  name: "Molt DNS",
  symbol: "MOLT",
  platform: "bags.fm",
  chain: "solana",
  url: "https://bags.fm/1garPTJD7b233ezPKwy13CqQNnaapoGmVMBovbwBAGS",
};

export interface BagsTokenInfo {
  address: string;
  name: string;
  symbol: string;
  description?: string;
  image?: string;
  created_at?: string;
  creator?: string;
  market_cap?: number;
  price?: number;
  holders?: number;
  volume_24h?: number;
}

export interface BagsTradeQuote {
  input_amount: number;
  output_amount: number;
  price_impact: number;
  fee: number;
  route: string[];
}

export interface BagsClaimablePosition {
  token_address: string;
  amount: number;
  value_usd: number;
}

export interface BagsWallet {
  address: string;
  balance_sol: number;
  created_at: string;
}

class BagsClient {
  private jwt: string | null;
  private apiKey: string | null;

  constructor(jwt?: string, apiKey?: string) {
    this.jwt = jwt || process.env.BAGS_JWT || null;
    this.apiKey = apiKey || process.env.BAGS_API_KEY || null;
  }

  private async fetchAgent<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "User-Agent": "MoltDNS/1.0",
      ...(options.headers as Record<string, string>),
    };

    if (this.jwt) {
      headers["Authorization"] = `Bearer ${this.jwt}`;
    }

    const response = await fetch(`${BAGS_AGENT_API}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`Bags Agent API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  private async fetchPublic<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "User-Agent": "MoltDNS/1.0",
      ...(options.headers as Record<string, string>),
    };

    if (this.apiKey) {
      headers["X-API-Key"] = this.apiKey;
    }

    const response = await fetch(`${BAGS_PUBLIC_API}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`Bags Public API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get token info by address
   */
  async getTokenInfo(address: string): Promise<BagsTokenInfo> {
    return this.fetchPublic<BagsTokenInfo>(`/token/${address}`);
  }

  /**
   * Get trade quote
   */
  async getTradeQuote(params: {
    inputMint: string;
    outputMint: string;
    amount: number;
    slippage?: number;
  }): Promise<BagsTradeQuote> {
    const queryParams = new URLSearchParams({
      inputMint: params.inputMint,
      outputMint: params.outputMint,
      amount: String(params.amount),
      slippage: String(params.slippage || 0.5),
    });

    return this.fetchPublic<BagsTradeQuote>(`/trade/quote?${queryParams}`);
  }

  /**
   * Get claimable fee positions (requires JWT)
   */
  async getClaimablePositions(): Promise<BagsClaimablePosition[]> {
    return this.fetchPublic<BagsClaimablePosition[]>("/token-launch/claimable-positions");
  }

  /**
   * Get lifetime fees for a token
   */
  async getLifetimeFees(tokenAddress: string): Promise<{
    total_fees: number;
    claimed_fees: number;
    unclaimed_fees: number;
  }> {
    return this.fetchPublic(`/token-launch/lifetime-fees?token=${tokenAddress}`);
  }

  /**
   * Get wallets (requires JWT)
   */
  async getWallets(): Promise<BagsWallet[]> {
    return this.fetchAgent<BagsWallet[]>("/wallet/list", {
      method: "POST",
      body: JSON.stringify({}),
    });
  }

  /**
   * Get fee share wallet by identity
   */
  async getFeeShareWallet(params: {
    provider: "moltbook" | "twitter" | "github";
    username: string;
  }): Promise<{ wallet: string; exists: boolean }> {
    const queryParams = new URLSearchParams({
      provider: params.provider,
      username: params.username,
    });

    return this.fetchPublic(`/token-launch/fee-share/wallet/v2?${queryParams}`);
  }

  /**
   * Check API connection status
   */
  async testConnection(): Promise<{ status: string; authenticated: boolean }> {
    try {
      // Try to get token info for a known token
      await this.getTokenInfo(MOLTDNS_TOKEN.address);
      return { status: "connected", authenticated: !!this.jwt };
    } catch {
      return { status: "disconnected", authenticated: false };
    }
  }
}

/**
 * Get direct link to token on Bags.fm
 */
export function getBagsTokenUrl(address: string): string {
  return `https://bags.fm/${address}`;
}

/**
 * Get direct link to trade on Bags.fm
 */
export function getBagsTradeUrl(address: string): string {
  return `https://bags.fm/${address}?action=trade`;
}

export const bagsClient = new BagsClient();
export default BagsClient;
