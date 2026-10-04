# CampusFind - College Lost & Found Management System

CampusFind is a full-stack, role-segregated Lost and Found web application for college campuses. It enables students to report lost/found items, file ownership claims, receive automated item match suggestions, and allows Campus Security officers and Administrators to manage custody lockers and verify claims in real-time.

---

## Tech Stack

- **Framework**: Next.js 16 (App Router, Turbopack, Server Actions)
- **Database & ORM**: PostgreSQL via Prisma ORM v6
- **Authentication**: NextAuth.js v5 (Auth.js) with bcryptjs password hashing
- **Validation**: Zod schema validation on all mutation endpoints
- **Styling**: Tailwind CSS & Lucide Icons

---

## Getting Started

### 1. Prerequisites

- [Node.js](https://nodejs.org/) (v18+ recommended)
- [PostgreSQL](https://www.postgresql.org/) (local service or hosted instance)

---

### 2. Environment Variables Setup

Create a `.env` file at the root of the project (you can copy `.env.example` as a template):

```bash
cp .env.example .env
```

Configure the following environment variables:

| Variable | Description | Example / Default |
| :--- | :--- | :--- |
| `DATABASE_URL` | PostgreSQL connection URL | `postgresql://postgres:postgres@localhost:5432/campusfind` |
| `AUTH_SECRET` | NextAuth encryption secret (32-byte string) | Generate with `openssl rand -base64 32` |
| `AUTH_URL` | Base canonical application URL | `http://localhost:3000` |
| `NODE_ENV` | Application environment mode | `development` |

> [!NOTE]
> `.env` is ignored by Git to ensure sensitive database credentials and authentication keys are never committed.

---

### 3. Database Migration & Prisma Generation

Generate the Prisma Client and apply migrations to create the PostgreSQL tables:

```bash
# Generate Prisma Client
npx prisma generate

# Apply migrations to PostgreSQL
npx prisma migrate dev --name init
```

---

### 4. Seed Demo Accounts & Campus Data

Populate your database with demo users, active lost/found items, sample verification claims, and match suggestions:

```bash
# Seed development database
npx prisma db seed
```

#### Pre-Configured Demo Accounts

All demo accounts in the development seed are provisioned with bcrypt-hashed passwords:

| Role | Email | Password | Purpose |
| :--- | :--- | :--- | :--- |
| **Student** | `student@campus.edu` | `password123` | Report items, view personal dashboard, submit claims |
| **Security** | `security@campus.edu` | `password123` | Security desk, custody locker tracker, approve/reject claims |
| **Admin** | `admin@campus.edu` | `password123` | Master administration console, system metrics, override status |

> [!IMPORTANT]
> `prisma/seed.ts` contains a production guard and will automatically block execution in production environments unless `ALLOW_PROD_SEED=true` is explicitly set.

---

### 5. Running the Application

```bash
# Start Next.js development server
npm run dev

# Or build and start for production
npm run build
npm run start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Role-Based Route Architecture

- **`middleware.ts`**: Root-level route guard enforcing role-based permissions:
  - `/dashboard/**` → Accessible to any authenticated user (defaults to Student Portal).
  - `/security/**` → Restricted to `SECURITY` and `ADMIN` roles.
  - `/admin/**` → Restricted exclusively to `ADMIN` role.
  - Unauthenticated requests are redirected to `/login?callbackUrl=...`.

---

## Automated Item Matching Engine

When an item report is saved, `runAutomatedItemMatching()` in `src/lib/matching.ts` automatically runs against active opposite-type items (`LOST` vs `FOUND`) using multi-factor weighted scoring:
- **Category Match** (35% weight)
- **Location Token Overlap** (25% weight)
- **Date Proximity** (20% weight)
- **Title & Description Keyword Similarity** (20% weight)

High-confidence matches ($\ge 45\%$) are stored as `Match` records and rendered directly on the student's dashboard banner with 1-click claim actions.
