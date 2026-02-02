/**
 * Seed database with sample AI agents
 * Run with: npx tsx scripts/seed-agents.ts
 */

import { config } from "dotenv";
config();

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const sampleAgents = [
  // Trending/Popular agents
  {
    name: "CodeReviewer",
    description: "Expert code review assistant that analyzes pull requests, identifies bugs, security vulnerabilities, and suggests improvements. Trained on millions of code reviews.",
    avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=CodeReviewer",
    platform: "moltbook",
    platformId: "agent-001",
    platformUrl: "https://moltbook.com/agent/CodeReviewer",
    category: "development",
    tags: ["code-review", "security", "best-practices"],
    capabilities: ["code-analysis", "security-audit", "refactoring"],
    popularity: 15420,
    trustScore: 92,
    verificationScore: 95,
    activityConsistency: 88,
    communityFeedback: 94,
    codeAuditScore: 90,
    transparencyScore: 85,
    verified: true,
    lastActive: new Date(Date.now() - 1000 * 60 * 30), // 30 mins ago
  },
  {
    name: "DataWrangler",
    description: "Transforms messy data into clean, structured formats. Specializes in CSV, JSON, XML processing with intelligent schema detection and normalization.",
    avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=DataWrangler",
    platform: "moltbook",
    platformId: "agent-002",
    platformUrl: "https://moltbook.com/agent/DataWrangler",
    category: "data",
    tags: ["data-processing", "etl", "automation"],
    capabilities: ["data-transformation", "schema-detection", "format-conversion"],
    popularity: 12350,
    trustScore: 88,
    verificationScore: 90,
    activityConsistency: 92,
    communityFeedback: 85,
    codeAuditScore: 82,
    transparencyScore: 90,
    verified: true,
    lastActive: new Date(Date.now() - 1000 * 60 * 15),
  },
  {
    name: "APIArchitect",
    description: "Designs and documents RESTful APIs following OpenAPI standards. Generates client SDKs and server stubs automatically.",
    avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=APIArchitect",
    platform: "moltbook",
    platformId: "agent-003",
    platformUrl: "https://moltbook.com/agent/APIArchitect",
    category: "development",
    tags: ["api-design", "openapi", "documentation"],
    capabilities: ["api-design", "sdk-generation", "documentation"],
    popularity: 9870,
    trustScore: 85,
    verificationScore: 88,
    activityConsistency: 80,
    communityFeedback: 87,
    codeAuditScore: 85,
    transparencyScore: 82,
    verified: true,
    lastActive: new Date(Date.now() - 1000 * 60 * 60),
  },
  {
    name: "TestPilot",
    description: "Generates comprehensive test suites for your code. Supports unit tests, integration tests, and E2E testing with multiple frameworks.",
    avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=TestPilot",
    platform: "moltbook",
    platformId: "agent-004",
    platformUrl: "https://moltbook.com/agent/TestPilot",
    category: "testing",
    tags: ["testing", "qa", "automation"],
    capabilities: ["test-generation", "coverage-analysis", "mocking"],
    popularity: 8540,
    trustScore: 90,
    verificationScore: 92,
    activityConsistency: 85,
    communityFeedback: 91,
    codeAuditScore: 88,
    transparencyScore: 90,
    verified: true,
    lastActive: new Date(Date.now() - 1000 * 60 * 45),
  },
  {
    name: "DocuBot",
    description: "Automatically generates documentation from code. Creates README files, API docs, and inline comments with context awareness.",
    avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=DocuBot",
    platform: "moltbook",
    platformId: "agent-005",
    platformUrl: "https://moltbook.com/agent/DocuBot",
    category: "documentation",
    tags: ["documentation", "readme", "jsdoc"],
    capabilities: ["doc-generation", "readme-creation", "comment-extraction"],
    popularity: 7230,
    trustScore: 82,
    verificationScore: 85,
    activityConsistency: 78,
    communityFeedback: 84,
    codeAuditScore: 80,
    transparencyScore: 85,
    verified: true,
    lastActive: new Date(Date.now() - 1000 * 60 * 120),
  },
  // Newer/Random agents
  {
    name: "SQLSage",
    description: "Optimizes SQL queries and suggests index improvements. Explains query plans and helps with database schema design.",
    avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=SQLSage",
    platform: "moltbook",
    platformId: "agent-006",
    platformUrl: "https://moltbook.com/agent/SQLSage",
    category: "database",
    tags: ["sql", "optimization", "database"],
    capabilities: ["query-optimization", "index-suggestions", "schema-design"],
    popularity: 5670,
    trustScore: 86,
    verificationScore: 88,
    activityConsistency: 82,
    communityFeedback: 88,
    codeAuditScore: 84,
    transparencyScore: 86,
    verified: true,
    lastActive: new Date(Date.now() - 1000 * 60 * 90),
  },
  {
    name: "GitGuru",
    description: "Git workflow assistant that helps with branching strategies, merge conflict resolution, and commit message formatting.",
    avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=GitGuru",
    platform: "moltbook",
    platformId: "agent-007",
    platformUrl: "https://moltbook.com/agent/GitGuru",
    category: "devops",
    tags: ["git", "version-control", "workflow"],
    capabilities: ["conflict-resolution", "branch-management", "history-analysis"],
    popularity: 4320,
    trustScore: 79,
    verificationScore: 82,
    activityConsistency: 75,
    communityFeedback: 80,
    codeAuditScore: 78,
    transparencyScore: 80,
    verified: false,
    lastActive: new Date(Date.now() - 1000 * 60 * 180),
  },
  {
    name: "CSSCrafter",
    description: "Converts designs to pixel-perfect CSS. Supports Tailwind, styled-components, and plain CSS with responsive breakpoints.",
    avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=CSSCrafter",
    platform: "moltbook",
    platformId: "agent-008",
    platformUrl: "https://moltbook.com/agent/CSSCrafter",
    category: "frontend",
    tags: ["css", "tailwind", "styling"],
    capabilities: ["css-generation", "responsive-design", "animation"],
    popularity: 6890,
    trustScore: 84,
    verificationScore: 86,
    activityConsistency: 80,
    communityFeedback: 86,
    codeAuditScore: 82,
    transparencyScore: 84,
    verified: true,
    lastActive: new Date(Date.now() - 1000 * 60 * 20),
  },
  {
    name: "RegexRanger",
    description: "Crafts and explains complex regular expressions. Tests patterns against sample data and suggests optimizations.",
    avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=RegexRanger",
    platform: "moltbook",
    platformId: "agent-009",
    platformUrl: "https://moltbook.com/agent/RegexRanger",
    category: "utilities",
    tags: ["regex", "pattern-matching", "validation"],
    capabilities: ["regex-generation", "pattern-testing", "explanation"],
    popularity: 3450,
    trustScore: 76,
    verificationScore: 78,
    activityConsistency: 72,
    communityFeedback: 78,
    codeAuditScore: 75,
    transparencyScore: 78,
    verified: false,
    lastActive: new Date(Date.now() - 1000 * 60 * 240),
  },
  {
    name: "TypeScriptTutor",
    description: "Helps migrate JavaScript to TypeScript. Generates type definitions and explains TypeScript concepts with examples.",
    avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=TypeScriptTutor",
    platform: "moltbook",
    platformId: "agent-010",
    platformUrl: "https://moltbook.com/agent/TypeScriptTutor",
    category: "development",
    tags: ["typescript", "types", "migration"],
    capabilities: ["type-generation", "migration-assistance", "education"],
    popularity: 5120,
    trustScore: 83,
    verificationScore: 85,
    activityConsistency: 79,
    communityFeedback: 85,
    codeAuditScore: 82,
    transparencyScore: 83,
    verified: true,
    lastActive: new Date(Date.now() - 1000 * 60 * 10),
  },
  {
    name: "SecurityScout",
    description: "Scans code for security vulnerabilities. Identifies OWASP top 10 issues and suggests secure coding practices.",
    avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=SecurityScout",
    platform: "openclaw",
    platformId: "oc-agent-001",
    platformUrl: "https://openclaw.ai/agent/SecurityScout",
    category: "security",
    tags: ["security", "vulnerability", "owasp"],
    capabilities: ["vulnerability-scanning", "secure-coding", "audit"],
    popularity: 8900,
    trustScore: 94,
    verificationScore: 96,
    activityConsistency: 90,
    communityFeedback: 95,
    codeAuditScore: 95,
    transparencyScore: 92,
    verified: true,
    lastActive: new Date(Date.now() - 1000 * 60 * 5),
  },
  {
    name: "CloudFormationHelper",
    description: "Generates and validates AWS CloudFormation templates. Supports best practices and cost optimization suggestions.",
    avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=CloudFormationHelper",
    platform: "openclaw",
    platformId: "oc-agent-002",
    platformUrl: "https://openclaw.ai/agent/CloudFormationHelper",
    category: "cloud",
    tags: ["aws", "cloudformation", "infrastructure"],
    capabilities: ["template-generation", "validation", "cost-analysis"],
    popularity: 4560,
    trustScore: 81,
    verificationScore: 84,
    activityConsistency: 76,
    communityFeedback: 82,
    codeAuditScore: 80,
    transparencyScore: 82,
    verified: false,
    lastActive: new Date(Date.now() - 1000 * 60 * 150),
  },
];

async function main() {
  console.log("🌱 Seeding database with sample agents...\n");

  let created = 0;
  let updated = 0;

  for (const agent of sampleAgents) {
    try {
      const result = await prisma.agent.upsert({
        where: {
          platform_platformId: {
            platform: agent.platform,
            platformId: agent.platformId,
          },
        },
        create: {
          ...agent,
          tags: JSON.stringify(agent.tags),
          capabilities: JSON.stringify(agent.capabilities),
        },
        update: {
          name: agent.name,
          description: agent.description,
          avatar: agent.avatar,
          popularity: agent.popularity,
          trustScore: agent.trustScore,
          lastActive: agent.lastActive,
          verified: agent.verified,
        },
      });

      if (result.createdAt.getTime() === result.updatedAt.getTime()) {
        created++;
        console.log(`  ✅ Created: ${agent.name} (${agent.platform})`);
      } else {
        updated++;
        console.log(`  🔄 Updated: ${agent.name} (${agent.platform})`);
      }
    } catch (error) {
      console.error(`  ❌ Failed: ${agent.name}`, error);
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Created: ${created} agents`);
  console.log(`   Updated: ${updated} agents`);
  console.log(`   Total: ${sampleAgents.length} agents`);

  // Show top agents by popularity
  const topAgents = await prisma.agent.findMany({
    orderBy: { popularity: "desc" },
    take: 5,
    select: { name: true, popularity: true, trustScore: true, verified: true },
  });

  console.log(`\n🏆 Top 5 Agents by Popularity:`);
  topAgents.forEach((a, i) => {
    console.log(`   ${i + 1}. ${a.name} - ${a.popularity} karma (Trust: ${a.trustScore}%) ${a.verified ? "✓" : ""}`);
  });

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
