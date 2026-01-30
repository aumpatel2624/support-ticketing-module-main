# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Internal support ticketing system for company-wide issue tracking. Designed for 200-500 concurrent users with role-based access control across multiple departments. The system supports three visualization modes (table, card, Kanban) with full ticket lifecycle management, internal comments, attachments, and real-time notifications via Socket.io.

**Status:** Core infrastructure implemented - Ready for feature development and testing.

## Documentation

All detailed documentation is organized in the `docs/` folder:

- **[docs/PRD.md](docs/PRD.md)** - Complete Product Requirements Document with specifications, features, and data models
- **[docs/UI-UX-Design-Brief.md](docs/UI-UX-Design-Brief.md)** - Comprehensive design brief with mockup specifications
- **[docs/backend.md](docs/backend.md)** - Backend development plan with implementation phases
- **[docs/frontend.md](docs/frontend.md)** - Frontend development plan with component structure
- **[docs/master_flow.md](docs/master_flow.md)** - High-level system workflow documentation

**Design Mockups:** Available in `Frontend-designs/stitch_professional_login_page/` - HTML mockups with screenshots for major screens.

## Tech Stack

**Frontend:** Next.js 14+ (App Router), JavaScript (no TypeScript), Zustand for state management, shadcn/ui + Radix UI primitives, Tailwind CSS, React Hook Form + Zod validation, Axios, @dnd-kit/core (Kanban), Recharts (analytics)

**Backend:** Node.js v22+, Express.js, MongoDB + Mongoose, JWT authentication, Bcrypt password hashing, Multer (file uploads), Nodemailer (email), Zod validation, Swagger/OpenAPI documentation, Socket.io (real-time features)

## Commands

```bash
# Backend (from backend/ directory)
npm run dev          # Start with nodemon (localhost:5000)
npm run start        # Production start
npm run test         # Jest + Supertest test suite
npm run lint         # ESLint code quality check
npm run seed         # Seed database with sample data
npm run seed:super   # Seed superadmin user only

# Frontend (from frontend/ directory)
npm run dev          # Start Next.js dev server (localhost:3000)
npm run build        # Production build
npm run start        # Start production server
npm run lint         # ESLint code quality check
```

## Architecture Overview

### 4-Level RBAC Model

1. **SuperAdmin** - System-wide access: manage all departments, users, permissions, categories, SLA settings, analytics
2. **Admin/Department Head/Team Lead** - Department-scoped access with configurable permissions (read-only, edit, or full ticket assignment)
3. **Team Member** - Assigned tickets within department, can update status and add internal comments
4. **Employee/Normal User** - Create personal tickets, view own tickets only

Each role has granular permissions: `canAddMembers`, `canAssignTickets`, `canManageCategories`, `accessLevel`.

### Ticket Lifecycle

```
New → Assigned → In Progress → Pending (optional) → Completed → Closed
                              ↓
                          Escalated → Returned to Queue
```

Ticket ID format: `TKT-YYYY-NNN` (auto-generated). Each ticket tracks full `statusHistory` array with timestamps.

### Three Visualization Modes

- **Table View** - Sortable/filterable data grid with React Table (TanStack Table)
- **Card View** - Grid layout displaying ticket cards with quick actions
- **Kanban View** - Drag-and-drop board organized by status columns (@dnd-kit/core)

### Key Features

- **Ticket Age Coding:** Fresh (0-24h green), Recent (1-3d blue), Aging (4-7d yellow), Old (8-14d orange), Critical (15+d red)
- **SLA Tracking:** Automatic breach detection with escalation notifications
- **Comments System:** Public (customer-visible) and internal-only comments with mention support
- **File Attachments:** Multer-based upload with file type/size validation
- **Real-time Updates:** Socket.io for live ticket notifications and status changes
- **Email Notifications:** Nodemailer integration for ticket updates, assignments, SLA breaches

## Directory Structure

### Backend (`backend/src/`)

```
├── index.js                    # Express app setup, routes, Socket.io init
├── config/                     # db.js (MongoDB connection), swagger.js (API docs config)
├── routes/                     # Express route files with inline Swagger JSDoc
│   ├── auth.routes.js
│   ├── user.routes.js
│   ├── ticket.routes.js
│   ├── department.routes.js
│   ├── category.routes.js
│   ├── notification.routes.js
│   ├── stats.routes.js
│   └── admin.routes.js
├── controllers/                # Route handlers and business logic orchestration
│   ├── auth.controller.js
│   ├── user.controller.js
│   ├── ticket.controller.js
│   └── [other domain controllers]
├── models/                     # Mongoose schemas (User, Ticket, Department, Category, etc.)
├── middleware/                 # Express middleware
│   ├── auth.js                 # JWT authentication, refresh token handling
│   ├── rbac.js                 # Role-based access control enforcement
│   ├── validate.js             # Zod schema validation middleware
│   ├── errorHandler.js         # Global error handling
│   ├── upload.js               # Multer file upload configuration
│   ├── sanitizer.js            # NoSQL injection and XSS protection
├── services/                   # Business logic and external integrations
│   ├── email.service.js        # Nodemailer email sending
│   ├── socket.service.js       # Socket.io setup and event handlers
│   └── [other services]
├── validators/                 # Zod validation schemas for API inputs
├── scripts/                    # Utility scripts (seed.js, seed-superadmin.js)
└── utils/                      # Helper utilities
```

### Frontend (`frontend/src/`)

```
├── app/                        # Next.js App Router pages
│   ├── (auth)/                 # Authentication group routes
│   │   ├── login/page.js
│   │   ├── register/page.js
│   │   ├── forgot-password/page.js
│   │   └── layout.js           # Auth layout wrapper
│   ├── (dashboard)/            # Protected dashboard routes
│   │   ├── dashboard/page.js   # Main dashboard
│   │   ├── tickets/
│   │   │   ├── page.js         # Ticket list (table/card/kanban)
│   │   │   ├── new/page.js     # Create ticket form
│   │   │   └── [id]/page.js    # Ticket detail view
│   │   ├── departments/page.js # Department management
│   │   ├── categories/page.js  # Category management
│   │   ├── users/page.js       # User management (SuperAdmin only)
│   │   ├── analytics/page.js   # Dashboards and KPIs
│   │   ├── settings/page.js    # System settings
│   │   └── layout.js           # Dashboard layout wrapper
│   ├── layout.js               # Root layout (fonts, metadata, RouteGuard)
│   └── page.js                 # Root redirect page
├── components/                 # React components
│   ├── auth/                   # Authentication components (RouteGuard, LoginForm)
│   ├── dashboard/              # Dashboard-specific components
│   ├── tickets/                # Ticket-related components (TicketForm, TicketCard, KanbanBoard)
│   ├── common/                 # Reusable components (Button, Dialog, Toaster)
│   └── layout/                 # Layout components (Navbar, Sidebar)
├── hooks/                      # Custom React hooks
│   ├── useAuth.js              # Authentication state and user context
│   └── [other hooks]
├── store/                      # Zustand store (client-side state)
│   ├── authStore.js            # User session and auth state
│   ├── ticketStore.js          # Ticket filters, sorting, view mode
│   └── [other stores]
├── lib/                        # Utilities
│   ├── api.js                  # Axios instance with JWT interceptors
│   ├── constants.js            # App-wide constants and enums
│   └── utils.js                # Helper functions (cn for Tailwind merging)
├── globals.css                 # Global styles and Tailwind directives
└── .env.local                  # Frontend env variables (API_URL, etc.)
```

## API Architecture

**Base URL:** `http://localhost:5000/api`

**Response Format:**

```javascript
// Success
{ "success": true, "data": {...}, "message": "Operation successful" }

// Paginated
{ "success": true, "data": [...], "pagination": { "page": 1, "limit": 50, "total": 234, "pages": 5 } }

// Error
{ "success": false, "error": "Error message", "details": [...] }
```

**Authentication:** JWT in Authorization header (`Bearer <token>`). Access tokens expire in 30 minutes; refresh tokens valid for 7 days. Tokens stored in httpOnly cookies on the frontend.

**API Documentation:** Available at `http://localhost:5000/api-docs` (Swagger UI) with full endpoint specifications, request/response schemas, and example requests.

**Routes by Domain:**
- `/api/auth` - Login, logout, token refresh, password reset
- `/api/users` - User management, profile, permissions
- `/api/tickets` - Full CRUD, status updates, comments, attachments
- `/api/departments` - Department CRUD and user assignment
- `/api/categories` - Ticket category management
- `/api/notifications` - User notifications, real-time updates
- `/api/stats` - Analytics and KPI data
- `/api/admin` - System administration, settings, audit logs

## Environment Setup

**Backend `.env`** (required fields from `.env.example`):
- `PORT` (default 5000)
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET`, `JWT_REFRESH_SECRET` - Token signing keys (change in production)
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` - Email configuration
- `FRONTEND_URL` - CORS origin
- `NODE_ENV` - development/production

**Frontend `.env.local`** (if needed):
- `NEXT_PUBLIC_API_URL` - Backend API URL (default localhost:5000)

Copy `.env.example` in backend folder to `.env` before running. Frontend uses Next.js environment variable conventions (`.env.local`, `.env.development.local`).

## Security Considerations

- **Password Hashing:** Bcrypt minimum 10 rounds required
- **Input Validation:** All API inputs validated with Zod schemas before processing
- **SQL/NoSQL Injection:** Mongoose parameterized queries + mongo-sanitize middleware
- **XSS Protection:** xss-clean middleware + DOMPurify on frontend for user content
- **CORS:** Configured to allow frontend domain only
- **Helmet:** HTTP security headers enabled (CSP, X-Frame-Options, etc.)
- **Rate Limiting:** Implemented but commented out (uncomment in production)
- **JWT:** Httponly cookies prevent XSS token theft
- **File Uploads:** Multer validates file type and size; stored outside web root

## Testing Approach

**Backend:** Jest + Supertest for API endpoint testing. Run `npm test` in backend folder.

**Frontend:** Testing setup to be implemented (Jest + React Testing Library recommended).

Test data seeding available via:
- `npm run seed` - Full sample dataset (users, departments, tickets)
- `npm run seed:super` - Superadmin user only for initial setup

## Data Models Summary

- **User** - employeeId, role, department, permissions object, authentication
- **Ticket** - Auto-generated ID (TKT-YYYY-NNN), full lifecycle tracking, statusHistory array, SLA fields
- **Department** - head reference, display settings (color, icon)
- **Category** - Ticket classification, default priority/SLA
- **Comment** - Linked to ticket, visibility flag (public/internal), timestamps
- **Attachment** - File metadata, original name, MIME type, upload path
- **Notification** - User alerts for ticket events, read/unread status
- **AuditLog** - System-wide activity tracking for compliance

## Deployment Notes

- Backend runs on configurable PORT (default 5000), requires MongoDB connection
- Frontend builds with `npm run build`, deploys to standard Node.js server or static host
- Socket.io configured for real-time features; ensure WebSocket support in production environment
- File uploads stored in `./uploads` directory (must be writable and backed up in production)
- Email notifications require valid SMTP credentials in environment variables
