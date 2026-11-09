```markdown
# Sport Talent Management Platform

A platform for tracking and verifying athlete performance, enabling talent
discovery by scouts, clubs, and universities.

---

## 📊 Documentation

- docs/data-model/data-model-v1.md
- docs/data-model/erd.md

---

## 🚀 Vision

To build a trusted, data-driven ecosystem for youth sport talent identification
in South Africa.

---

## Getting Started

### Vercel Deployment

Deploy `frontend` and `backend` as separate Vercel projects. Follow [the deployment guide](docs/vercel-deployment.md) for project settings, environment variables, the OAuth session migration, and release limitations.

### Standard Dev Startup (Recommended)

Use the workspace tasks so ports are always pinned correctly:

1. Run task: `Dev: Start Full Stack` (starts backend + frontend together)
2. Optional verify: run task `Dev: Health Check`
3. Stop both services cleanly with task `Dev: Stop Full Stack`

These tasks are defined in `.vscode/tasks.json` and enforce:

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:3001`
- Frontend API target: `NEXT_PUBLIC_API_URL=http://localhost:3001`

### Backend

```bash
cd backend
npm install
npm run start:dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## 🧱 Core Features

- Athlete Profiles
- Activity Tracking
- Verification System (QR, Coach, AI)
- Talent Discovery (Scouts, Clubs, Universities)


## 📊 Documentation

- docs/data-model/data-model-v1.md
- docs/data-model/erd.md
- docs/api/api-spec-v1.md

