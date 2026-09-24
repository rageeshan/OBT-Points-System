/**
 * Seed Script — OBT Mission Control System
 * Run: npm run db:seed
 *
 * This script only CLEARS all tables.
 * Add your real data via the Admin dashboard at /admin
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL || process.env.DATABASE_URL,
    },
  },
})

async function main() {
  console.log('🗑️  CLEARING ALL TABLES...')

  await prisma.pointTransaction.deleteMany()
  await prisma.teamMember.deleteMany()
  await prisma.team.deleteMany()
  await prisma.facilitator.deleteMany()
  await prisma.game.deleteMany()

  console.log('✅  ALL TABLES CLEARED — Ready for real data')
  console.log('')
  console.log('👉  Add your data via the Admin dashboard: http://localhost:3000/admin')
  console.log('🔑  Admin login: SuperAdmin / SuperMan123')
}

main()
  .catch((e) => {
    console.error('❌ Failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
