# 🎓 Campus AI Operating System — Functionality Document

## 1. Executive Overview
The **Campus AI Operating System** is a production-ready, full-stack AI platform designed for educational environments. It replaces simple chatbot prototypes with a robust 3-tier architecture, featuring secure user management, intelligent streaming responses, the ability to "talk" to the AI, and persistent session history.

---

## 2. Core Functionalities

### 🔐 User Authentication & Security
- **JWT-based Security**: Secure token-based access using JSON Web Tokens.
- **Persistent Profiles**: Dedicated accounts for individual users with password hashing (bcrypt).
- **Auto-Login**: Seamless transition after registration or page refresh using cached tokens.

### 💬 Intelligent Chat Experience
- **SSE Streaming**: Responses appear character-by-character as they are generated for a "live" feel.
- **Markdown Rendering**: Full support for rich text, code blocks, lists, and tables in AI responses.
- **Auto-Titling**: Chat sessions are automatically named based on the first query.
- **Session Management**: Create, delete, and switch between multiple chat sessions in a unified sidebar.

### 🎤 Voice & Accessibility
- **Voice-to-Text (Input)**: Click the microphone to dictate your query. Uses the browser's native Web Speech API for high accuracy without extra cost.
- **Text-to-Speech (Output)**: Click the togglable speaker icon on any AI response to hear it read aloud. Supports play/stop controls.
- **One-Click Copy**: Instantly copy any AI response to your clipboard with visual feedback.

### 🗄️ Backend & Persistence
- **Message History**: Every message (user and assistant) is persisted in a MySQL database.
- **Async Processing**: High-performance backend using asynchronous processing for LLM calls and database operations.
- **LLM Abstraction**: Config-driven layer that supports Gemini out of the box, with built-in readiness for OpenAI and Ollama.

---

## 3. Technical Architecture

### 💻 Frontend (React & Vite)
- **Modern UI**: Dark glassmorphism design built with Tailwind CSS.
- **State Management**: Lightweight and fast state synchronization using Zustand.
- **Responsive Layout**: Sidebar-driven navigation optimized for desktop and mobile.

### ⚙️ Backend (FastAPI)
- **Clean Architecture**: Separation of concerns across Routers, Services, and Models.
- **Connection Pooling**: Optimized database performance with SQLAlchemy connection pools.
- **Structured Logging**: Production-ready JSON logging for monitoring and debugging.

### 🤖 AI Engine
- **Provider Factory**: Easily switch between local and cloud providers.
- **Streaming Orchestrator**: Manages the flow of data from the LLM directly to the user's screen.

---

## 4. Scalability & Extensions
The platform is designed to grow into a multi-agent system:
- **RAG Ready**: Structure in place for Vector Database integration (ChromaDB/Pinecone).
- **Tool Calling**: API layer prepared for function-calling capabilities.
- **Kubernetes Ready**: Designed for containerized deployment with environmental configuration.
