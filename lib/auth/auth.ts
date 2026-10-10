import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import bcrypt from 'bcryptjs'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'mission-impossible-secret-key-2026'
)

export type AdminSession = {
  role: 'admin'
  username: string
}

export type FaciSession = {
  role: 'facilitator'
  faciId: string
  facilitatorId: string
}

export type TraderSession = {
  role: 'trade'
  traderId: string
  dbTraderId?: string
  name: string
}

export type Session = AdminSession | FaciSession | TraderSession

// ─── JWT Utilities ────────────────────────────────────────────

export async function signToken(payload: object, expiresIn = '8h') {
  return await new SignJWT(payload as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(JWT_SECRET)
}

export async function verifyToken(token: string): Promise<Session | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as unknown as Session
  } catch {
    return null
  }
}

// ─── Session helpers ──────────────────────────────────────────

export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies()
  const token =
    cookieStore.get('admin-token')?.value ||
    cookieStore.get('faci-token')?.value ||
    cookieStore.get('trade-token')?.value
  if (!token) return null
  return verifyToken(token)
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('admin-token')?.value
  if (!token) return null
  const session = await verifyToken(token)
  if (!session || session.role !== 'admin') return null
  return session as AdminSession
}

export async function getFaciSession(): Promise<FaciSession | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('faci-token')?.value
  if (!token) return null
  const session = await verifyToken(token)
  if (!session || session.role !== 'facilitator') return null
  return session as FaciSession
}

export async function getTradeSession(): Promise<TraderSession | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('trade-token')?.value
  if (!token) return null
  const session = await verifyToken(token)
  if (!session || session.role !== 'trade') return null
  return session as TraderSession
}

// ─── Admin Auth ───────────────────────────────────────────────

export async function verifyAdminCredentials(
  username: string,
  password: string
): Promise<boolean> {
  const adminUsername = process.env.ADMIN_USERNAME || 'admin'
  const adminPassword = process.env.ADMIN_PASSWORD || 'Mission@Control2026'
  return username === adminUsername && password === adminPassword
}

// ─── Password hashing ─────────────────────────────────────────

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash)
}
