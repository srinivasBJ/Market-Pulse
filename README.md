# AI Financial Intelligence Platform

Open-source market intelligence platform with:

- React frontend
- FastAPI backend
- PostgreSQL database
- Docker Compose setup
- RSS/news aggregation
- local summarization and sentiment workflows

This project is meant to be run with Docker first.

## Project Structure

```text
AIfinancenews/
├── backend/
│   ├── app/
│   ├── Dockerfile
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   ├── Dockerfile
│   ├── package.json
│   └── package-lock.json
├── docker-compose.yml
└── README.md
```

## What This App Does

- collects finance, crypto, macro, and market stories from multiple sources
- stores article metadata in PostgreSQL
- builds dashboard feeds for:
  - Home
  - Today
  - Yesterday
  - Weekly
  - Monthly
  - Watchlist
- exposes API endpoints for the frontend
- renders a market-desk style frontend

## Recommended Way To Run

Use Docker.

This avoids local Python version problems, especially on Python `3.14`.

## Requirements

Install these first:

- Docker Desktop
- Node.js only if you want to run the frontend separately
- Git

## Fresh Start With Docker

### 1. Clone the project

```bash
git clone <your-repo-url>
cd AIfinancenews
```

If you already have the folder, just enter it:

```bash
cd /Users/trylub/Desktop/AIfinancenews
```

### 2. Start everything

```bash
docker compose down -v
docker compose up --build
```

What this does:

- removes old containers
- removes the old database volume
- rebuilds backend and frontend
- starts:
  - PostgreSQL
  - FastAPI backend
  - React frontend

### 3. Wait for these messages

You should see logs like:

- database ready to accept connections
- backend running on `0.0.0.0:8000`
- frontend running on `http://localhost:5173/`

### 4. Open the app

- Frontend: [http://localhost:5173](http://localhost:5173)
- Backend docs: [http://localhost:8000/docs](http://localhost:8000/docs)
- Backend health: [http://localhost:8000/health](http://localhost:8000/health)

## Manual Ingestion

If you want to force a news refresh manually, open a second terminal:

```bash
curl -X POST http://localhost:8000/api/v1/ingest/run
```

Important:

- `/api/v1/ingest/run` must be called with `POST`
- if you open it in the browser, you may see `405 Method Not Allowed`
- that is normal

## Useful Docker Commands

### Start all services

```bash
docker compose up --build
```

### Stop all services

```bash
docker compose down
```

### Stop all services and delete database volume

```bash
docker compose down -v
```

### View backend logs

```bash
docker compose logs -f backend
```

### View frontend logs

```bash
docker compose logs -f frontend
```

### View database logs

```bash
docker compose logs -f db
```

## Backend API Endpoints

Main endpoints:

- `GET /health`
- `GET /docs`
- `GET /api/v1/dashboard`
- `GET /api/v1/news`
- `GET /api/v1/news/trending`
- `POST /api/v1/ingest/run`

Examples:

```bash
curl http://localhost:8000/health
curl http://localhost:8000/api/v1/dashboard
curl http://localhost:8000/api/v1/news
curl -X POST http://localhost:8000/api/v1/ingest/run
```

## Local Frontend Only

If Docker backend is already running and you want to run only the frontend locally:

```bash
cd frontend
npm install
npm run dev
```

Important:

- if Docker frontend is already using `5173`, local Vite may move to `5174`
- that is normal
- do not run Docker frontend and local frontend unless you intentionally want two copies

## Local Backend

Not recommended as the default path.

Use Docker for backend unless you know exactly why you need local Python.

If you still want local backend:

- use Python `3.12` or `3.13`
- avoid Python `3.14` for this project

Typical local backend steps:

```bash
cd backend
python3.12 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```

But again:

- Docker is the preferred path
- local Python can fail because of NLP/ML package compatibility

## Environment Variables

Backend uses values like:

```env
APP_NAME=Market Pulse Atom
APP_ENV=production
DATABASE_URL=postgresql+psycopg://market:market@db:5432/marketpulse
FRONTEND_ORIGIN=http://localhost:5173
ENABLE_TRANSFORMER_SUMMARY=false
```

For Docker, these are already provided by `docker-compose.yml`.

## Common Issues

### 1. `405 Method Not Allowed` on `/api/v1/ingest/run`

Cause:

- you opened a POST endpoint in the browser

Fix:

```bash
curl -X POST http://localhost:8000/api/v1/ingest/run
```

### 2. `404 Not Found` on `/`

Cause:

- backend root `/` is not a frontend page

Fix:

- open frontend at `http://localhost:5173`
- open backend docs at `http://localhost:8000/docs`

### 3. Port `5173` already in use

Cause:

- another frontend process is already running

Fix:

- stop the extra local `npm run dev`
- or keep using the Docker frontend on `5173`

### 4. Local Python install fails

Cause:

- Python `3.14` package compatibility problems

Fix:

- use Docker
- or switch to Python `3.12` / `3.13`

### 5. News not refreshing

Try:

```bash
curl -X POST http://localhost:8000/api/v1/ingest/run
```

Then refresh the frontend page.

## Suggested Daily Run Flow

### Terminal 1

```bash
cd /Users/trylub/Desktop/AIfinancenews
docker compose up --build
```

### Terminal 2

```bash
curl -X POST http://localhost:8000/api/v1/ingest/run
```

### Browser

Open:

```text
http://localhost:5173
```

## If Something Still Breaks

Send these logs:

### Backend

```bash
docker compose logs backend --tail=120
```

### Frontend

```bash
docker compose logs frontend --tail=120
```

### Database

```bash
docker compose logs db --tail=120
```

## Stack Summary

- Frontend: React + TypeScript + TailwindCSS
- Backend: FastAPI + SQLAlchemy
- Database: PostgreSQL
- NLP/Data: NLTK, spaCy, Sumy, transformers
- Infra: Docker Compose

## Final Recommendation

For this project, the cleanest and most reliable path is:

```bash
cd /Users/Desktop/AIfinancenews
docker compose down -v
docker compose up --build
```

That is the setup future users should follow first.
