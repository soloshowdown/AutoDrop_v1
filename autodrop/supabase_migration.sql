-- Supabase Migration Script: AutoDrop Workspace Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users table (linked to Clerk)
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY, -- Clerk User ID
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Workspaces table
CREATE TABLE IF NOT EXISTS public.workspaces (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    created_by TEXT REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Workspace Members table
CREATE TABLE IF NOT EXISTS public.workspace_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
    user_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
    role TEXT CHECK (role IN ('admin', 'member')) DEFAULT 'member',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(workspace_id, user_id)
);

-- 4. Meetings table
CREATE TABLE IF NOT EXISTS public.meetings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    room_id TEXT UNIQUE,
    status TEXT CHECK (status IN ('processing', 'live', 'completed', 'failed')) DEFAULT 'processing',
    date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    duration TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Transcripts table
CREATE TABLE IF NOT EXISTS public.transcripts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    meeting_id UUID REFERENCES public.meetings(id) ON DELETE CASCADE,
    speaker TEXT,
    text TEXT,
    time TEXT, -- Stores as string like "00:00"
    is_actionable BOOLEAN DEFAULT false,
    task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Tasks table
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
    meeting_id UUID REFERENCES public.meetings(id) ON DELETE SET NULL,
    meeting_title TEXT,
    title TEXT NOT NULL,
    assignee_id TEXT REFERENCES public.users(id) ON DELETE SET NULL,
    due_date TEXT,
    priority TEXT CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
    status TEXT CHECK (status IN ('Backlog', 'To Do', 'In Progress', 'Done')) DEFAULT 'To Do',
    source_type TEXT CHECK (source_type IN ('AI', 'User')) DEFAULT 'User',
    transcript_timestamp TEXT,
    approved BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Activity Log table
CREATE TABLE IF NOT EXISTS public.activity_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
    user_id TEXT REFERENCES public.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL, -- e.g., 'uploaded meeting', 'completed task'
    target TEXT NOT NULL, -- e.g., 'Product Sync Q1'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. Invites table
CREATE TABLE IF NOT EXISTS public.invites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT CHECK (role IN ('admin', 'member')) DEFAULT 'member',
    status TEXT CHECK (status IN ('pending', 'accepted', 'rejected')) DEFAULT 'pending',
    invited_by TEXT REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(workspace_id, email)
);

-- Disable RLS for now as requested (all writes happen server-side or via permissive policies)
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspaces DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.transcripts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.invites DISABLE ROW LEVEL SECURITY;
