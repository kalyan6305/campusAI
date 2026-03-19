# 🎓 Campus AI Operating System

Production-ready AI platform with a FastAPI backend, React frontend, MySQL database, and pluggable LLM layer.

---

## Architecture

```
campus_ai/
├── backend/                    # FastAPI server
│   ├── app/
│   │   ├── main.py             # Entrypoint, CORS, lifespan
│   │   ├── api/v1/             # Versioned REST endpoints
│   │   │   ├── auth.py         # Register / Login / Me
│   │   │   ├── chat.py         # Chat + SSE streaming
│   │   │   ├── sessions.py     # Session CRUD
│   │   │   └── router.py       # V1 router aggregator
│   │   ├── core/               # Config, security, logging
│   │   ├── services/           # Business logic layer
│   │   ├── models/             # SQLAlchemy ORM models
│   │   ├── schemas/            # Pydantic request/response
│   │   ├── db/                 # Async engine + session
│   │   ├── llm/                # LLM provider abstraction
│   │   │   ├── base.py         # Abstract interface
│   │   │   ├── ollama_provider.py
│   │   │   ├── api_provider.py # Placeholder (OpenAI)
│   │   │   └── factory.py      # Config-driven factory
│   │   └── utils/              # Dependencies, exceptions
│   ├── alembic/                # Database migrations
│   ├── alembic.ini
│   ├── requirements.txt
│   └── .env.example
│
└── frontend/                   # React (Vite) + Tailwind
    └── src/
        ├── components/
        │   ├── chat/           # ChatWindow, MessageBubble, ChatInput
        │   ├── sidebar/        # SessionSidebar
        │   ├── auth/           # LoginForm, RegisterForm
        │   └── layout/         # AppLayout
        ├── pages/              # ChatPage, AuthPage
        ├── services/           # Axios API layer
        └── store/              # Zustand (auth + chat)
```

---

## Prerequisites

- **Python 3.11+**
- **Node.js 18+**
- **MySQL 8+** (or Docker: `docker run -d -p 3306:3306 -e MYSQL_ROOT_PASSWORD=root -e MYSQL_DATABASE=campus_ai mysql:8`)
- **Ollama** (optional, for local LLM): [ollama.com](https://ollama.com)

---

## Quick Start

### 1. Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Configure environment
copy .env.example .env       # Windows
# cp .env.example .env       # macOS/Linux
# Edit .env with your DATABASE_URL and SECRET_KEY

# Run migrations (or auto-create via lifespan)
# alembic upgrade head

# Start server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

API docs available at: `http://localhost:8000/docs`

### 2. Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start dev server (proxies /api → backend)
npm run dev
```

Open: `http://localhost:5173`

### 3. Pull an Ollama Model (if using local LLM)

```bash
ollama pull llama3
```

---

## API Endpoints

| Method | Endpoint                          | Auth | Description            |
|--------|-----------------------------------|------|------------------------|
| POST   | `/api/v1/auth/register`           | ✗    | Create account         |
| POST   | `/api/v1/auth/login`              | ✗    | Get JWT token          |
| GET    | `/api/v1/auth/me`                 | ✓    | Current user profile   |
| POST   | `/api/v1/sessions`                | ✓    | Create chat session    |
| GET    | `/api/v1/sessions`                | ✓    | List user sessions     |
| GET    | `/api/v1/sessions/{id}/messages`  | ✓    | Get session messages   |
| DELETE | `/api/v1/sessions/{id}`           | ✓    | Delete session         |
| POST   | `/api/v1/chat`                    | ✓    | Send message (full)    |
| POST   | `/api/v1/chat/stream`             | ✓    | Send message (SSE)     |
| GET    | `/health`                         | ✗    | Health check           |

---

## Environment Variables

| Variable                       | Default                                | Description              |
|--------------------------------|----------------------------------------|--------------------------|
| `DATABASE_URL`                 | `mysql+aiomysql://root:root@localhost/campus_ai` | Async MySQL URL |
| `SECRET_KEY`                   | `change-me`                            | JWT signing key          |
| `ACCESS_TOKEN_EXPIRE_MINUTES`  | `1440`                                 | Token expiry (24h)       |
| `LLM_PROVIDER`                 | `gemini`                               | `ollama` / `openai` / `gemini` |
| `LLM_MODEL`                    | `gemini-1.5-flash`                     | Model name               |
| `OLLAMA_BASE_URL`              | `http://localhost:11434`               | Ollama server URL        |
| `CORS_ORIGINS`                 | `["http://localhost:5173"]`            | Allowed origins (JSON)   |

---

## Extension Points

### 🤖 Agent System
Add `backend/app/agents/` with an `Agent` base class. Agents can orchestrate multi-step LLM calls, tool use, and planning loops. Wire into `chat_service.py` by detecting agent-triggering intents.

### 📚 RAG System
Add `backend/app/rag/` with:
- A vector store client (ChromaDB / Pinecone)
- Document chunking + embedding pipeline
- Retrieval step before LLM call in `chat_service.py`

### 🔧 Tool Calling
Extend `LLMProvider.generate()` to accept a `tools` parameter. Implement function-calling format for providers that support it. Add a `ToolRegistry` that maps tool names to Python callables.

### 🖼️ Multimodal Upgrade
- Accept image uploads via `POST /api/v1/chat` (multipart/form-data)
- Pass images to vision-capable models (llava, GPT-4V)
- Enable the image upload button in `ChatInput.jsx`

---

## Production Deployment

- Run behind **Nginx** or **Traefik** as reverse proxy
- Use **Gunicorn** with Uvicorn workers: `gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker`
- Set `DEBUG=false` in `.env`
- Use **Alembic** migrations instead of auto `create_all`
- Add rate limiting via **SlowAPI** (already in dependencies)
- Ready for **Docker** / **Kubernetes** containerization

---

## License

MIT

# campusAI
