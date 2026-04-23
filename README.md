<div align="center">
  <h1>🚀 AutoDrop v1</h1>
  <p><b>Your AI-Powered Meeting-to-Task Pipeline SaaS</b></p>
  <p><i>Automatically turn meeting discussions into actionable tasks on a dynamic Kanban board. No more dropped context. No more manual data entry.</i></p>

  [![Next.js](https://img.shields.io/badge/Next.js-15.4-black?style=flat&logo=next.js)](#)
  [![React](https://img.shields.io/badge/React-19.0-blue?style=flat&logo=react)](#)
  [![Supabase](https://img.shields.io/badge/Supabase-Database-green?style=flat&logo=supabase)](#)
  [![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o--mini-white?style=flat&logo=openai)](#)
</div>

---

## 🎯 The Problem

In fast-paced remote teams, critical action items get lost in the noise of hour-long video calls. 
- **Time wasted:** Project managers spend hours re-watching meetings and manually logging Jira/Trello tickets.
- **Dropped context:** "Who is doing what by when?" gets forgotten.
- **Fragmented tools:** Teams use separate apps for video calls, transcripts, and task management.

## 💡 The Solution: AutoDrop

**AutoDrop** is a seamless SaaS application that bridges the gap between communication and execution. You join a live video meeting or upload a recorded session. While you talk, AutoDrop listens, transcribes, and extracts structured action items using advanced LLMs (GPT-4o-mini). Once the meeting ends, those action items are mapped to specific users and automatically dropped into a collaborative Kanban board.

---

## ✨ Key Features

1. **🎙️ Live Meetings & Audio Uploads**  
   Integrated with ZegoCloud for low-latency live WebRTC video/audio meetings, or upload pre-recorded sessions.

2. **🧠 AI Task Extraction (GPT-4o-mini)**  
   Analyzes meeting transcripts to identify clear imperative tasks, assignees, deadlines, and priorities. Assigns a confidence score to each generated task.

3. **📊 Dynamic Drag-and-Drop Kanban Board**  
   Extracted tasks land in the `Review` or `Backlog` column based on AI confidence. Project managers can drag, drop, and approve tasks across the board (`To Do`, `In Progress`, `Done`).

4. **👤 Intelligent Assignee Mapping**  
   AutoDrop maps spoken names directly to registered User IDs in your workspace via fuzzy matching.

5. **🏢 Multi-Workspace Support**  
   Manage multiple projects and invite team members. Context is scoped perfectly per workspace.

---

## 🏗️ System Architecture & Design

AutoDrop employs a modern, serverless, event-driven architecture using **Next.js App Router** for both the frontend client and the backend API logic. 

## ⚙️ Backend & Data Pipeline Deep Dive

The backbone of AutoDrop is an asynchronous, event-driven data pipeline designed to handle potentially long-running AI tasks without blocking the user interface.

### The Pipeline Architecture
1. **Meeting Ingestion & State Initiation:** When a meeting concludes via the ZegoCloud integration, a database record is created in Supabase with `status: "extracting"`.
2. **Asynchronous Processing:** The client is freed from waiting for the LLM. An async serverless function (`/api/transcribe` & `/lib/extractTasks.ts`) takes over, feeding the transcript to **OpenAI's GPT-4o-mini**.
3. **Structured AI Output:** We enforce strict `json_object` output formatting via prompt engineering. The AI returns a structured array of action items, including `title`, `assignee` (string), `deadline`, `priority`, and a computed `confidence` score.
4. **Fuzzy ID Resolution:** Before insertion, the backend runs a fuzzy string match (using SQL `ilike`) against the workspace's registered users to convert the spoken `assignee` name into a relational `assignee_id`.
5. **Database Sync & Client Update:** Tasks are bulk-inserted into Supabase. The meeting status updates to `completed`. The frontend Kanban board immediately reflects these changes, dropping uncertain tasks (low confidence) into `Review` and highly confident tasks into the `Backlog`.

---

## 🚧 Challenges, Solutions & Optimizations

Building an AI-driven, real-time application presented several engineering hurdles:

### 1. The "Indefinite Loading" Bottleneck
**Problem:** In early iterations, the live meeting-to-task extraction pipeline hung indefinitely if the AI processing took too long, causing a poor user experience and serverless function timeouts.
**Solution & Optimization:** We decoupled the extraction process. The "End Meeting" workflow was refactored into a non-blocking, asynchronous operation. We introduced an AI Processing Overlay that polls the database meeting `status`, providing real-time feedback to the user while the heavy lifting happens in the background.

### 2. Unpredictable LLM Outputs
**Problem:** Extracting consistent database-ready records from unstructured meeting speech is difficult. Early versions suffered from hallucinated formats and broken JSON.
**Solution & Optimization:** Implemented strict prompt engineering coupled with OpenAI's `response_format: { type: "json_object" }`. This eliminated parsing crashes and allowed us to confidently bulk-insert the AI's response directly into Supabase. Furthermore, by opting for `gpt-4o-mini`, we drastically optimized latency and cost without sacrificing extraction accuracy.

### 3. Mapping Spoken Names to Database Entities
**Problem:** A transcript simply says "John will do this." The database needs `assignee_id: "uuid-123"`.
**Solution:** We built a fuzzy-matching resolution step in the backend that queries the Supabase `users` table for partial matches against the AI-extracted string, effectively translating natural language assignments into hard relational data.

### 4. Kanban Data Persistence & UI Flicker
**Problem:** Dragging and dropping tasks while simultaneously mutating remote database records caused UI flickering and state mismatches.
**Solution & Optimization:** Implemented **Optimistic UI** updates using `@dnd-kit`. The UI updates the Kanban state instantly on drag-end, while the Supabase database mutation fires asynchronously in the background.

---

## 📈 Future Scalability & Pipeline Enhancements

While the current pipeline is robust for v1, the architecture is designed to accommodate further optimizations:
- **Message Queues:** Transitioning from serverless async calls to a dedicated message broker (e.g., Upstash Kafka or Redis BullMQ) to handle massive concurrency and implement automatic retry mechanisms for LLM rate limits.
- **WebSocket Subscriptions:** Upgrading the Kanban board's data fetching from periodic polling to Supabase Realtime (WebSockets) for instant, collaborative multi-user updates.
- **Local/Edge Inference:** Exploring smaller, edge-capable models or self-hosted open-source models (like LLaMA 3) to completely eliminate external API latency and costs for task extraction.

---

## 🛠️ Tech Stack Deep Dive

### Frontend Architecture
- **Framework:** Next.js 15.4 (App Router)
- **UI Library:** React 19
- **Styling:** Tailwind CSS v4, Framer Motion (for buttery smooth micro-animations), `clsx`, `tailwind-merge`
- **Components:** shadcn/ui, base-ui, cmdk, lucide-react
- **Drag & Drop:** `@dnd-kit/core`, `@dnd-kit/sortable`

### Backend & Infrastructure
- **Database:** Supabase (PostgreSQL) with Row Level Security (RLS)
- **Authentication:** Clerk (`@clerk/nextjs`)
- **Webhooks:** Svix (for Clerk user sync and workspace events)
- **Emails:** Resend
- **AI Processing:** OpenAI Node SDK (`gpt-4o-mini`)
- **Video/Audio Engine:** ZegoCloud UIKit (`@zegocloud/zego-uikit-prebuilt`)

---

## 🚀 Setup & Installation

Follow these steps to run AutoDrop locally.

### Prerequisites
- Node.js v18+
- Supabase project (URL and Anon Key)
- Clerk account (Publishable Key and Secret Key)
- OpenAI API Key
- ZegoCloud App ID and Server Secret

### 1. Clone & Install
```bash
git clone https://github.com/yourusername/AutoDrop_v1.git
cd AutoDrop_v1/autodrop
npm install
```

### 2. Environment Variables
Create a `.env.local` file in the `autodrop` directory:
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_pub_key
CLERK_SECRET_KEY=your_clerk_secret_key

NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role

OPENAI_API_KEY=your_openai_api_key

NEXT_PUBLIC_ZEGO_APP_ID=your_zego_app_id
NEXT_PUBLIC_ZEGO_SERVER_SECRET=your_zego_server_secret
```

### 3. Run the Development Server
```bash
npm run dev
```
Visit `http://localhost:3000` to see the app.

---

## 🔮 Future Scope
- **Real-time Live Transcription:** Enhancing live meeting processing with chunked WebSocket streaming for instant task generation mid-call.
- **Export/Integrations:** Push approved Kanban tasks directly to Linear, Jira, or Slack.
- **Speaker Diarization:** Using advanced models to perfectly separate "Who said what" even without manual tagging.

<p align="center">
  <i>Built to save time and eliminate context switching.</i>
</p>