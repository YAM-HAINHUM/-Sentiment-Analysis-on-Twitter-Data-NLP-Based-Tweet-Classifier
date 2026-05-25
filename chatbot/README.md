# 🤖 AI Chatbot System

A full-stack ChatGPT-like AI chatbot with real-time streaming, chat history, and a modern dark UI.

---

## 🏗️ Tech Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Frontend   | React + TypeScript + Tailwind CSS   |
| Backend    | Python FastAPI                      |
| Database   | MongoDB (Atlas)                     |
| AI Engine  | OpenAI GPT-3.5 / GPT-4              |
| Auth       | JWT (bcrypt password hashing)       |
| Realtime   | SSE Streaming + WebSockets          |

---

## 📁 Project Structure

```
chatbot/
├── backend/
│   ├── ai/               # OpenAI streaming service
│   ├── models/           # Pydantic schemas
│   ├── routes/           # auth, chat, conversations
│   ├── services/         # business logic
│   ├── utils/            # JWT helpers
│   ├── database.py       # MongoDB connection
│   ├── config.py         # Settings via .env
│   ├── main.py           # FastAPI app entry
│   └── requirements.txt
└── frontend/
    └── src/
        ├── api/          # Axios client
        ├── components/   # Sidebar, MessageBubble, ChatInput, TypingIndicator
        ├── pages/        # AuthPage, ChatPage, SettingsPage, MainLayout
        ├── store/        # Zustand (authStore, chatStore)
        └── types/        # TypeScript interfaces
```

---

## ⚙️ Setup Instructions

### 1. Clone & navigate
```bash
cd chatbot
```

### 2. Backend Setup
```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Mac/Linux
pip install -r requirements.txt
```

Edit `backend/.env`:
```env
MONGODB_URL=mongodb+srv://<user>:<pass>@cluster.mongodb.net/chatbot_db
JWT_SECRET=your-secret-key
OPENAI_API_KEY=sk-your-openai-key
OPENAI_MODEL=gpt-3.5-turbo
CORS_ORIGINS=http://localhost:5173
```

Start the server:
```bash
uvicorn main:app --reload --port 8000
```

### 3. Frontend Setup
```bash
cd frontend
npm install
```

Edit `frontend/.env`:
```env
VITE_API_URL=http://localhost:8000
```

Start the dev server:
```bash
npm run dev
```

Open **http://localhost:5173**

---

## 🔌 API Endpoints

| Method | Endpoint                              | Description              | Auth |
|--------|---------------------------------------|--------------------------|------|
| POST   | `/auth/register`                      | Register new user        | ❌   |
| POST   | `/auth/login`                         | Login, get JWT           | ❌   |
| GET    | `/auth/me`                            | Get current user         | ✅   |
| POST   | `/conversations`                      | Create new conversation  | ✅   |
| GET    | `/conversations?search=`              | List conversations       | ✅   |
| GET    | `/conversations/{id}/messages`        | Get messages             | ✅   |
| DELETE | `/conversations/{id}`                 | Delete conversation      | ✅   |
| POST   | `/chat/send`                          | Send message (SSE stream)| ✅   |
| POST   | `/chat/regenerate`                    | Regenerate last response | ✅   |
| WS     | `/chat/ws/{conversation_id}`          | WebSocket chat           | ✅   |

---

## 🗄️ MongoDB Collections

**users**
```json
{ "_id": ObjectId, "name": "string", "email": "string", "password": "bcrypt_hash", "created_at": "datetime" }
```

**conversations**
```json
{ "_id": ObjectId, "user_id": ObjectId, "title": "string", "created_at": "datetime", "updated_at": "datetime", "message_count": 0 }
```

**messages**
```json
{ "_id": ObjectId, "conversation_id": ObjectId, "role": "user|assistant", "content": "string", "created_at": "datetime" }
```

---

## 🚀 Deployment

### Frontend → Vercel
```bash
cd frontend && npm run build
# Deploy dist/ to Vercel, set VITE_API_URL env var
```

### Backend → Render / Railway
- Set all `.env` variables in the platform dashboard
- Start command: `uvicorn main:app --host 0.0.0.0 --port 8000`

### Database → MongoDB Atlas
- Create free cluster at https://cloud.mongodb.com
- Whitelist `0.0.0.0/0` for cloud deployments
- Copy connection string to `MONGODB_URL`

---

## ✨ Features

- 🔐 JWT auth with bcrypt password hashing
- 💬 Real-time streaming responses (SSE + WebSocket)
- 📂 Multiple conversations with auto-titling
- 🔍 Search past conversations
- 🗑️ Delete conversations
- 📋 Copy message to clipboard
- 🔄 Regenerate last AI response
- 📝 Full Markdown rendering (tables, code blocks, lists)
- 📱 Responsive design (mobile + desktop)
- 🌙 Dark mode default with light mode toggle
- ⚡ Conversation context memory (last 20 messages)
