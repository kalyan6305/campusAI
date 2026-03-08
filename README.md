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

<<<<<<< HEAD
# campusAI
=======
# LLM



## Getting started

To make it easy for you to get started with GitLab, here's a list of recommended next steps.

Already a pro? Just edit this README.md and make it your own. Want to make it easy? [Use the template at the bottom](#editing-this-readme)!

## Add your files

* [Create](https://docs.gitlab.com/user/project/repository/web_editor/#create-a-file) or [upload](https://docs.gitlab.com/user/project/repository/web_editor/#upload-a-file) files
* [Add files using the command line](https://docs.gitlab.com/topics/git/add_files/#add-files-to-a-git-repository) or push an existing Git repository with the following command:

```
cd existing_repo
git remote add origin https://gitlab.com/udayreddi28/llm.git
git branch -M main
git push -uf origin main
```

## Integrate with your tools

* [Set up project integrations](https://gitlab.com/udayreddi28/llm/-/settings/integrations)

## Collaborate with your team

* [Invite team members and collaborators](https://docs.gitlab.com/user/project/members/)
* [Create a new merge request](https://docs.gitlab.com/user/project/merge_requests/creating_merge_requests/)
* [Automatically close issues from merge requests](https://docs.gitlab.com/user/project/issues/managing_issues/#closing-issues-automatically)
* [Enable merge request approvals](https://docs.gitlab.com/user/project/merge_requests/approvals/)
* [Set auto-merge](https://docs.gitlab.com/user/project/merge_requests/auto_merge/)

## Test and Deploy

Use the built-in continuous integration in GitLab.

* [Get started with GitLab CI/CD](https://docs.gitlab.com/ci/quick_start/)
* [Analyze your code for known vulnerabilities with Static Application Security Testing (SAST)](https://docs.gitlab.com/user/application_security/sast/)
* [Deploy to Kubernetes, Amazon EC2, or Amazon ECS using Auto Deploy](https://docs.gitlab.com/topics/autodevops/requirements/)
* [Use pull-based deployments for improved Kubernetes management](https://docs.gitlab.com/user/clusters/agent/)
* [Set up protected environments](https://docs.gitlab.com/ci/environments/protected_environments/)

***

# Editing this README

When you're ready to make this README your own, just edit this file and use the handy template below (or feel free to structure it however you want - this is just a starting point!). Thanks to [makeareadme.com](https://www.makeareadme.com/) for this template.

## Suggestions for a good README

Every project is different, so consider which of these sections apply to yours. The sections used in the template are suggestions for most open source projects. Also keep in mind that while a README can be too long and detailed, too long is better than too short. If you think your README is too long, consider utilizing another form of documentation rather than cutting out information.

## Name
Choose a self-explaining name for your project.

## Description
Let people know what your project can do specifically. Provide context and add a link to any reference visitors might be unfamiliar with. A list of Features or a Background subsection can also be added here. If there are alternatives to your project, this is a good place to list differentiating factors.

## Badges
On some READMEs, you may see small images that convey metadata, such as whether or not all the tests are passing for the project. You can use Shields to add some to your README. Many services also have instructions for adding a badge.

## Visuals
Depending on what you are making, it can be a good idea to include screenshots or even a video (you'll frequently see GIFs rather than actual videos). Tools like ttygif can help, but check out Asciinema for a more sophisticated method.

## Installation
Within a particular ecosystem, there may be a common way of installing things, such as using Yarn, NuGet, or Homebrew. However, consider the possibility that whoever is reading your README is a novice and would like more guidance. Listing specific steps helps remove ambiguity and gets people to using your project as quickly as possible. If it only runs in a specific context like a particular programming language version or operating system or has dependencies that have to be installed manually, also add a Requirements subsection.

## Usage
Use examples liberally, and show the expected output if you can. It's helpful to have inline the smallest example of usage that you can demonstrate, while providing links to more sophisticated examples if they are too long to reasonably include in the README.

## Support
Tell people where they can go to for help. It can be any combination of an issue tracker, a chat room, an email address, etc.

## Roadmap
If you have ideas for releases in the future, it is a good idea to list them in the README.

## Contributing
State if you are open to contributions and what your requirements are for accepting them.

For people who want to make changes to your project, it's helpful to have some documentation on how to get started. Perhaps there is a script that they should run or some environment variables that they need to set. Make these steps explicit. These instructions could also be useful to your future self.

You can also document commands to lint the code or run tests. These steps help to ensure high code quality and reduce the likelihood that the changes inadvertently break something. Having instructions for running tests is especially helpful if it requires external setup, such as starting a Selenium server for testing in a browser.

## Authors and acknowledgment
Show your appreciation to those who have contributed to the project.

## License
For open source projects, say how it is licensed.

## Project status
If you have run out of energy or time for your project, put a note at the top of the README saying that development has slowed down or stopped completely. Someone may choose to fork your project or volunteer to step in as a maintainer or owner, allowing your project to keep going. You can also make an explicit request for maintainers.
>>>>>>> a44b0fc (updated table name in database)
