import { NextRequest, NextResponse } from 'next/server'
import { comparePassword, signToken } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'

export async function POST(req: NextRequest) {
  try {
    const { traderId, password } = await req.json()

    if (!traderId || !password) {
      return NextResponse.json({ error: 'Trader ID and password are required' }, { status: 400 })
    }

    const cleanedId = traderId.trim().toUpperCase()

    // 1. Try finding in database
    const dbTrader = await prisma.trader.findUnique({
      where: { traderId: cleanedId },
    })

    let authenticated = false
    let sessionTrader = {
      traderId: cleanedId,
      dbTraderId: '',
      name: 'Trade Operative',
    }

    if (dbTrader) {
      if (!dbTrader.isActive) {
        return NextResponse.json({ error: 'TRADER ACCOUNT DEACTIVATED — CONTACT HQ' }, { status: 403 })
      }
      const valid = await comparePassword(password, dbTrader.passwordHash)
      if (valid) {
        authenticated = true
        sessionTrader = {
          traderId: dbTrader.traderId,
          dbTraderId: dbTrader.id,
          name: dbTrader.name,
        }
      }
    }

    // 2. Fallback to master trade credentials if configured or default
    if (!authenticated) {
      const masterUser = (process.env.TRADE_USERNAME || 'TRADE').toUpperCase()
      const masterPass = process.env.TRADE_PASSWORD || 'Trade@2026'
      if (cleanedId === masterUser && password === masterPass) {
        authenticated = true
        sessionTrader = {
          traderId: 'TRADE-MASTER',
          dbTraderId: dbTrader?.id || '',
          name: 'Chief Trader',
        }
      }
    }

    if (!authenticated) {
      return NextResponse.json({ error: 'INVALID CREDENTIALS — ACCESS DENIED' }, { status: 401 })
    }

    const token = await signToken({
      role: 'trade',
      traderId: sessionTrader.traderId,
      dbTraderId: sessionTrader.dbTraderId,
      name: sessionTrader.name,
    }, '12h')

    const res = NextResponse.json({
      success: true,
      message: 'TRADE DESK ACCESS GRANTED',
      trader: sessionTrader,
    })

    res.cookies.set('trade-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 12, // 12 hours
      path: '/',
    })

    return res
  } catch (err) {
    console.error('Trader login error:', err)
    return NextResponse.json({ error: 'SYSTEM ERROR' }, { status: 500 })
  }
}
