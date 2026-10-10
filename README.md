# Mission Control — OBT Points System

> **OUTBOUND TRAINING 2026 | Real-Time Mission Scoring Platform**

A full-stack Mission Impossible–themed points management system built with Next.js, TypeScript, Supabase PostgreSQL, and Prisma.

---

## 🚀 Quick Start

### 1. Clone & Install

```bash
git clone <repo-url>
cd OBT-Points-System
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env.local
```

Edit `.env.local` and fill in your **Supabase credentials**:

| Variable | Where to find |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API |
| `DATABASE_URL` | Supabase → Project Settings → Database → Connection string (Transaction mode) |
| `DIRECT_URL` | Supabase → Project Settings → Database → Connection string (Direct) |
| `ADMIN_USERNAME` | Your choice |
| `ADMIN_PASSWORD` | Your choice |
| `JWT_SECRET` | Generate: `openssl rand -base64 32` |

### 3. Push Database Schema

```bash
npm run db:push
```

### 4. Seed Database

```bash
npm run db:seed
```

Default credentials after seeding:
- **Admin**: `admin` / `Mission@Control2026` (set in `.env.local`)
- **Facilitators**: All use password `Faci@2026`

### 5. Run Dev Server

```bash
npm run dev
```

---

## 📱 Application Routes

| Route | Description | Access |
|---|---|---|
| `/` | Landing page | Public |
| `/leaderboard` | Live leaderboard (projector-friendly) | Public |
| `/admin/login` | Admin login | Public |
| `/admin` | Mission Control dashboard | Admin only |
| `/admin/teams` | Manage Mission Units | Admin only |
| `/admin/facilitators` | Manage Mission Officers | Admin only |
| `/admin/games` | Manage Missions | Admin only |
| `/admin/leaderboard` | Admin leaderboard view | Admin only |
| `/admin/transactions` | Points history / audit log | Admin only |
| `/faci/login` | Facilitator login | Public |
| `/faci/dashboard` | Points award dashboard | Faci only |

---

## 🗄️ Database Commands

```bash
npm run db:generate   # Regenerate Prisma client
npm run db:push       # Push schema changes to Supabase
npm run db:migrate    # Create and apply a migration
npm run db:seed       # Seed with sample data
npm run db:studio     # Open Prisma Studio
```

---

## ⚡ Supabase Realtime Setup

To enable live leaderboard updates, enable Realtime on the `point_transactions` table in Supabase:

1. Go to **Supabase Dashboard → Database → Replication**
2. Enable replication for the `point_transactions` table
3. Or run this SQL in the SQL Editor:

```sql
ALTER TABLE point_transactions REPLICA IDENTITY FULL;
```

---

## 🔐 Security Architecture

- Admin credentials stored in **environment variables** (never in DB)
- Facilitator passwords **bcrypt-hashed** (12 rounds)
- JWT tokens in **httpOnly cookies** (not accessible from JS)
- All mutations validated **server-side**
- Facilitator can only award points to their **assigned game**
- Middleware protects `/admin/*` and `/faci/*` routes
- `SUPABASE_SERVICE_ROLE_KEY` **never exposed** to browser

---

## 🎯 Mission Impossible Terminology

| System Term | Theme Name |
|---|---|
| Teams | Mission Units |
| Facilitators | Mission Officers |
| Games | Missions |
| Points | Mission Credits |
| Leaderboard | Mission Ranking |
| Admin | Mission Control |
| Faci ID | Agent ID |
| Team Leader | Mission Commander |

---

## 🛠️ Tech Stack

- **Next.js 15+** — App Router, Server Actions
- **TypeScript** — Strict type safety
- **Tailwind CSS** — Custom Mission theme
- **Framer Motion** — Cinematic animations
- **Supabase** — PostgreSQL + Realtime
- **Prisma ORM** — Type-safe database access
- **bcryptjs** — Password hashing
- **Jose** — Edge-compatible JWT
- **react-hot-toast** — Mission-style notifications

---

*CLASSIFIED — ALL INFORMATION IS TOP SECRET — OBT 2026*


TEST
