-- =========================================================
-- Supabase RLS (Row Level Security) Setup
-- Run this in Supabase SQL Editor after pushing schema
-- =========================================================

-- Enable RLS on all tables
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE facilitators ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_transactions ENABLE ROW LEVEL SECURITY;

-- ─── Public READ policies ────────────────────────────────

-- Anyone can read teams (for leaderboard)
CREATE POLICY "teams_read_public" ON teams
  FOR SELECT USING (true);

-- Anyone can read team_members (for team display)
CREATE POLICY "team_members_read_public" ON team_members
  FOR SELECT USING (true);

-- Anyone can read games (for public display)
CREATE POLICY "games_read_public" ON games
  FOR SELECT USING (true);

-- Anyone can read point_transactions (for leaderboard realtime)
CREATE POLICY "transactions_read_public" ON point_transactions
  FOR SELECT USING (true);

-- ─── Service role has full access ────────────────────────
-- (Service role bypasses RLS automatically)

-- ─── Enable Realtime on point_transactions ────────────────
ALTER TABLE point_transactions REPLICA IDENTITY FULL;

-- ─── Realtime publication ─────────────────────────────────
-- Add point_transactions to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE point_transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE teams;
