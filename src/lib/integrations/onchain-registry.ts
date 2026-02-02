/**
 * On-Chain Moltbook Registry Integration
 *
 * This integrates with the Moltbook Registry smart contract on Base
 * Contract: 0x8a11871aCFCb879cac814D02446b2795182a4c07
 */

import { ethers } from "ethers";

const REGISTRY_ADDRESS = "0x8a11871aCFCb879cac814D02446b2795182a4c07";
const RPC_URL = process.env.BASE_RPC || "https://mainnet.base.org";

const ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function agents(uint256 tokenId) view returns (string endpoints, address wallet, bool isVerified)",
  "function tokenURI(uint256 tokenId) view returns (string)",
  "event ReputationLogged(uint256 indexed agentId, uint8 score)",
];

let provider: ethers.JsonRpcProvider | null = null;

function getProvider() {
  if (!provider) {
    provider = new ethers.JsonRpcProvider(RPC_URL);
  }
  return provider;
}

function getContract() {
  return new ethers.Contract(REGISTRY_ADDRESS, ABI, getProvider());
}

export interface OnChainAgent {
  id: number;
  owner: string;
  endpoints: string;
  wallet: string;
  isVerified: boolean;
  uri: string;
}

export interface ReputationData {
  agentId: number;
  averageScore: number;
  totalReviews: number;
  history: number[];
}

/**
 * Check if an agent is verified on-chain
 */
export async function checkOnChainVerification(agentId: number): Promise<{
  verified: boolean;
  owner?: string;
  error?: string;
}> {
  try {
    const contract = getContract();
    const owner = await contract.ownerOf(agentId);
    return { verified: true, owner };
  } catch {
    return { verified: false, error: "Agent not found on-chain" };
  }
}

/**
 * Get agent data from on-chain registry
 */
export async function getOnChainAgent(agentId: number): Promise<OnChainAgent | null> {
  try {
    const contract = getContract();
    const [owner, profile, uri] = await Promise.all([
      contract.ownerOf(agentId),
      contract.agents(agentId),
      contract.tokenURI(agentId),
    ]);

    return {
      id: agentId,
      owner,
      endpoints: profile.endpoints,
      wallet: profile.wallet,
      isVerified: profile.isVerified,
      uri,
    };
  } catch {
    return null;
  }
}

/**
 * Get reputation history for an agent
 */
export async function getOnChainReputation(agentId: number): Promise<ReputationData> {
  try {
    const contract = getContract();
    const filter = contract.filters.ReputationLogged(agentId);
    const logs = await contract.queryFilter(filter);

    if (logs.length === 0) {
      return {
        agentId,
        averageScore: 0,
        totalReviews: 0,
        history: [],
      };
    }

    let totalScore = 0;
    const history: number[] = [];

    logs.forEach((log) => {
      // ethers v6 EventLog has args, regular Log does not
      const eventLog = log as ethers.EventLog;
      const score = Number(eventLog.args?.[1] || 0);
      totalScore += score;
      history.push(score);
    });

    return {
      agentId,
      averageScore: totalScore / logs.length,
      totalReviews: logs.length,
      history,
    };
  } catch {
    return {
      agentId,
      averageScore: 0,
      totalReviews: 0,
      history: [],
    };
  }
}

/**
 * Parse metadata URI to get agent info
 */
export async function parseAgentMetadata(uri: string): Promise<{
  name?: string;
  description?: string;
  image?: string;
} | null> {
  try {
    // Handle IPFS URIs
    let fetchUrl = uri;
    if (uri.startsWith("ipfs://")) {
      fetchUrl = `https://ipfs.io/ipfs/${uri.slice(7)}`;
    }

    const response = await fetch(fetchUrl);
    if (!response.ok) return null;

    return await response.json();
  } catch {
    return null;
  }
}

/**
 * Get registry contract info
 */
export async function getRegistryInfo(): Promise<{
  name: string;
  symbol: string;
  address: string;
}> {
  try {
    const contract = getContract();
    const [name, symbol] = await Promise.all([
      contract.name(),
      contract.symbol(),
    ]);

    return {
      name,
      symbol,
      address: REGISTRY_ADDRESS,
    };
  } catch {
    return {
      name: "Moltbook Agent Registry",
      symbol: "MAR",
      address: REGISTRY_ADDRESS,
    };
  }
}
