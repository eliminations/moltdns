/**
 * Seed database with REAL agents from Moltbook API
 * Run with: npx tsx scripts/seed-agents.ts
 */

import { config } from "dotenv";
config();

import { PrismaClient } from "@prisma/client";
import {
  syncMoltbookAgents,
  syncMoltbookPosts,
  syncMoltbookSubmolts,
} from "../src/lib/integrations";

const prisma = new PrismaClient();

async function main() {
  console.log("🦞 Molt DNS - Seeding from Moltbook API\n");

  // Test Moltbook connection first
  console.log("📡 Testing Moltbook API connection...");
  try {
    const testResponse = await fetch("https://www.moltbook.com/api/v1/posts?limit=1");
    if (!testResponse.ok) {
      throw new Error(`API returned ${testResponse.status}`);
    }
    const testData = await testResponse.json();
    if (!testData.success) {
      throw new Error("API returned unsuccessful response");
    }
    console.log("  ✅ Moltbook API is reachable\n");
  } catch (error) {
    console.error("  ❌ Could not reach Moltbook API:", error);
    console.log("\n⚠️  Make sure Moltbook is accessible and try again.\n");
    process.exit(1);
  }

  // Clear existing data (optional - comment out to append instead)
  const clearExisting = process.argv.includes("--clear");
  if (clearExisting) {
    console.log("🗑️  Clearing existing data...");
    await prisma.post.deleteMany({});
    await prisma.submolt.deleteMany({});
    await prisma.agent.deleteMany({ where: { platform: "moltbook" } });
    console.log("  ✅ Cleared existing Moltbook data\n");
  }

  // Sync agents from Moltbook
  console.log("👥 Syncing agents from Moltbook...");
  const agentCount = await syncMoltbookAgents(100);
  console.log(`  ✅ Synced ${agentCount} agents\n`);

  // Sync posts from Moltbook
  console.log("📝 Syncing posts from Moltbook...");
  const postCount = await syncMoltbookPosts({ limit: 50, sort: "hot" });
  console.log(`  ✅ Synced ${postCount} posts\n`);

  // Sync submolts (communities)
  console.log("🏘️  Syncing submolts from Moltbook...");
  const submoltCount = await syncMoltbookSubmolts(30);
  console.log(`  ✅ Synced ${submoltCount} submolts\n`);

  // Summary
  console.log("═".repeat(50));
  console.log("📊 Sync Summary:");
  console.log(`   Agents:   ${agentCount}`);
  console.log(`   Posts:    ${postCount}`);
  console.log(`   Submolts: ${submoltCount}`);
  console.log("═".repeat(50));

  // Show top agents
  const topAgents = await prisma.agent.findMany({
    where: { platform: "moltbook" },
    orderBy: { popularity: "desc" },
    take: 10,
    select: { name: true, popularity: true, trustScore: true, verified: true },
  });

  if (topAgents.length > 0) {
    console.log("\n🏆 Top 10 Moltbook Agents by Karma:");
    topAgents.forEach((a, i) => {
      console.log(
        `   ${i + 1}. ${a.name} - ${a.popularity.toLocaleString()} karma | Trust: ${a.trustScore}% ${a.verified ? "✓" : ""}`
      );
    });
  }

  // Show recent posts
  const recentPosts = await prisma.post.findMany({
    orderBy: { postedAt: "desc" },
    take: 5,
    select: { title: true, authorName: true, upvotes: true, downvotes: true },
  });

  if (recentPosts.length > 0) {
    console.log("\n📰 Recent Posts:");
    recentPosts.forEach((p) => {
      const score = p.upvotes - p.downvotes;
      console.log(`   • ${p.title.slice(0, 50)}${p.title.length > 50 ? "..." : ""}`);
      console.log(`     by ${p.authorName} | ${score} pts`);
    });
  }

  console.log("\n✨ Seed complete! Your database now has real Moltbook data.\n");

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("Seed failed:", e);
  prisma.$disconnect();
  process.exit(1);
});
