# FloGuru

**FloGuru** is an open, AI-powered automation platform built around smart "Guru" agents. It enables flexible workflow automation that connects browser automation, chat integrations (Telegram, WhatsApp, Discord, etc.), and continual learning via self-improvement mechanisms. FloGuru provides modular backend, frontend, and Python packages for seamless LLM-based task execution, human-in-the-loop actions, and rapid extensibility.

---

## ✨ Features

- **AI Reasoning Gurus:** Specialized agents that use advanced LLMs (e.g., DeepSeek, Gemini) to understand and automate complex tasks.
- **Browser Automation:** Python-based headless control for end-to-end browser workflows.
- **Self-Improvement:** HyperHealing technology learns from past successes for better future task execution.
- **Chat Integrations:** Out-of-the-box gateways for Telegram, WhatsApp, Discord, and more.
- **Modular Architecture:** Decoupled code for API/backend, frontend, chat gateway, shared logic, and automation, making extension easy.

---

## 🗂️ Project Structure

<details>
<summary>Directory Tree</summary>

```
guru/
├── apps/
│   ├── api/              # Backend API (Node.js + Express)
│   │   ├── src/
│   │   │   ├── index.ts           # Main entry point
│   │   │   ├── routes/            # API endpoints
│   │   │   ├── services/          # Business logic
│   │   │   │   ├── aiService.ts   # AI/LLM integration
│   │   │   │   ├── guruService.ts # Guru management
│   │   │   │   └── guruExecutorService.ts # Task execution
│   │   │   └── lib/               # Utilities
│   │   └── Dockerfile
│   └── web/              # Frontend (Next.js)
│       └── src/
├── packages/
│   ├── database/         # Database schema (Drizzle ORM)
│   ├── guru-core/        # Core logic
│   └── shared/           # Shared utilities
├── guru-gateway/         # Chat integration gateway
│   └── src/
│       └── GuruGateway.ts
├── browser-use/          # Python browser automation
│   └── python_bridge/
└── .github/workflows/    # CI/CD (GitHub Actions)
```
</details>

---

## 🚀 Getting Started

### 1. **Install Dependencies**

```sh
# Root install
npm install

# If using workspaces, install individually too:
cd apps/api && npm install
cd apps/web && npm install
cd packages/database && npm install
cd packages/guru-core && npm install
cd packages/shared && npm install
```

### 2. **Run the API Backend**

```sh
cd apps/api
npm run dev
# or docker compose up
```

### 3. **Run the Frontend**

```sh
cd apps/web
npm run dev
```

### 4. **Python Automation (Browser Use)**

```sh
cd browser-use/python_bridge
# (Set up virtualenv)
pip install -r requirements.txt
```

---

## 🧑‍💻 Contributing

- Follow GitHub Flow for all code changes—make a branch, open a PR, get CI passing.
- Use clear, descriptive commit messages and PR titles.
- Add/Update documentation for any new features in related module/package.
- For any new background jobs, include tests and a default-off feature flag.
- Do NOT commit secrets or real API credentials—use `.env.example` for placeholders only.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

> **FloGuru:** Automate anything with AI. Join the community—collaborate, share agents, and push the boundaries of workflow automation!
