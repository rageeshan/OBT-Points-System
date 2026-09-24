import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DIRECT_URL || process.env.DATABASE_URL } },
})

async function main() {
  console.log('🗑️  CLEARING ALL TABLES...')
  await prisma.pointTransaction.deleteMany()
  await prisma.teamMember.deleteMany()
  await prisma.facilitator.deleteMany()
  await prisma.team.deleteMany()
  await prisma.game.deleteMany()
  console.log('✅  ALL TABLES CLEARED')
}

main().catch(console.error).finally(() => prisma.$disconnect())
