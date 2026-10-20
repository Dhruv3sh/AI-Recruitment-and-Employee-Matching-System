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
|  `- src/controllers/   authentication and profile handlers
```

`node_modules` belongs inside `Frontend/` and `Backend/`, because these are separate Node.js applications with their own dependencies and scripts. It should not be committed to Git.

## Prerequisites

- Node.js 20 or later
- MongoDB running locally or a MongoDB connection URI
- Ollama, for AI-assisted resume parsing, job-description drafts, and candidate job coaching (template/rule fallbacks are available)

Install the configured Ollama model:

```powershell
ollama pull qwen3:8b
```

## Environment Setup

Create the API environment file from the example:

```powershell
Copy-Item Backend/.env.example Backend/.env
```

Configure MongoDB and a strong `JWT_SECRET` in `Backend/.env`. Ollama settings are optional and have defaults. Application acceptance/rejection emails require valid SMTP settings; see `Backend/.env.example` for the supported variables.

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

- `/` - redirects to the authentication entry point
- `/auth` - registration, login, and demo access
- `/candidate` - candidate desk for profile, resume, and job recommendations
- `/jobs` and `/jobs/[jobId]` - browse open roles, review match guidance, and apply
- `/recruiter` - recruiter desk for jobs, candidate matches, and explanations
- `/roles` - manage, edit, and close recruiter roles; draft job descriptions
- `/applications` - track candidate applications or review recruiter submissions
- `/system` - system map and Phase 1 scope

The workspace routes share a root layout that owns navigation and session handling. Individual pages only render their route-specific content.

## Current Features

- JWT authentication for candidate and recruiter accounts
- Axios API client with automatic bearer-token handling and unauthorized-session recovery
- Candidate profile and single-current-resume upload workflow
- PDF, DOCX, TXT, and Markdown resume uploads with text extraction and local original-file storage
- Background resume parsing and match refreshes, so upload, registration, profile, and job responses remain responsive
- Zod-validated structured resume data from Ollama, with deterministic parsing fallback
- Application readiness checks requiring a complete profile and processed resume
- Recruiter job creation, editing, closing, and optional AI/template description drafts
- Rule-based and MiniLM semantic candidate-job matching
- Match explanations, missing-skill details, job recommendations, and candidate recommendations
- Candidate applications with profile and immutable resume snapshots, withdrawal, and status tracking
- Recruiter application ranking, accept/reject decisions, and decision email notifications (SMTP configuration required)
- Resume file viewing for owners and recruiters reviewing submitted application snapshots
- MongoDB persistence for users, resumes, jobs, match results, and applications

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

- [API reference: endpoints, payloads, responses, and flows](API.md)
- [System data flow](data_flow.md)
- [Requirements](srs.md)
- [Business rules](rules.md)
- [Backend flow reference](Backend/dataflow.md)

The SRS describes the broader planned product. The running Phase 1 scope is summarized above; see the implementation-status sections in [srs.md](srs.md) and [rules.md](rules.md) for the boundary between current behavior and future requirements.
