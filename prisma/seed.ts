/**
 * Seed Script — OBT Mission Control System
 * Run: npx ts-node --project tsconfig.json prisma/seed.ts
 * Or: npx tsx prisma/seed.ts
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const TEAMS = [
  { name: 'ALPHA', leader: 'Rageeshan C', members: ['Nithyanandam', 'Priya Sharma', 'Arjun Menon'] },
  { name: 'BRAVO', leader: 'Sarah Johnson', members: ['Michael Chen', 'Aisha Patel', 'David Kim'] },
  { name: 'CHARLIE', leader: 'Ravi Kumar', members: ['Sneha Nair', 'Vikram Singh', 'Ananya Roy'] },
  { name: 'DELTA', leader: 'James Wilson', members: ['Emily Davis', 'Carlos Rodriguez', 'Mei Lin'] },
  { name: 'ECHO', leader: 'Pradeep Nair', members: ['Kavya Reddy', 'Sanjay Gupta', 'Fatima Ahmed'] },
  { name: 'FOXTROT', leader: 'Linda Brown', members: ['Jason Park', 'Sofia Garcia', 'Ahmed Hassan'] },
  { name: 'GOLF', leader: 'Suresh Pillai', members: ['Deepa Krishnan', 'Karthik Bala', 'Meena Iyer'] },
  { name: 'HOTEL', leader: 'Rachel Green', members: ['Mark Taylor', 'Nina Patel', 'Chris Lee'] },
]

const GAMES = [
  { name: 'Code Breaker', description: 'Decode encrypted intelligence messages to advance the mission', location: 'ZONE A' },
  { name: 'Laser Escape', description: 'Navigate through a laser grid without triggering alarms', location: 'ZONE B' },
  { name: 'Bomb Defusal', description: 'Defuse a simulated explosive device using teamwork and logic', location: 'ZONE C' },
  { name: 'Intelligence Hunt', description: 'Gather classified intel scattered across the field', location: 'ZONE D' },
  { name: 'Agent Relay', description: 'Complete a high-speed relay race carrying classified briefcases', location: 'ZONE E' },
  { name: 'Target Strike', description: 'Precision target shooting to eliminate enemy operatives', location: 'ZONE F' },
  { name: 'Stealth Ops', description: 'Move silently through enemy territory without detection', location: 'ZONE G' },
  { name: 'Bridge Protocol', description: 'Build a secure communication bridge under time pressure', location: 'ZONE H' },
  { name: 'Cipher Vault', description: 'Crack the vault combination using encoded clues', location: 'ZONE I' },
  { name: 'Extraction Point', description: 'Rescue hostages and extract them to the safe zone', location: 'ZONE J' },
]

const FACI_NAMES = [
  'John Doe',
  'Jane Smith',
  'Alex Turner',
  'Maria Santos',
  'Raj Patel',
  'Lisa Wong',
  'Tom Bradley',
  'Amira Hassan',
  'Kevin Park',
  'Priya Menon',
]

async function main() {
  console.log('🚀 INITIATING MISSION CONTROL SEED SEQUENCE...')

  // Clean existing data
  await prisma.pointTransaction.deleteMany()
  await prisma.teamMember.deleteMany()
  await prisma.team.deleteMany()
  await prisma.facilitator.deleteMany()
  await prisma.game.deleteMany()

  console.log('✓ Database cleared')

  // Create games
  const createdGames = await Promise.all(
    GAMES.map((g) =>
      prisma.game.create({ data: { ...g, isActive: true } })
    )
  )
  console.log(`✓ Created ${createdGames.length} missions`)

  // Create teams with members
  const createdTeams = await Promise.all(
    TEAMS.map((t) =>
      prisma.team.create({
        data: {
          name: t.name,
          leaderName: t.leader,
          currentPoints: 0,
          members: {
            create: [
              { name: t.leader, isLeader: true },
              ...t.members.map((m) => ({ name: m, isLeader: false })),
            ],
          },
        },
      })
    )
  )
  console.log(`✓ Created ${createdTeams.length} mission units`)

  // Create facilitators
  const defaultPassword = await bcrypt.hash('Faci@2026', 12)

  const createdFacis = await Promise.all(
    FACI_NAMES.map((name, idx) =>
      prisma.facilitator.create({
        data: {
          faciId: `FACI-${String(idx + 1).padStart(3, '0')}`,
          name,
          passwordHash: defaultPassword,
          gameId: createdGames[idx]?.id || null,
          isActive: true,
        },
      })
    )
  )
  console.log(`✓ Created ${createdFacis.length} mission officers`)

  // Create sample point transactions
  const sampleTransactions = [
    { teamIdx: 0, gameIdx: 0, faciIdx: 0, points: 150 },
    { teamIdx: 0, gameIdx: 1, faciIdx: 1, points: 120 },
    { teamIdx: 0, gameIdx: 2, faciIdx: 2, points: 200 },
    { teamIdx: 1, gameIdx: 0, faciIdx: 0, points: 180 },
    { teamIdx: 1, gameIdx: 3, faciIdx: 3, points: 100 },
    { teamIdx: 2, gameIdx: 1, faciIdx: 1, points: 160 },
    { teamIdx: 2, gameIdx: 4, faciIdx: 4, points: 90 },
    { teamIdx: 3, gameIdx: 2, faciIdx: 2, points: 140 },
    { teamIdx: 4, gameIdx: 5, faciIdx: 5, points: 110 },
    { teamIdx: 5, gameIdx: 6, faciIdx: 6, points: 130 },
    { teamIdx: 6, gameIdx: 7, faciIdx: 7, points: 170 },
    { teamIdx: 7, gameIdx: 8, faciIdx: 8, points: 80 },
  ]

  let txnCount = 10000
  for (const txn of sampleTransactions) {
    await prisma.$transaction([
      prisma.pointTransaction.create({
        data: {
          txnId: `TXN-${txnCount++}`,
          teamId: createdTeams[txn.teamIdx].id,
          gameId: createdGames[txn.gameIdx].id,
          facilitatorId: createdFacis[txn.faciIdx].id,
          points: txn.points,
        },
      }),
      prisma.team.update({
        where: { id: createdTeams[txn.teamIdx].id },
        data: { currentPoints: { increment: txn.points } },
      }),
    ])
  }

  console.log(`✓ Created ${sampleTransactions.length} point transactions`)

  console.log('\n🎯 MISSION CONTROL SEED COMPLETE')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('📋 DEFAULT FACILITATOR PASSWORD: Faci@2026')
  console.log('🔑 ADMIN LOGIN: admin / Mission@Control2026')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
