# Matchwise AI Recruitment System

Phase 1 of an AI-assisted recruitment and employee matching system. Candidates can create profiles and upload resumes; recruiters can create jobs, compare candidates, and review explainable match results.

## Stack

- Frontend: Next.js App Router, React, Tailwind CSS, Axios
- API: Express 5, Mongoose, Zod, Multer, JWT authentication
- Database: MongoDB
- AI: Ollama with `qwen3:8b` for structured parsing and Hugging Face MiniLM (`Xenova/all-MiniLM-L6-v2`) for semantic matching

## Project Structure

```text
Recruitment System/
|- Frontend/             Next.js application
|  |- app/               file-based routes and shared layouts
|  |- components/        reusable UI, layout, and feature components
|  |- hooks/             reusable client-side behavior
|  |- lib/               Axios API client and shared helpers
|  `- utils/             formatting and presentation utilities
|- Backend/              Express application
|  |- src/routes/        HTTP endpoint handlers
|  |- src/services/      parsing, matching, embeddings, and AI services
|  |- src/models/        Mongoose models
|  `- src/validators/    Zod schemas
```

`node_modules` belongs inside `Frontend/` and `Backend/`, because these are separate Node.js applications with their own dependencies and scripts. It should not be committed to Git.

## Prerequisites

- Node.js 20 or later
- MongoDB running locally or a MongoDB connection URI
- Ollama, when AI-powered resume parsing is required

Install the configured Ollama model:

```powershell
ollama pull qwen3:8b
```

## Environment Setup

Create the API environment file from the example:

```powershell
Copy-Item Backend/.env.example Backend/.env
```

Set at least the following values in `Backend/.env`:

```env
MONGODB_URI=*************
JWT_SECRET=use-a-long-random-secret
API_PORT=400*
WEB_ORIGIN=http://localhost:3000
OLLAMA_URL=http://127.0.0.1:****
OLLAMA_MODEL=qwen3:8b
EMBED_MODEL=Xenova/all-MiniLM-L6-v2
```

The frontend defaults to `http://localhost:4002/api`. To override it, create `Frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:4002/api
```

## Install And Run

Install each application separately:

```powershell
cd Backend
npm install

cd ../Frontend
npm install
```

Start the API in one terminal:

```powershell
cd Backend
npm run dev
```

Start the frontend in another terminal:

```powershell
cd Frontend
npm run dev
```

Open the local URL printed by Next.js, normally `http://localhost:3000`. If that port is already occupied, Next.js selects the next available port.

## Available Routes

- `/` - authentication entry point
- `/candidate` - candidate desk for profile, resume, and job recommendations
- `/recruiter` - recruiter desk for jobs, candidate matches, and explanations
- `/system` - system map and Phase 1 scope

The workspace routes share a root layout that owns navigation and session handling. Individual pages only render their route-specific content.

## Current Features

- JWT authentication for candidate and recruiter accounts
- Axios API client with automatic bearer-token handling and unauthorized-session recovery
- Candidate profile and resume upload workflow
- PDF, DOCX, TXT, and Markdown resume uploads with text extraction and local original-file storage
- Background resume parsing and match refreshes, so upload, registration, profile, and job responses remain responsive
- Zod-validated structured resume data from Ollama, with deterministic parsing fallback
- Recruiter job creation and normalized job requirements
- Rule-based and MiniLM semantic candidate-job matching
- Match explanations, missing-skill details, job recommendations, and candidate recommendations
- MongoDB persistence for users, resumes, jobs, and match results

## Testing

Run the backend test suite:

```powershell
cd Backend
npm test
```

Run a production frontend build:

```powershell
cd Frontend
npm run build
```

## Documentation

- [System data flow](data_flow.md)
- [Requirements](srs.md)
- [Business rules](rules.md)
- [Backend flow reference](Backend/dataflow.md)
