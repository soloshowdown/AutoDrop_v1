# AutoDrop--v1
_Automatically turn meeting discussions into actionable tasks on a Kanban board._

## 📌 Project Overview
Meet2Kanban is a major project aimed at simplifying task management from meetings.  
The platform will:
- Capture **live or recorded meeting audio/video**.
- Generate a **transcript** using speech-to-text (Whisper).
- Extract **action items, deadlines, and key points** using NLP/LLMs.
- Auto-populate tasks into a **dynamic Kanban board** (Backlog → To Do → In Progress → Done).
- Allow users to **edit, drag-drop, and export tasks**.

This project demonstrates the integration of **AI (speech + NLP)** with **web development** for intelligent productivity tools.

---

## 🏗️ Planned Tech Stack
- **Frontend:** React / Next.js + Tailwind CSS (Kanban UI, upload interface)  
- **Backend:** FastAPI (Python) or Node.js/Express (API + processing)  
- **Database:** SQLite / PostgreSQL (meetings, transcripts, tasks)  
- **AI Models:**
  - Whisper (speech-to-text)  
  - LLM API (GPT, Gemini, or open-source LLaMA) for action-item extraction  
- **Optional:** Pyannote for speaker diarization  

---

## 🔑 Key Features (Planned)
- [ ] Upload recorded meeting (MP4, MP3, WAV)  
- [ ] Live meeting support (capture via WebRTC → process in chunks)  
- [ ] Transcript generation & storage  
- [ ] Automatic action-item extraction (JSON → DB)  
- [ ] Kanban board with drag & drop support  
- [ ] Manual edit of tasks (title, due date, assignee)  
- [ ] Export tasks (CSV/PDF)  
- [ ] Stretch goal: Real-time live transcription  

---

## 🚀 Setup (To be updated as project develops)
### Prerequisites
- Node.js v18+  
- Python 3.10+  
- Whisper + required Python dependencies  
- Database (SQLite/Postgres)


npm install
npm run dev
