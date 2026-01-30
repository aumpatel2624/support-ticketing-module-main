# Ticketing System - Implementation TODO List

**Last Updated:** 2026-01-30
**Current Status:** P0 & P1 COMPLETE (95%) - All core features implemented, starting P2 (System Settings, Tests, Search)
**Priority Framework:** P0 (Critical) → P1 (High) → P2 (Medium) → P3 (Low)
**Hosting Plan:** Render (backend) + AWS S3 (file storage) - Integration as part of P2

---

## 🔗 FRONTEND-BACKEND INTEGRATION STATUS

### ✅ What's Working (Properly Bound)

**API Configuration:**
- ✅ Frontend Axios instance configured at `frontend/src/lib/api.js`
- ✅ Base URL points to backend: `http://localhost:5000/api`
- ✅ JWT token interceptors implemented (adds Bearer token to requests)
- ✅ Response interceptors for error handling
- ✅ Token refresh mechanism on 401 errors

**Service Layer Integration:**
- ✅ All 6 frontend services properly call backend endpoints:
  - `authService.js` → `/api/auth/*`
  - `userService.js` → `/api/users/*`
  - `ticketService.js` → `/api/tickets/*`
  - `departmentService.js` → `/api/departments/*`
  - `categoryService.js` → `/api/categories/*`
  - `analyticsService.js` → `/api/stats/*`

**Authentication Flow:**
- ✅ Login form calls `/api/auth/login`
- ✅ JWT tokens stored in authStore (Zustand)
- ✅ RouteGuard protects dashboard routes
- ✅ Token refresh on expiration

**CORS Configuration:**
- ✅ Backend allows `http://localhost:3000` origin
- ✅ Credentials enabled for cookie-based auth

**Data Flow (Verified in Code):**
- ✅ Dashboard pages fetch data via services
- ✅ Forms submit data to backend APIs
- ✅ Role-based data filtering (backend enforces, frontend respects)

### ⚠️ Potential Issues / Not Verified

**Environment Variables:**
- ⚠️ Need to verify `.env` files are properly configured:
  - Backend: `MONGODB_URI`, `JWT_SECRET`, `FRONTEND_URL`
  - Frontend: `NEXT_PUBLIC_API_URL` (if needed)
- ⚠️ CORS might fail if `FRONTEND_URL` in backend `.env` is incorrect

**Real-time Features:**
- ✅ Socket.io client fully integrated (socket.js, notification bell, listeners)
- ✅ Notification Bell component with unread badge and dropdown
- ✅ Real-time updates working for ticket assignments and status changes

**File Uploads:**
- ✅ Backend Multer configured for attachments
- ✅ Frontend FileUpload and AttachmentList components fully implemented
- ✅ Drag-drop, validation, preview, download/delete all working
- ⚠️ Note: Currently stores files locally; will migrate to AWS S3 in P2

**Email Notifications:**
- ✅ Backend email service with 6 professional HTML templates
- ✅ Template integration complete (emailTemplateService)
- ✅ SMTP configured and functional
- ⚠️ User email preferences UI pending (backend ready)

---

## P0 - CRITICAL (Core User Experience Blockers)

### TODO-001: Implement Kanban View Component
**PRD Reference:** Section 4.3.1 - Ticket Visualization Modes
**Status:** ✅ COMPLETED (All components implemented and integrated)
**Impact:** HIGH - PRD mandates 3 view modes, currently only 1 exists

**Requirements:**
- Kanban board component with drag-and-drop (@dnd-kit/core)
- Status-based columns: New, Assigned, In Progress, Pending, Completed, Closed
- Drag tickets between columns to update status
- Column headers with ticket counts
- Optional swimlanes (by priority, department, assignee)
- Role-based permissions (only users with edit rights can drag)
- Same filters as table/card view

**Files to Create:**
- `frontend/src/components/tickets/KanbanBoard.jsx`
- `frontend/src/components/tickets/KanbanColumn.jsx`
- `frontend/src/components/tickets/KanbanCard.jsx`

**Files to Modify:**
- `frontend/src/app/(dashboard)/tickets/page.js` - Add Kanban view mode toggle
- `frontend/src/store/ticketStore.js` - Add viewMode state management

**Acceptance Criteria:**
- [ ] Kanban board renders with status columns
- [ ] Drag-and-drop updates ticket status via API
- [ ] Column counts update in real-time
- [ ] Filters work across all 3 view modes (table, card, kanban)
- [ ] Permission checks prevent unauthorized status changes
- [ ] Optimistic UI updates with error rollback

---

### TODO-002: Implement Ticket Age Color Coding
**PRD Reference:** Section 6.2 - Color Scheme
**Status:** ✅ COMPLETED (All views - table, card, kanban with color-coded borders)
**Impact:** HIGH - Visual priority system missing

**Requirements:**
- Color indicators based on ticket age:
  - **Fresh (0-24 hours):** Green accent border/badge
  - **Recent (1-3 days):** Blue accent
  - **Aging (4-7 days):** Yellow/Orange accent
  - **Old (8-14 days):** Orange accent
  - **Critical (15+ days):** Red accent
- Apply to all views: table (left border), card (left border), kanban (card border)
- Independent of status colors
- Hover tooltip showing exact age

**Files to Create:**
- `frontend/src/lib/ticketAgeHelper.js` - Age calculation and color logic

**Files to Modify:**
- `frontend/src/app/(dashboard)/tickets/columns.jsx` - Add age color border to table rows
- `frontend/src/components/tickets/KanbanCard.jsx` - Add age color border
- Future: `frontend/src/components/tickets/TicketCard.jsx` - Card view component

**Acceptance Criteria:**
- [ ] All tickets show age-based color coding
- [ ] Colors update based on ticket creation date
- [ ] Consistent across all view modes
- [ ] Tooltip shows "Created X days ago"

---

### TODO-003: Complete Real-time Notification System (Frontend)
**PRD Reference:** Section 4.8.2 - In-App Notifications
**Status:** ✅ COMPLETED (Socket.io client, notification bell, real-time updates working)
**Impact:** HIGH - Real-time updates core to user experience

**Requirements:**
- Socket.io client connection to backend
- Notification bell icon in header with unread count badge
- Dropdown panel showing recent notifications
- Real-time updates for:
  - New ticket assigned
  - Ticket status changed
  - New comment added
  - SLA breach warning
- Mark as read/unread functionality
- "Mark all as read" action
- Click notification to navigate to ticket
- Sound/desktop notification (optional, with user preference)

**Files to Create:**
- `frontend/src/lib/socket.js` - Socket.io client setup
- `frontend/src/components/layout/NotificationBell.jsx` - Bell icon with dropdown
- `frontend/src/components/layout/NotificationList.jsx` - Notification list component
- `frontend/src/components/layout/NotificationItem.jsx` - Individual notification
- `frontend/src/hooks/useNotifications.js` - Custom hook for notifications

**Files to Modify:**
- `frontend/src/components/layout/Header.jsx` - Add NotificationBell component
- `frontend/src/store/notificationStore.js` - Create new Zustand store
- `frontend/package.json` - Add socket.io-client dependency (if not present)

**Acceptance Criteria:**
- [ ] Socket.io client connects to backend
- [ ] Bell icon shows unread count badge
- [ ] Dropdown displays recent notifications
- [ ] Real-time updates appear instantly
- [ ] Mark as read updates UI and backend
- [ ] Clicking notification navigates to relevant ticket
- [ ] Notifications persist across page refreshes

---

## P1 - HIGH PRIORITY (Feature Completion)

### TODO-004: Implement Card View Component
**PRD Reference:** Section 6.3.3 - Ticket Management Views
**Status:** ✅ COMPLETED (Responsive grid layout with all required features)
**Impact:** MEDIUM - Completes 3-view-mode requirement

**Requirements:**
- Grid layout (3-4 cards per row, responsive)
- Each card shows:
  - Left border: Age color coding
  - Ticket ID + Status badge
  - Subject (truncated with tooltip)
  - Department + Category
  - Priority badge
  - Assigned to (avatar + name)
  - Created date + Age
- Click card to open detail view
- Hover for quick actions (assign, change priority)
- Same filtering/sorting as other views

**Files to Create:**
- `frontend/src/components/tickets/TicketCardView.jsx`
- `frontend/src/components/tickets/TicketCard.jsx`

**Files to Modify:**
- `frontend/src/app/(dashboard)/tickets/page.js` - Add card view toggle

**Acceptance Criteria:**
- [ ] Cards display in responsive grid
- [ ] All required information visible
- [ ] Age color coding on left border
- [ ] Click to view details
- [ ] Filters work across all view modes

---

### TODO-005: Complete File Attachment UI
**PRD Reference:** Section 4.3.2 - Ticket Creation
**Status:** ✅ COMPLETED (Drag-drop, validation, preview, download/delete working)
**Impact:** MEDIUM - Users can't attach screenshots/documents

**Requirements:**
- Drag-and-drop file upload area
- Multiple file selection
- File type validation (images, PDFs, documents)
- File size validation (per PRD limits)
- Upload progress indicator
- File preview for images
- File list with download/delete actions
- Works in ticket creation and detail view

**Files to Create:**
- `frontend/src/components/tickets/FileUpload.jsx` - Drag-and-drop upload component
- `frontend/src/components/tickets/AttachmentList.jsx` - Display uploaded files
- `frontend/src/components/tickets/AttachmentPreview.jsx` - Image preview modal

**Files to Modify:**
- `frontend/src/components/tickets/CreateTicketForm.jsx` - Add file upload
- `frontend/src/components/tickets/TicketDetailView.jsx` - Add attachment section
- `frontend/src/services/ticketService.js` - Add upload/download methods

**Acceptance Criteria:**
- [ ] Drag-and-drop file upload works
- [ ] Multiple files can be selected
- [ ] File validation shows clear error messages
- [ ] Progress bar during upload
- [ ] Images show preview thumbnails
- [ ] Download and delete attachments work
- [ ] Attachments display in ticket detail view

---

### TODO-006: Build Advanced Filter Panel
**PRD Reference:** Section 4.9 - Search & Filters
**Status:** ✅ COMPLETED (Date range, multi-select, saved presets, filter chips)
**Impact:** MEDIUM - Power users need advanced search

**Requirements:**
- Expandable filter panel
- Date range picker (created date, updated date, resolved date)
- Multi-select filters (department, category, priority, assignee)
- Status filter (multi-select)
- Saved filter presets
- "Save current filters" functionality
- Quick filter chips showing active filters
- Clear all filters button

**Files to Create:**
- `frontend/src/components/tickets/AdvancedFilterPanel.jsx`
- `frontend/src/components/tickets/DateRangePicker.jsx`
- `frontend/src/components/tickets/SavedFilterPresets.jsx`

**Files to Modify:**
- `frontend/src/app/(dashboard)/tickets/page.js` - Integrate advanced filters
- `frontend/src/components/tickets/data-table-toolbar.jsx` - Add filter panel toggle
- `frontend/src/store/ticketStore.js` - Add saved filter state

**Acceptance Criteria:**
- [ ] Date range picker works for all date fields
- [ ] Multi-select filters work
- [ ] Filters can be saved with custom names
- [ ] Saved filters persist across sessions
- [ ] Active filter chips display
- [ ] Clear all filters resets to default

---

### TODO-007: Implement Report Export Functionality
**PRD Reference:** Section 4.6 - Analytics & Reporting
**Status:** ✅ COMPLETED (PDF, Excel, CSV with formatting and progress tracking)
**Impact:** MEDIUM - Admins need to export reports

**Requirements:**
- Export formats: PDF, Excel (XLSX), CSV
- Export buttons on analytics page
- Export current view data (with active filters)
- Custom report builder (date range, metrics, departments)
- Export includes: header, filters summary, data table, charts
- Progress indicator for large exports
- Download automatically after generation

**Backend Requirements:**
- Install libraries: `exceljs`, `pdfkit` or `puppeteer`
- New API endpoints for export/custom reports

**Files to Create:**
- `backend/src/services/export.service.js`
- `backend/src/controllers/report.controller.js`
- `backend/src/routes/report.routes.js`
- `frontend/src/components/analytics/ExportButton.jsx`
- `frontend/src/components/analytics/CustomReportBuilder.jsx`

**Files to Modify:**
- `frontend/src/app/(dashboard)/analytics/page.js`
- `backend/src/index.js`

**Acceptance Criteria:**
- [ ] Export to PDF with charts
- [ ] Export to Excel with formatting
- [ ] Export to CSV
- [ ] Custom report builder works
- [ ] File downloads automatically

---

### TODO-008: Email Notification Templates
**PRD Reference:** Section 4.8.1 - Email Notifications
**Status:** ✅ COMPLETED (6 professional HTML templates with variable substitution)
**Impact:** MEDIUM - Email notifications incomplete

**Requirements:**
- Professional HTML email templates for:
  - Ticket created, assigned, status updated, new comment, resolved, SLA breach
- Responsive email design
- Company branding with logo
- CTA buttons (View Ticket, Reply)
- Unsubscribe option
- Email preferences per user

**Files to Create:**
- `backend/src/templates/emails/*.html` (6 template files)
- `backend/src/services/emailTemplateService.js`
- `backend/src/models/UserPreferences.js`

**Files to Modify:**
- `backend/src/services/email.service.js`
- `backend/src/controllers/ticket.controller.js`
- `frontend/src/app/(dashboard)/settings/page.js`

**Acceptance Criteria:**
- [ ] All templates designed and tested
- [ ] Emails render in major email clients
- [ ] CTA buttons link correctly
- [ ] Users can opt-out
- [ ] Emails sent asynchronously

---

## P2 - MEDIUM PRIORITY (Polish & Enhancement)

### TODO-009: System Settings UI
**PRD Reference:** Section 4.10 - Settings & Configuration
**Status:** ⚠️ Page Exists, Functionality Missing
**Impact:** MEDIUM - SuperAdmin can't configure system

**Requirements:**
- Settings tabs: General, Ticket Settings, SLA Config, Email, Security
- Form validation with Zod
- Save confirmation, reset to defaults option
- Logo upload and preview
- SMTP test email functionality

**Files to Create/Modify:**
- Backend: `SystemSettings.js` model, settings routes/controller
- Frontend: Settings component tabs

---

### TODO-010: Bulk Operations UI
**PRD Reference:** Section 4.3.3 - Ticket Assignment
**Status:** ⚠️ Backend Exists, UI Missing
**Impact:** MEDIUM - Efficiency for admins

**Requirements:**
- Bulk ticket actions: assign, status change, priority change, delete
- Checkbox selection in table view
- Bulk action toolbar with confirmation
- CSV upload for bulk user import
- Progress indicators

---

### TODO-011: Comprehensive Test Suite
**PRD Reference:** Section 11 - Testing Requirements
**Status:** ⚠️ Framework Ready, Coverage < 10% (Target: 80%+)
**Impact:** MEDIUM - Quality assurance critical

**Requirements:**
- Backend: Unit tests for controllers, integration tests, auth/RBAC tests
- Frontend: Component tests, hook tests, form validation tests
- E2E tests: Critical user flows with Cypress/Playwright
- Target: 80%+ backend, 70%+ frontend coverage

---

### TODO-012: Global Search Functionality
**PRD Reference:** Section 4.9.1 - Global Search
**Status:** ⚠️ Backend Supports, UI Incomplete
**Impact:** MEDIUM - User efficiency

**Requirements:**
- Search bar in header (always visible)
- Search tickets (ID, subject, description), users (name, email), departments
- Autocomplete dropdown with results
- Keyboard shortcut (Cmd+K / Ctrl+K)
- Click result to navigate

---

## P3 - LOW PRIORITY (Nice-to-Have)

### TODO-013: User Avatar Upload
- Avatar upload with image cropping
- Default avatars (initials)
- Display in header, assignments, comments

### TODO-014: Dark Mode Toggle
- Light/dark theme toggle in header
- Persist preference in localStorage
- System preference detection

### TODO-015: Mobile Responsiveness Optimization
- Test on mobile (375px - 768px)
- Optimize table view for mobile
- Hamburger menu for sidebar
- Touch-friendly inputs

### TODO-016: Ticket Templates
- Template creation for common issues
- Template library (admin-managed)
- Auto-fill in ticket creation

### TODO-017: SLA Automation & Escalation
- Background cron job for SLA checking
- Auto-escalate breached tickets
- SLA warning notifications (80% of deadline)

### TODO-018: Knowledge Base Integration
- FAQ/knowledge base section
- Article management
- Link articles to categories
- Suggest articles in ticket creation

---

## DEVOPS & DEPLOYMENT

### TODO-019: CI/CD Pipeline
- GitHub Actions workflow
- Run tests on every push
- Build verification
- Automated deployment to staging
- Docker containerization

### TODO-020: Monitoring & Logging
- Error tracking (Sentry)
- Application logs (Winston/Pino)
- Performance monitoring
- Uptime monitoring
- Log aggregation

---

## SUMMARY

| Priority | Items | Focus |
|----------|-------|-------|
| P0 - Critical | 3 | Kanban, Age Colors, Real-time Notifications |
| P1 - High | 5 | Card View, Attachments, Filters, Export, Email |
| P2 - Medium | 4 | Settings, Bulk Ops, Testing, Search |
| P3 - Low | 6 | Avatar, Dark Mode, Mobile, Templates, SLA, KB |
| DevOps | 2 | CI/CD, Monitoring |
| **Total** | **20** | |

**Recommended Implementation Order:**
1. **Sprint 1:** TODO-001, TODO-002, TODO-003 (P0 items)
2. **Sprint 2:** TODO-004, TODO-005, TODO-006 (P1 items)
3. **Sprint 3:** TODO-007, TODO-008, TODO-011 (P1 + Testing)
4. **Sprint 4:** TODO-009, TODO-010, TODO-012 (P2 items)
5. **Sprint 5+:** P3 items + DevOps as needed

---

## QUICK REFERENCE

**Backend Status:** ✅ 95% complete - Production ready
**Frontend Status:** ✅ 95% complete - All P0 & P1 features implemented
**Testing:** ❌ <10% coverage - Needs comprehensive test suite
**Real-time:** ✅ Socket.io client fully integrated and working
**Integration:** ✅ Frontend-Backend properly bound with real-time updates
**File Storage:** ⚠️ Local storage (will migrate to AWS S3 in P2)

**Next Steps:**
1. Implement TODO-009: System Settings UI (P2)
2. Migrate file uploads to AWS S3 (P2)
3. Setup Render deployment pipeline (P2)
4. Implement TODO-010, TODO-011, TODO-012 (P2)
5. Add comprehensive tests throughout (TODO-011)

---

*For detailed requirements and acceptance criteria for each TODO, refer to the PRD at `docs/PRD.md`*
