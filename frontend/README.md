# Mini ERP — Frontend Phase 080: Frontend Architecture & Environment Foundation

Production-grade React + TypeScript + Vite architecture for the Mini ERP system.

## 1. Technology Stack

- **Framework**: React 18
- **Language**: TypeScript (Strict Mode)
- **Build Tool**: Vite 5
- **Routing**: React Router 6 (`createBrowserRouter`)
- **Styling**: Tailwind CSS + shadcn/ui utility patterns
- **Data Fetching & State**: TanStack Query (React Query v5) + Axios
- **Validation**: Zod
- **Testing**: Vitest + React Testing Library + jsdom
- **Linting & Formatting**: ESLint 9 + Prettier

---

## 2. Directory Architecture

```
frontend/
├── src/
│   ├── app/                    # Application bootstrap & provider hierarchy
│   │   ├── App.tsx             # Root component
│   │   ├── router.tsx          # Centralized React Router configuration
│   │   ├── config/             # Zod environment variable validation
│   │   └── providers/          # AppProvider & QueryProvider
│   │
│   ├── assets/                 # Static images, SVGs, and fonts
│   │
│   ├── components/             # Reusable UI component library
│   │   ├── ui/                 # Foundational UI elements (Button, Card, Container, etc.)
│   │   ├── layout/             # Layout components (ApplicationShell)
│   │   └── common/             # Cross-cutting components (ErrorBoundary)
│   │
│   ├── features/               # Feature-based domain modules (Phases 085-099)
│   │   ├── auth/
│   │   ├── users/
│   │   ├── partners/
│   │   ├── products/
│   │   ├── inventory/
│   │   ├── sales/
│   │   ├── purchases/
│   │   ├── manufacturing/
│   │   ├── audit/
│   │   └── notifications/
│   │
│   ├── hooks/                  # Global application hooks (e.g. useApiStatus)
│   │
│   ├── lib/                    # Shared libraries & utilities
│   │   ├── api/                # Axios instance, config, errors, typed helpers
│   │   ├── utils/              # Tailwind ClassMerge helper (cn)
│   │   └── validation/         # Shared Zod schemas
│   │
│   ├── services/               # Global services
│   ├── types/                  # API envelopes & global TypeScript types
│   ├── pages/                  # Top-level route pages (HomePage, NotFoundPage)
│   ├── styles/                 # Tailwind directives & global CSS variables
│   ├── test/                   # Vitest setup & unit tests
│   └── main.tsx                # Entry point
│
├── .env.example
├── .env
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── vite.config.ts
├── vitest.config.ts
├── tailwind.config.js
├── postcss.config.js
└── eslint.config.js
```

---

## 3. Environment Variables

All browser-accessible variables are prefixed with `VITE_` and validated at application startup using Zod in `src/app/config/env.config.ts`.

| Variable | Description | Default |
|---|---|---|
| `VITE_API_BASE_URL` | Backend API Base URL | `http://localhost:3000/api/v1` |
| `VITE_API_TIMEOUT` | Axios request timeout (ms) | `15000` |
| `VITE_APP_ENV` | Environment mode (`development` \| `staging` \| `production` \| `test`) | `development` |
| `VITE_APP_TITLE` | Application Title | `Mini ERP` |

---

## 4. API Client Architecture

Centralized typed HTTP client (`src/lib/api/client.ts`) wrapping Axios:
- Environment-driven base URL & timeout configuration.
- Automatic transformation of responses into standard `ApiResponse<T>` envelope.
- Custom `ApiError` class with HTTP status code, error message, backend error details, and `requestId`.
- Reserved request interceptor boundary for Phase 083 JWT token insertion.

---

## 5. Development & Verification Commands

Run commands from the `frontend/` directory:

```bash
# Start development server
npm run dev

# TypeScript type checking
npm run typecheck

# ESLint check
npm run lint

# Format code with Prettier
npm run format

# Run Vitest test suite
npm run test

# Build production bundle
npm run build

# Preview production build
npm run preview
```

---

## 6. Architectural Rules & Boundaries

1. **No direct fetch/axios calls in UI components**: All API calls must go through `src/lib/api/client.ts` or query hooks.
2. **Type Safety**: Prefer `unknown` over `any`. Strict TS mode is enforced (`noImplicitAny`, `strictNullChecks`).
3. **Path Aliases**: Use `@/*` to reference modules under `src/*`.
4. **Security**: Never store secret keys in `VITE_` variables. Backend authorization remains authoritative.
