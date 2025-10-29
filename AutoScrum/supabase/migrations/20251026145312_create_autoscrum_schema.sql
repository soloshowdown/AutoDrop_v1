/*
  # Create AutoScrum Application Schema

  ## Overview
  Creates all tables needed for the AutoScrum project management application.

  ## New Tables

  ### 1. `tasks`
  Task management with Kanban board support
  - `id` (uuid, primary key)
  - `title` (text, required)
  - `description` (text, required)
  - `assignee_id` (uuid, references team_members)
  - `due_date` (date, required)
  - `priority` (text, low/medium/high)
  - `status` (text, todo/in-progress/done)
  - `story_points` (integer, default 0)
  - `created_at` (timestamptz, auto-generated)
  - `updated_at` (timestamptz, auto-generated)

  ### 2. `team_members`
  Team member profiles and status tracking
  - `id` (uuid, primary key)
  - `name` (text, required)
  - `avatar` (text, URL to profile image)
  - `status` (text, online/away/offline, default 'offline')
  - `role` (text, job role)
  - `created_at` (timestamptz, auto-generated)
  - `last_seen` (timestamptz, auto-updated)

  ### 3. `sprints`
  Sprint planning and tracking
  - `id` (uuid, primary key)
  - `name` (text, required)
  - `start_date` (date, required)
  - `end_date` (date, required)
  - `progress` (integer, 0-100, default 0)
  - `velocity` (integer, story points, default 0)
  - `is_active` (boolean, default false)
  - `created_at` (timestamptz, auto-generated)
  - `updated_at` (timestamptz, auto-generated)

  ### 4. `meeting_participants`
  Video meeting participant status
  - `id` (uuid, primary key)
  - `name` (text, required)
  - `avatar` (text, URL to profile image)
  - `is_muted` (boolean, default true)
  - `is_video_on` (boolean, default false)
  - `created_at` (timestamptz, auto-generated)
  - `updated_at` (timestamptz, auto-generated)

  ## Security
  - Enable Row Level Security on all tables
  - Allow public read access for demo purposes
  - Allow public write access for demo purposes (normally this would be restricted to authenticated users)

  ## Important Notes
  1. RLS is enabled but policies are permissive for demo purposes
  2. In production, policies should check authentication and ownership
  3. All timestamps use timestamptz for proper timezone handling
  4. Foreign key constraints ensure data integrity
*/

-- Create team_members table first (referenced by tasks)
CREATE TABLE IF NOT EXISTS team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  avatar text DEFAULT '',
  status text DEFAULT 'offline' CHECK (status IN ('online', 'away', 'offline')),
  role text DEFAULT 'Developer',
  created_at timestamptz DEFAULT now(),
  last_seen timestamptz DEFAULT now()
);

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text DEFAULT '',
  assignee_id uuid REFERENCES team_members(id) ON DELETE SET NULL,
  due_date date NOT NULL,
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  status text DEFAULT 'todo' CHECK (status IN ('todo', 'in-progress', 'done')),
  story_points integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create sprints table
CREATE TABLE IF NOT EXISTS sprints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  progress integer DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  velocity integer DEFAULT 0,
  is_active boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create meeting_participants table
CREATE TABLE IF NOT EXISTS meeting_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  avatar text DEFAULT '',
  is_muted boolean DEFAULT true,
  is_video_on boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sprints_active ON sprints(is_active);

-- Enable Row Level Security
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE sprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_participants ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for demo purposes
-- Note: In production, these should be restricted to authenticated users

CREATE POLICY "Allow public read access to team_members"
  ON team_members FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert to team_members"
  ON team_members FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update to team_members"
  ON team_members FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete from team_members"
  ON team_members FOR DELETE
  USING (true);

CREATE POLICY "Allow public read access to tasks"
  ON tasks FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert to tasks"
  ON tasks FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update to tasks"
  ON tasks FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete from tasks"
  ON tasks FOR DELETE
  USING (true);

CREATE POLICY "Allow public read access to sprints"
  ON sprints FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert to sprints"
  ON sprints FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update to sprints"
  ON sprints FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete from sprints"
  ON sprints FOR DELETE
  USING (true);

CREATE POLICY "Allow public read access to meeting_participants"
  ON meeting_participants FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert to meeting_participants"
  ON meeting_participants FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update to meeting_participants"
  ON meeting_participants FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete from meeting_participants"
  ON meeting_participants FOR DELETE
  USING (true);