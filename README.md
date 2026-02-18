# MetaFlux-Sim: Interactive Metabolic Flux Analysis Platform

MetaFlux-Sim is a high-performance, interactive metabolic flux simulation engine designed to analyze, visualize, and optimize metabolic pathways in real-time. It combines a FastAPI backend (running COBRApy) with a Next.js frontend (visualizing Escher maps and Flux 3D space).

## 🚀 Deployment Instructions (Vercel)

If you are deploying this project to **Vercel**, you must configure the **Root Directory** because the Next.js application is located in the `frontend` folder.

1.  Import the repository in Vercel.
2.  Open **"Edit"** next to **"Root Directory"**.
3.  Select (`/`) or type **`frontend`** and save.
4.  **Framework Preset**: Select **Next.js**.
5.  **Build Command**: `next build` (default)
6.  **Install Command**: `npm install` (default)
7.  Click **Deploy**.

> **Note**: The backend (`backend/`) is a Python FastAPI application. Vercel supports Python serverless functions, but for full performance with COBRApy, we recommend deploying the backend separately (e.g., on **Railway**, **Render**, or **AWS**) and connecting it via environment variables.

## 📂 Project Structure

- **`frontend/`**: Next.js application (React, TypeScript, TailwindCSS, Recharts).
- **`backend/`**: FastAPI application (Python, COBRApy, Pandas).
- **`data/`**: Genome-scale metabolic models (JSON/XML).

## 🛠️ Local Development

### 1. Backend (Python/FastAPI)

```bash
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --reload
```

Server will start at `http://localhost:8000`.

### 2. Frontend (Next.js)

```bash
cd frontend
npm install
npm run dev
```

App will start at `http://localhost:3000`.
