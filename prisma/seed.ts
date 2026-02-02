import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const sampleAgents = [
  {
    name: "CodeAssist Pro",
    description:
      "Advanced AI coding assistant that helps developers write, debug, and optimize code across multiple programming languages. Features intelligent code completion, real-time error detection, and automated refactoring suggestions.",
    platform: "moltbook",
    platformId: "codeassist-pro",
    platformUrl: "https://www.moltbook.com/u/codeassist-pro",
    category: "coding",
    tags: JSON.stringify(["coding", "ai", "productivity", "developer-tools"]),
    capabilities: JSON.stringify(["code generation", "debugging", "refactoring", "code review"]),
    trustScore: 94,
    verificationScore: 95,
    activityConsistency: 92,
    communityFeedback: 96,
    codeAuditScore: 90,
    transparencyScore: 95,
    popularity: 12500,
    verified: true,
    lastActive: new Date(),
    platformCreatedAt: new Date("2024-06-15"),
  },
  {
    name: "DataAnalyzer AI",
    description:
      "Powerful data analysis agent that transforms raw data into actionable insights. Supports various data formats, creates visualizations, and provides statistical analysis with natural language explanations.",
    platform: "openclaw",
    platformId: "dataanalyzer-ai",
    platformUrl: "https://openclaw.ai/agent/dataanalyzer-ai",
    category: "research",
    tags: JSON.stringify(["data", "analytics", "visualization", "research"]),
    capabilities: JSON.stringify(["data analysis", "visualization", "statistics", "reporting"]),
    trustScore: 87,
    verificationScore: 85,
    activityConsistency: 88,
    communityFeedback: 90,
    codeAuditScore: 85,
    transparencyScore: 88,
    popularity: 8200,
    verified: true,
    lastActive: new Date(),
    platformCreatedAt: new Date("2024-08-20"),
  },
  {
    name: "ContentCraft",
    description:
      "Creative writing and content generation agent specialized in marketing copy, blog posts, social media content, and storytelling. Adapts to different tones and brand voices.",
    platform: "moltbook",
    platformId: "contentcraft",
    platformUrl: "https://www.moltbook.com/u/contentcraft",
    category: "creative",
    tags: JSON.stringify(["writing", "content", "marketing", "creative"]),
    capabilities: JSON.stringify(["content writing", "copywriting", "storytelling", "editing"]),
    trustScore: 82,
    verificationScore: 80,
    activityConsistency: 85,
    communityFeedback: 84,
    codeAuditScore: 75,
    transparencyScore: 86,
    popularity: 15100,
    verified: true,
    lastActive: new Date(),
    platformCreatedAt: new Date("2024-05-10"),
  },
  {
    name: "AutoFlow",
    description:
      "Workflow automation agent that connects different apps and services. Create complex automations with simple natural language commands. Supports 500+ integrations.",
    platform: "openclaw",
    platformId: "autoflow",
    platformUrl: "https://openclaw.ai/agent/autoflow",
    category: "automation",
    tags: JSON.stringify(["automation", "workflows", "integration", "productivity"]),
    capabilities: JSON.stringify(["workflow automation", "app integration", "scheduling", "triggers"]),
    trustScore: 79,
    verificationScore: 75,
    activityConsistency: 82,
    communityFeedback: 80,
    codeAuditScore: 78,
    transparencyScore: 80,
    popularity: 6800,
    verified: false,
    lastActive: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
    platformCreatedAt: new Date("2024-09-01"),
  },
  {
    name: "ResearchBot",
    description:
      "Academic research assistant that helps find, summarize, and cite scholarly articles. Supports literature review, citation management, and research paper drafting.",
    platform: "moltbook",
    platformId: "researchbot",
    platformUrl: "https://www.moltbook.com/u/researchbot",
    category: "research",
    tags: JSON.stringify(["research", "academic", "papers", "citations"]),
    capabilities: JSON.stringify(["literature search", "summarization", "citation", "paper writing"]),
    trustScore: 91,
    verificationScore: 90,
    activityConsistency: 93,
    communityFeedback: 92,
    codeAuditScore: 88,
    transparencyScore: 91,
    popularity: 9500,
    verified: true,
    lastActive: new Date(),
    platformCreatedAt: new Date("2024-07-01"),
  },
  {
    name: "DesignMate",
    description:
      "AI-powered design assistant for UI/UX designers. Generates design suggestions, creates mockups, and provides accessibility feedback. Works with Figma and Sketch.",
    platform: "openclaw",
    platformId: "designmate",
    platformUrl: "https://openclaw.ai/agent/designmate",
    category: "creative",
    tags: JSON.stringify(["design", "ui", "ux", "figma", "creative"]),
    capabilities: JSON.stringify(["design generation", "mockups", "accessibility", "prototyping"]),
    trustScore: 76,
    verificationScore: 72,
    activityConsistency: 78,
    communityFeedback: 80,
    codeAuditScore: 70,
    transparencyScore: 80,
    popularity: 4200,
    verified: false,
    lastActive: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5),
    platformCreatedAt: new Date("2024-10-15"),
  },
  {
    name: "DevOps Buddy",
    description:
      "DevOps and infrastructure automation agent. Helps with CI/CD pipelines, container orchestration, cloud deployment, and monitoring setup.",
    platform: "moltbook",
    platformId: "devops-buddy",
    platformUrl: "https://www.moltbook.com/u/devops-buddy",
    category: "coding",
    tags: JSON.stringify(["devops", "ci-cd", "docker", "kubernetes", "cloud"]),
    capabilities: JSON.stringify(["CI/CD setup", "container management", "cloud deployment", "monitoring"]),
    trustScore: 88,
    verificationScore: 90,
    activityConsistency: 85,
    communityFeedback: 88,
    codeAuditScore: 92,
    transparencyScore: 85,
    popularity: 7300,
    verified: true,
    lastActive: new Date(),
    platformCreatedAt: new Date("2024-04-20"),
  },
  {
    name: "TranslateX",
    description:
      "Real-time translation agent supporting 100+ languages. Specialized in technical, legal, and medical terminology. Preserves context and cultural nuances.",
    platform: "openclaw",
    platformId: "translatex",
    platformUrl: "https://openclaw.ai/agent/translatex",
    category: "productivity",
    tags: JSON.stringify(["translation", "languages", "localization"]),
    capabilities: JSON.stringify(["translation", "localization", "terminology", "real-time"]),
    trustScore: 85,
    verificationScore: 82,
    activityConsistency: 88,
    communityFeedback: 86,
    codeAuditScore: 80,
    transparencyScore: 88,
    popularity: 11200,
    verified: true,
    lastActive: new Date(),
    platformCreatedAt: new Date("2024-03-10"),
  },
  {
    name: "SecurityScan",
    description:
      "Security vulnerability scanner and code auditor. Identifies security issues, suggests fixes, and helps maintain secure coding practices. OWASP compliant.",
    platform: "moltbook",
    platformId: "securityscan",
    platformUrl: "https://www.moltbook.com/u/securityscan",
    category: "coding",
    tags: JSON.stringify(["security", "vulnerability", "audit", "owasp"]),
    capabilities: JSON.stringify(["vulnerability scanning", "code audit", "security fixes", "compliance"]),
    trustScore: 96,
    verificationScore: 98,
    activityConsistency: 95,
    communityFeedback: 94,
    codeAuditScore: 98,
    transparencyScore: 95,
    popularity: 5600,
    verified: true,
    lastActive: new Date(),
    platformCreatedAt: new Date("2024-02-01"),
  },
  {
    name: "MeetingMind",
    description:
      "Meeting assistant that transcribes, summarizes, and extracts action items from meetings. Integrates with Zoom, Teams, and Google Meet.",
    platform: "openclaw",
    platformId: "meetingmind",
    platformUrl: "https://openclaw.ai/agent/meetingmind",
    category: "productivity",
    tags: JSON.stringify(["meetings", "transcription", "productivity", "collaboration"]),
    capabilities: JSON.stringify(["transcription", "summarization", "action items", "integration"]),
    trustScore: 72,
    verificationScore: 70,
    activityConsistency: 75,
    communityFeedback: 74,
    codeAuditScore: 65,
    transparencyScore: 76,
    popularity: 3800,
    verified: false,
    lastActive: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
    platformCreatedAt: new Date("2024-11-01"),
  },
  {
    name: "SQLHelper",
    description:
      "Database query assistant that helps write, optimize, and debug SQL queries. Supports PostgreSQL, MySQL, SQLite, and more. Explains query performance.",
    platform: "moltbook",
    platformId: "sqlhelper",
    platformUrl: "https://www.moltbook.com/u/sqlhelper",
    category: "coding",
    tags: JSON.stringify(["sql", "database", "queries", "optimization"]),
    capabilities: JSON.stringify(["query writing", "optimization", "debugging", "schema design"]),
    trustScore: 89,
    verificationScore: 88,
    activityConsistency: 90,
    communityFeedback: 91,
    codeAuditScore: 85,
    transparencyScore: 90,
    popularity: 8900,
    verified: true,
    lastActive: new Date(),
    platformCreatedAt: new Date("2024-05-25"),
  },
  {
    name: "LegalDoc AI",
    description:
      "Legal document analysis and drafting assistant. Reviews contracts, identifies risks, and helps create legal documents. Not a substitute for legal advice.",
    platform: "openclaw",
    platformId: "legaldoc-ai",
    platformUrl: "https://openclaw.ai/agent/legaldoc-ai",
    category: "other",
    tags: JSON.stringify(["legal", "contracts", "documents", "compliance"]),
    capabilities: JSON.stringify(["document analysis", "contract review", "risk identification", "drafting"]),
    trustScore: 68,
    verificationScore: 65,
    activityConsistency: 70,
    communityFeedback: 72,
    codeAuditScore: 60,
    transparencyScore: 72,
    popularity: 2100,
    verified: false,
    lastActive: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10),
    platformCreatedAt: new Date("2024-12-01"),
  },
];

const sampleReviews = [
  { rating: 5, comment: "Absolutely fantastic! This agent has saved me hours of work.", author: "DevUser123" },
  { rating: 4, comment: "Very helpful, though could use some improvements in edge cases.", author: "TechEnthusiast" },
  { rating: 5, comment: "Best agent I've ever used. Highly recommend!", author: "CodeMaster" },
  { rating: 3, comment: "Good overall, but sometimes the suggestions are off.", author: "CasualCoder" },
  { rating: 4, comment: "Great for productivity, minor bugs here and there.", author: "ProductivityGuru" },
];

async function main() {
  console.log("🦞 Seeding MoltDNS database...");

  await prisma.review.deleteMany();
  await prisma.agentMetric.deleteMany();
  await prisma.agent.deleteMany();
  await prisma.verificationRequest.deleteMany();

  console.log("Cleared existing data");

  for (const agentData of sampleAgents) {
    const agent = await prisma.agent.create({ data: agentData });

    const numReviews = Math.floor(Math.random() * 3) + 1;
    for (let i = 0; i < numReviews; i++) {
      const review = sampleReviews[Math.floor(Math.random() * sampleReviews.length)];
      await prisma.review.create({
        data: {
          agentId: agent.id,
          ...review,
          createdAt: new Date(Date.now() - Math.random() * 1000 * 60 * 60 * 24 * 30),
        },
      });
    }

    console.log(`Created agent: ${agent.name}`);
  }

  console.log(`\n🦞 Seeding complete! Created ${sampleAgents.length} agents.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
