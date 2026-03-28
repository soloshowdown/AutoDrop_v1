import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server";

const MIGRATION_SQL = `
-- Ensure team_members table exists
CREATE TABLE IF NOT EXISTS team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text,
  avatar text DEFAULT '',
  status text DEFAULT 'offline' CHECK (status IN ('online', 'away', 'offline')),
  role text DEFAULT 'Developer',
  created_at timestamptz DEFAULT now(),
  last_seen timestamptz DEFAULT now()
);

-- Ensure tasks table exists with corrected constraints
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text DEFAULT '',
  assignee_id uuid REFERENCES team_members(id) ON DELETE SET NULL,
  due_date date,
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  status text DEFAULT 'todo' CHECK (status IN ('backlog', 'todo', 'in-progress', 'done')),
  story_points integer DEFAULT 0,
  requested_by text,
  meeting_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at DESC);

-- Enable RLS
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Permissive policies for team_members (idempotent with IF NOT EXISTS pattern)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'team_members' AND policyname = 'Allow public read access to team_members') THEN
    CREATE POLICY "Allow public read access to team_members" ON team_members FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'team_members' AND policyname = 'Allow public insert to team_members') THEN
    CREATE POLICY "Allow public insert to team_members" ON team_members FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'team_members' AND policyname = 'Allow public update to team_members') THEN
    CREATE POLICY "Allow public update to team_members" ON team_members FOR UPDATE USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'team_members' AND policyname = 'Allow public delete from team_members') THEN
    CREATE POLICY "Allow public delete from team_members" ON team_members FOR DELETE USING (true);
  END IF;
END $$;

-- Permissive policies for tasks
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tasks' AND policyname = 'Allow public read access to tasks') THEN
    CREATE POLICY "Allow public read access to tasks" ON tasks FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tasks' AND policyname = 'Allow public insert to tasks') THEN
    CREATE POLICY "Allow public insert to tasks" ON tasks FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tasks' AND policyname = 'Allow public update to tasks') THEN
    CREATE POLICY "Allow public update to tasks" ON tasks FOR UPDATE USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tasks' AND policyname = 'Allow public delete from tasks') THEN
    CREATE POLICY "Allow public delete from tasks" ON tasks FOR DELETE USING (true);
  END IF;
END $$;

-- Fix: If the tasks table already exists but has the old constraints,
-- alter the status check and make due_date nullable
DO $$ BEGIN
  -- Drop the old status check constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'tasks_status_check'
  ) THEN
    ALTER TABLE tasks DROP CONSTRAINT tasks_status_check;
    ALTER TABLE tasks ADD CONSTRAINT tasks_status_check CHECK (status IN ('backlog', 'todo', 'in-progress', 'done'));
  END IF;

  -- Make due_date nullable if it's currently NOT NULL
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'due_date' AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE tasks ALTER COLUMN due_date DROP NOT NULL;
  END IF;

  -- Add requested_by column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'requested_by'
  ) THEN
    ALTER TABLE tasks ADD COLUMN requested_by text;
  END IF;

  -- Add meeting_id column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'meeting_id'
  ) THEN
    ALTER TABLE tasks ADD COLUMN meeting_id text;
  END IF;

  -- Add email column to team_members if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'team_members' AND column_name = 'email'
  ) THEN
    ALTER TABLE team_members ADD COLUMN email text;
  END IF;

  -- Ensure meetings table exists
  CREATE TABLE IF NOT EXISTS meetings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE,
    title text NOT NULL,
    file_url text,
    status text DEFAULT 'completed',
    duration text,
    room_id text,
    created_at timestamptz DEFAULT now()
  );

  -- Add room_id to meetings if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'meetings' AND column_name = 'room_id'
  ) THEN
    ALTER TABLE meetings ADD COLUMN room_id text;
  END IF;

  -- Ensure transcripts table exists
  CREATE TABLE IF NOT EXISTS transcripts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id uuid REFERENCES meetings(id) ON DELETE CASCADE,
    speaker text,
    text text,
    time text,
    is_actionable boolean DEFAULT false,
    task_id uuid REFERENCES tasks(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now()
  );

  -- Enable RLS for new tables
  ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
  ALTER TABLE transcripts ENABLE ROW LEVEL SECURITY;

  -- Permissive policies for meetings
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'meetings' AND policyname = 'Allow public read access to meetings') THEN
      CREATE POLICY "Allow public read access to meetings" ON meetings FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'meetings' AND policyname = 'Allow public insert to meetings') THEN
      CREATE POLICY "Allow public insert to meetings" ON meetings FOR INSERT WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'meetings' AND policyname = 'Allow public update to meetings') THEN
      CREATE POLICY "Allow public update to meetings" ON meetings FOR UPDATE USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'meetings' AND policyname = 'Allow public delete from meetings') THEN
      CREATE POLICY "Allow public delete from meetings" ON meetings FOR DELETE USING (true);
    END IF;
  END $$;

  -- Permissive policies for transcripts
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'transcripts' AND policyname = 'Allow public read access to transcripts') THEN
      CREATE POLICY "Allow public read access to transcripts" ON transcripts FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'transcripts' AND policyname = 'Allow public insert to transcripts') THEN
      CREATE POLICY "Allow public insert to transcripts" ON transcripts FOR INSERT WITH CHECK (true);
    END IF;
  END $$;
END $$;
`;

export async function POST() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json(
      { error: "Supabase credentials not configured" },
      { status: 500 }
    );
  }

  try {
    // Use the Supabase REST API to run SQL via the rpc endpoint
    // We need to use the pg_net or direct HTTP approach
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
    });

    // Fallback: try to verify by doing a simple select

    // Test if tasks table exists with a simple query
    const { error: testError } = await supabase
      .from("tasks")
      .select("id")
      .limit(1);

    if (testError) {
      return NextResponse.json(
        {
          error: "Tasks table not found or inaccessible. Please run the migration SQL in your Supabase SQL Editor.",
          sql: MIGRATION_SQL,
          details: testError.message,
        },
        { status: 400 }
      );
    }

    // Test inserting and deleting a task to confirm the schema is correct
    const { error: insertError } = await supabase
      .from("tasks")
      .insert({
        title: "__schema_test__",
        status: "backlog",
        due_date: null,
        priority: "medium",
      });

    if (insertError) {
      return NextResponse.json(
        {
          error: "Schema needs updating. Please run the migration SQL in your Supabase SQL Editor.",
          sql: MIGRATION_SQL,
          details: insertError.message,
        },
        { status: 400 }
      );
    }

    // Clean up test row
    await supabase
      .from("tasks")
      .delete()
      .eq("title", "__schema_test__");

    return NextResponse.json({
      success: true,
      message: "Database schema is correctly configured!",
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: "Failed to verify database schema",
        sql: MIGRATION_SQL,
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Use POST to verify/setup the database, or copy the SQL below to run in your Supabase SQL Editor.",
    sql: MIGRATION_SQL,
  });
}
