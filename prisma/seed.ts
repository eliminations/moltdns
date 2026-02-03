import { PrismaClient } from "@prisma/client";
import { syncMoltbookAgents } from "../src/lib/integrations";

const prisma = new PrismaClient();

async function main() {
  console.log("🦞 Seeding MoltDNS database from Moltbook...");

  // Clear existing data
  await prisma.review.deleteMany();
  await prisma.agentMetric.deleteMany();
  await prisma.agent.deleteMany();
  await prisma.verificationRequest.deleteMany();

  console.log("Cleared existing data");

  // Sync real agents from Moltbook API
  const synced = await syncMoltbookAgents();

  console.log(`\n🦞 Seeding complete! Synced ${synced} agents from Moltbook.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
