# BudgetBuddy

## Overview

BudgetBuddy is a comprehensive personal budget tracking web application with a dark neon theme. It allows users to manage expenses, track savings goals, set bill payment reminders, and visualize spending patterns through charts and analytics. The app targets young professionals and students who want a visually appealing way to manage their finances.

Key features:
- User authentication (register/login with session-based auth)
- Expense tracking with categories
- Savings goals with progress tracking
- Bill/payment reminders with paid/unpaid status
- Analytics dashboard with charts (spending trends, category breakdowns)
- Calendar view showing expenses and reminders by date
- Monthly budget setting and tracking
- Profile management

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework:** React 18 with TypeScript, built with Vite
- **Routing:** Wouter (lightweight alternative to React Router)
- **State Management:** TanStack React Query for server state; React Context for auth state
- **UI Components:** Shadcn UI (new-york style) built on Radix UI primitives, styled with Tailwind CSS
- **Charts:** Recharts for bar charts, pie charts, and area charts on dashboard/analytics pages
- **Animations:** Framer Motion for page transitions and list animations
- **Date Utilities:** date-fns for formatting and date comparisons
- **Forms:** React Hook Form with Zod resolvers for validation
- **Path Aliases:** `@/` maps to `client/src/`, `@shared/` maps to `shared/`

The frontend follows a page-based structure under `client/src/pages/` with shared components in `client/src/components/`. Protected routes check auth status and redirect to the auth page if not logged in.

### Backend Architecture
- **Framework:** Express 5 running on Node.js with TypeScript (via tsx)
- **API Pattern:** RESTful JSON API under `/api/` prefix
- **Auth:** Passport.js with local strategy, express-session for session management, scrypt for password hashing
- **Session Store:** PostgreSQL-backed sessions via connect-pg-simple
- **Build:** Custom build script using Vite for client and esbuild for server, outputting to `dist/`

API routes are defined in `server/routes.ts`. Route contracts (paths, input schemas, response schemas) are shared between client and server via `shared/routes.ts`.

### Shared Layer
- **Schema:** `shared/schema.ts` defines all database tables and Zod validation schemas using Drizzle ORM + drizzle-zod
- **Routes:** `shared/routes.ts` defines API contract objects with paths, methods, input/output schemas — used by both frontend and backend

### Data Storage
- **Database:** PostgreSQL (Neon DB compatible)
- **ORM:** Drizzle ORM with PostgreSQL dialect
- **Schema Management:** `drizzle-kit push` for applying schema changes (no migration files by default)
- **Tables:**
  - `users` — id, username, password (hashed), monthlyBudget (decimal)
  - `expenses` — id, userId, amount (decimal), category, description, date
  - `savings` — id, userId, name, targetAmount, currentAmount (decimals), color
  - `reminders` — id, userId, title, amount (decimal), dueDate, isPaid (boolean)

### Authentication & Authorization
- Session-based auth using express-session with PostgreSQL store
- Passport.js local strategy (username/password)
- Passwords hashed with scrypt + random salt
- 30-day session cookies
- `requireAuth` middleware on protected API routes
- Frontend `useAuth` hook provides user state, login/logout/register mutations

### Key API Endpoints
- `POST /api/register` — Create account
- `POST /api/login` — Login
- `POST /api/logout` — Logout
- `GET /api/user` — Get current user
- `PATCH /api/user/budget` — Update monthly budget
- `GET/POST /api/expenses` — List/create expenses
- `DELETE /api/expenses/:id` — Delete expense
- `GET/POST /api/savings` — List/create savings goals
- `PATCH/DELETE /api/savings/:id` — Update/delete savings goal
- `GET/POST /api/reminders` — List/create reminders
- `PATCH/DELETE /api/reminders/:id` — Update/delete reminder

## External Dependencies

### Database
- **PostgreSQL** — Primary data store, connected via `DATABASE_URL` environment variable
- **Neon DB** — Recommended serverless PostgreSQL provider (standard PostgreSQL also works)
- **connect-pg-simple** — Session storage in PostgreSQL

### Key NPM Packages
- **drizzle-orm** + **drizzle-kit** — ORM and schema management
- **express** v5 — HTTP server
- **passport** + **passport-local** — Authentication
- **@tanstack/react-query** — Server state management
- **recharts** — Data visualization charts
- **framer-motion** — Animations
- **shadcn/ui components** (Radix UI primitives) — UI component library
- **react-hook-form** + **@hookform/resolvers** — Form handling
- **zod** + **drizzle-zod** — Schema validation
- **date-fns** — Date utilities
- **wouter** — Client-side routing
- **vaul** — Drawer component

### Environment Variables Required
- `DATABASE_URL` — PostgreSQL connection string (required)
- `SESSION_SECRET` — Session encryption secret (falls back to default in dev)

### Replit-Specific Integrations
- `@replit/vite-plugin-runtime-error-modal` — Error overlay in development
- `@replit/vite-plugin-cartographer` — Dev tooling (dev only)
- `@replit/vite-plugin-dev-banner` — Dev banner (dev only)