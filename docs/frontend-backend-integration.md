# Frontend & Backend API Integration Guide

This document describes the architectural integration between the ScholarPath frontend (`frontend/`) and Express backend APIs (`backend/`), implemented under **Priority 4**.

---

## 1. Architectural Overview

ScholarPath uses a layered monorepo architecture where the frontend interfaces with backend services via a centralized, typed API client and domain adapters:

```
[ Frontend Components & Pages ]
  ExplorePage · SchemeDetailPage · HomePage · ProfilePage · WizardPage
                      │
                      ▼
[ React Contexts: ProfileContext & AuthContext ]
                      │
                      ▼
[ Frontend Services & Adapters ]
  apiClient.ts · profileAdapter.ts · schemeAdapter.ts
  profileService.ts · schemeService.ts · eligibilityService.ts
                      │ (HTTP REST / JSON, X-Demo-User-Id, Bearer)
                      ▼
[ Backend Express Router: /api/v1 ]
  ├── GET, PUT /api/v1/profile             (Student DNA Profile)
  ├── GET /api/v1/schemes                  (Search, Filter, Pagination)
  ├── GET /api/v1/schemes/:slug            (Full Scheme Detail & Rules)
  ├── POST /api/v1/eligibility/evaluate    (Deterministic Rule Engine)
  └── POST /api/v1/eligibility/explain     (AI & Deterministic Explanations)
```

---

## 2. Integrated Features & Endpoints

| Frontend Feature / Page | Backend Endpoint | Method | Description |
| :--- | :--- | :--- | :--- |
| **Profile Sync & Onboarding** (`ProfilePage`, `WizardPage`, `ProfileContext`) | `/api/v1/profile` | `GET` | Fetches authenticated student's Eligibility DNA profile. |
| **Profile Save** (`ProfilePage`, `WizardPage`) | `/api/v1/profile` | `PUT` | Persists student demographics, academic, and financial profile to backend. |
| **Scheme Directory** (`ExplorePage`) | `/api/v1/schemes` | `GET` | Full-text keyword search (`q`), multi-field filtering (`type`, `scope`, `category`, `state`), and pagination (`page`, `limit`). |
| **Scheme Details** (`SchemeDetailPage`) | `/api/v1/schemes/:slug` | `GET` | Retrieves verified scheme rules, benefits, deadlines, required documents, and trust citations. |
| **Eligibility Evaluation** (`HomePage`, `ProfileContext`, `SchemeDetailPage`) | `/api/v1/eligibility/evaluate` | `POST` | Evaluates student profile against verified scheme rules using the pure TypeScript rule engine (`@scholarpath/engine`). |
| **Plain-Language AI Explanation** (`SchemeDetailPage`) | `/api/v1/eligibility/explain` | `POST` | Generates plain-language explanations in English (`en`), Kannada (`kn`), or Hindi (`hi`), verified against rule engine consistency guards. |

---

## 3. Client Architecture

### 3.1 Centralized Typed API Client (`frontend/src/services/apiClient.ts`)
- **Base URL Configuration**: Configured via `import.meta.env.VITE_API_BASE_URL` with safe default fallback to `http://localhost:3001/api/v1`.
- **Identity & Authentication Header Injection**:
  - Automatically injects `X-Demo-User-Id` header (from `authService.getCurrentUser()?.id` or default `demo-student-001`).
  - Automatically attaches `Authorization: Bearer <token>` when JWT/Firebase tokens are present.
- **Typed Error Handling**:
  - Standardized error class: `ApiError` with `status`, `code`, `details`, and `requestId`.
  - Distinguishes 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 422 Validation Error, 429 Rate Limit, and 0 (`NETWORK_UNAVAILABLE`).
  - Never swallows errors or crashes silently.

### 3.2 Domain Adapters (`profileAdapter.ts`, `schemeAdapter.ts`)
- **`profileAdapter.ts`**: Provides bidirectional mapping between frontend `StudentProfile` and backend `ProfileRecord` / `UpdateProfileInput`:
  - Translates enums: `EducationLevel` (`UNDERGRADUATE` <-> `undergraduate`), `gender` (`FEMALE` <-> `female`), `category` (`OBC` <-> `OBC`).
  - Preserves rich frontend UI attributes (`currentDistrict`, `degreeName`, `documents`, `isFirstGenerationLearner`) in `extraAttributes` for lossless round-trips.
- **`schemeAdapter.ts`**: Converts backend `SchemeRecord` (PostgreSQL / JSON format) into frontend `Scheme` model with parsed benefit amounts, document types, and trust tiers.

### 3.3 Offline & Demo Mode Separation
- The frontend features a clear distinction between **Live Connected Backend** and **Local Demo Mode**:
  - If the backend is running and healthy, all profile retrieval, scheme queries, evaluations, and AI explanations execute via live HTTP calls.
  - If the backend is unreachable or the student is in offline demonstration mode, the UI clearly displays a `Demo / Local Evaluation Mode` status banner rather than silently pretending network requests succeeded.

---

## 4. Environment Variables

### Backend (`backend/.env` or root `.env`)
```bash
PORT=3001
NODE_ENV=development
LOG_LEVEL=info
CORS_ORIGIN=http://localhost:5173
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/scholarpath_dev
AUTH_MODE=demo
GEMINI_API_KEY=your_gemini_api_key_here
```

### Frontend (`frontend/.env`)
```bash
VITE_APP_ENV=development
VITE_ENABLE_DEMO_MODE=true
VITE_API_BASE_URL=http://localhost:3001/api/v1
```

> [!NOTE]
> Server secrets (`GEMINI_API_KEY`, database credentials, Firebase private keys) are never exposed to the frontend bundle. The frontend only consumes public endpoints and authenticated proxy routes.

---

## 5. Local Startup & Verification

### Step 1: Start Backend Dev Server
```bash
npm --workspace=backend run dev
# Server listening on http://localhost:3001
```

### Step 2: Start Frontend Dev Server
```bash
npm --workspace=frontend run dev
# Vite server running on http://localhost:5173
```

### Step 3: Test the Integrated Flow
1. Open `http://localhost:5173/explore`:
   - Verify real scheme listings load from `GET /api/v1/schemes`.
   - Test keyword search (e.g., "OBC" or "merit") and type/scope filters.
2. Click any scheme to open `http://localhost:5173/schemes/:slug`:
   - Verify scheme metadata loads from `GET /api/v1/schemes/:slug`.
   - Test the AI explanation language selector (`English`, `Kannada`, `Hindi`) which queries `POST /api/v1/eligibility/explain`.
3. Open `http://localhost:5173/home`:
   - Verify the top status banner displays `Connected to Backend API & Rule Engine`.
   - Verify matched schemes display eligibility receipts evaluated by `POST /api/v1/eligibility/evaluate`.
4. Open `http://localhost:5173/profile` or `http://localhost:5173/wizard`:
   - Edit family income, academic marks, or domicile state.
   - Click save and verify real `PUT /api/v1/profile` persistence and re-evaluation.

---

## 6. Test Suite Execution

All workspace tests can be run via:
```bash
npm run typecheck      # Verifies TypeScript compilation across engine, ai, backend, frontend
npm run lint           # ESLint verification
npm test               # Runs vitest test suite across all packages (159 passing tests)
npm run data:check     # Validates canonical scheme datasets
npm --workspace=frontend run build  # Builds production frontend bundle
```
