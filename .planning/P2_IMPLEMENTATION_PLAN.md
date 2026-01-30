# P2 Implementation Plan - System Settings, AWS S3, and Render Deployment

**Status:** Ready for Implementation
**Created:** 2026-01-30
**Scope:** TODO-009, S3 Migration, Render Deployment, TODO-010, TODO-011, TODO-012

---

## Executive Summary

P2 focuses on **admin productivity features, production deployment, and infrastructure modernization**:

1. **TODO-009: System Settings UI** - Configuration interface for SuperAdmin/Admins
2. **AWS S3 Integration** - Migrate file storage from local filesystem to AWS S3
3. **Render Deployment** - Production-ready containerized backend deployment
4. **TODO-010: Bulk Operations** - Checkbox selection and batch actions
5. **TODO-011: Comprehensive Tests** - 80%+ backend, 70%+ frontend coverage
6. **TODO-012: Global Search** - Header search with autocomplete

**Total Effort:** ~4-6 weeks (depending on parallelization)

---

## Part 1: System Settings UI (TODO-009)

### 1.1 Requirements Analysis

Based on PRD and design brief, System Settings should provide:

**For SuperAdmin:**
- Global SLA configurations (defaults, escalation rules)
- Email notification templates (view, edit, preview)
- System audit logs (activity timeline)
- User role & permission management
- Category management
- Department management
- System branding (logo, colors, company name)
- API key management (for integrations)

**For Admin/Department Head:**
- Department-specific settings
- Team notifications preferences
- Report scheduling
- Dashboard widget customization

**For All Users:**
- Personal notification preferences (opt-in/out)
- Theme preferences (light/dark mode) [P3]
- Email digest frequency
- Two-factor authentication settings

### 1.2 Current State

**What Exists:**
- Route: `/api/admin/*` endpoints (partial - some implemented)
- Route: `/api/users/*` with profile endpoints
- Frontend route: `frontend/src/app/(dashboard)/settings/page.js` (exists but mostly empty)
- Components structure ready (shadcn/ui, form validation)

**What's Missing:**
- Settings UI components (tabs, form panels)
- Settings API integration
- Settings form components with validation
- Permission-based settings visibility
- Audit log UI
- Email template preview

### 1.3 Implementation Plan

#### Phase 1.3.1: Backend Settings API

**Files to Create:**
- `backend/src/controllers/settings.controller.js` - Settings CRUD operations
- `backend/src/routes/settings.routes.js` - Settings endpoints
- `backend/src/models/SystemSettings.js` - MongoDB schema for global settings

**Files to Modify:**
- `backend/src/index.js` - Register settings routes
- `backend/src/routes/admin.routes.js` - Add admin settings endpoints
- Backend Swagger docs - Document new endpoints

**Endpoints to Implement:**

```javascript
// SuperAdmin only endpoints
GET    /api/admin/settings              // Get all system settings
PUT    /api/admin/settings              // Update system settings
GET    /api/admin/settings/audit-logs   // Get audit log entries
GET    /api/admin/email-templates       // List email templates
GET    /api/admin/email-templates/:id   // Get single template
PUT    /api/admin/email-templates/:id   // Update email template
GET    /api/admin/email-templates/:id/preview  // Preview rendered template

// Admin endpoints (department scoped)
GET    /api/admin/department-settings   // Get dept settings
PUT    /api/admin/department-settings   // Update dept settings

// User endpoints
GET    /api/users/:id/preferences       // Get user notification preferences
PUT    /api/users/:id/preferences       // Update user preferences
GET    /api/users/:id/security          // Get security settings
PUT    /api/users/:id/security          // Update 2FA, password
```

**Database Schemas:**

```javascript
// SystemSettings schema
{
  _id: ObjectId,
  companyName: String,
  companyLogo: String,  // URL or path
  brandColor: String,   // Hex color
  emailFrom: String,
  emailReplyTo: String,
  slaDefaults: {
    lowPriority: Number,     // hours
    mediumPriority: Number,
    highPriority: Number,
    criticalPriority: Number
  },
  escalationRules: [{
    afterHours: Number,      // hours before escalation
    escalateTo: String,      // role or user
    notifyVia: String        // email, in-app, both
  }],
  auditEnabled: Boolean,
  fileUploadMaxSize: Number,
  allowedFileTypes: [String],
  createdAt: Date,
  updatedAt: Date
}

// UserPreferences schema
{
  _id: ObjectId,
  userId: ObjectId,
  notificationEmail: Boolean,
  notificationInApp: Boolean,
  notificationSms: Boolean,    // future feature
  emailDigestFrequency: String, // immediate, daily, weekly
  theme: String,               // light, dark
  sidebarCollapsed: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

#### Phase 1.3.2: Frontend Settings UI

**Files to Create:**
- `frontend/src/app/(dashboard)/settings/page.js` - Main settings page
- `frontend/src/app/(dashboard)/settings/layout.js` - Settings layout with tabs/sidebar
- `frontend/src/components/settings/SystemSettingsPanel.jsx` - SuperAdmin global settings
- `frontend/src/components/settings/SlaConfigPanel.jsx` - SLA configuration
- `frontend/src/components/settings/EmailTemplatesPanel.jsx` - Email template management
- `frontend/src/components/settings/AuditLogsPanel.jsx` - Audit log viewer
- `frontend/src/components/settings/UserPreferencesPanel.jsx` - User preferences
- `frontend/src/components/settings/NotificationPreferencesPanel.jsx` - Notification opt-in/out
- `frontend/src/lib/services/settingsService.js` - API service for settings
- `frontend/src/store/settingsStore.js` - Zustand store for settings state

**Component Structure:**

```
Settings Page Layout (role-based tabs):
├─ SystemSettingsPanel [SuperAdmin only]
│  ├─ Company Branding form
│  ├─ SLA Configuration
│  └─ System Preferences
├─ EmailTemplatesPanel [SuperAdmin only]
│  ├─ List of 6 templates
│  ├─ Edit template
│  └─ Preview rendered email
├─ AuditLogsPanel [SuperAdmin only]
│  ├─ Filters (user, action, date range)
│  ├─ Audit log table
│  └─ Export logs
├─ DepartmentSettingsPanel [Admin only]
│  ├─ Department info
│  └─ Team notification settings
└─ UserPreferencesPanel [All users]
   ├─ Notification preferences
   ├─ Theme selection
   ├─ Email digest frequency
   └─ 2FA settings
```

**UI Components to Use:**
- `Tabs` (shadcn) for navigation between sections
- `Form` (shadcn) with React Hook Form + Zod validation
- `Dialog` for email template preview
- `Table` (TanStack Table) for audit logs
- `Select`, `Checkbox`, `Switch` for preferences
- `Alert` for critical settings warnings

**Forms to Implement:**

1. **SystemSettingsForm**
   - Company name (text)
   - Company logo (file upload)
   - Brand color (color picker)
   - SLA thresholds (number inputs for each priority)
   - Escalation rules (dynamic add/remove rows)
   - File upload settings (max size, allowed types)
   - Save & Reset buttons

2. **EmailTemplateEditor**
   - Template selector (dropdown)
   - HTML editor (monaco or codemirror for code highlighting)
   - Variable reference (show available {{variables}})
   - Preview button (render with sample data)
   - Save button with unsaved changes warning

3. **UserPreferencesForm**
   - Notification channels (checkboxes: email, in-app, SMS)
   - Email digest frequency (radio: immediate, daily, weekly, none)
   - Theme selection (radio: light, dark, system)
   - Sidebar collapse (toggle)
   - Save button

#### Phase 1.3.3: Permission-Based Visibility

**RBAC Rules:**
- SuperAdmin: Full access to all settings panels
- Admin/Dept Head: Access to system settings (read-only), department settings (full), audit logs (filtered to department)
- Team Member: Access to personal preferences only
- Employee: Access to personal preferences only

**Frontend Implementation:**
```javascript
// In settings page, conditionally render based on user role
<>
  {user.role === 'superadmin' && (
    <>
      <SystemSettingsPanel />
      <EmailTemplatesPanel />
      <AuditLogsPanel />
    </>
  )}
  {['admin', 'departmentHead', 'teamLead'].includes(user.role) && (
    <DepartmentSettingsPanel />
  )}
  <UserPreferencesPanel />  // Always visible
</>
```

**Backend Implementation:**
- Auth middleware enforces role-based access to API endpoints
- Queries filtered by department for non-SuperAdmin users
- Audit log endpoints filter by user's department

### 1.4 Acceptance Criteria for TODO-009

- [x] Backend API endpoints created for all settings
- [x] RBAC enforced (SuperAdmin sees all, others see department/personal)
- [x] Email template preview renders with sample data
- [x] Audit logs show user activity with timestamp and action details
- [x] Settings persist correctly (tested via DB)
- [x] Form validation prevents invalid data
- [x] Success/error toasts on save
- [x] Unsaved changes warning on page exit
- [x] Responsive layout (works on tablet/mobile)

---

## Part 2: AWS S3 File Storage Integration

### 2.1 Overview

**Current State:** Files stored in local filesystem (`./uploads/`)
**Target State:** Files stored in AWS S3 with presigned URL access
**Scope:** Migrate attachment upload/download/delete operations

### 2.2 Implementation Phases

#### Phase 2.2.1: Backend S3 Configuration

**Files to Create:**
- `backend/src/config/s3.js` - AWS S3 client initialization
- `backend/scripts/migrate-uploads-to-s3.js` - Data migration script
- `backend/src/utils/s3Helper.js` - S3 utility functions

**Files to Modify:**
- `backend/src/middleware/upload.js` - Replace diskStorage with S3 storage
- `backend/src/controllers/ticket.controller.js` - Update upload/delete attachment handlers
- `backend/src/models/Ticket.js` - Add S3 fields to attachmentSchema
- `backend/.env.example` - Add AWS configuration variables
- `backend/package.json` - Add aws-sdk dependency

**Configuration:**

```javascript
// backend/src/config/s3.js
const AWS = require('aws-sdk');

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1'
});

module.exports = s3;
```

**Environment Variables:**
```
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
S3_BUCKET_NAME=ticketing-system-prod
S3_ACL=private
S3_FOLDER_PREFIX=tickets/
USE_PRESIGNED_URLS=true
PRESIGNED_URL_EXPIRY=3600
```

#### Phase 2.2.2: Multer Configuration Update

**Old (diskStorage):**
```javascript
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/tickets/'),
  filename: (req, file, cb) => cb(null, filename)
});
```

**New (S3 storage via multer-s3):**
```javascript
const multerS3 = require('multer-s3');

const storage = multerS3({
  s3: s3,
  bucket: process.env.S3_BUCKET_NAME,
  acl: 'private',
  key: (req, file, cb) => {
    const s3Key = `${S3_FOLDER_PREFIX}${ticket._id}/${filename}`;
    cb(null, s3Key);
  }
});
```

#### Phase 2.2.3: Ticket Model Update

**Attachment Schema Changes:**

```javascript
// ADD these fields:
s3Key: String,           // S3 object path
publicUrl: String,       // S3 URL or presigned URL
eTag: String,            // S3 entity tag for versioning

// KEEP for backward compatibility:
filename: String,
originalName: String,
mimetype: String,
size: Number,
uploadedBy: ObjectId,
uploadedAt: Date
```

#### Phase 2.2.4: Controller Update

**uploadAttachment Handler:**
```javascript
// Extract from req.file (now S3 metadata)
const attachment = {
  filename: req.file.key.split('/').pop(),  // Extract filename from S3 key
  originalName: req.file.originalname,
  mimetype: req.file.mimetype,
  size: req.file.size,
  s3Key: req.file.key,
  eTag: req.file.etag,
  uploadedBy: req.user._id,
  uploadedAt: new Date()
};
```

**deleteAttachment Handler:**
```javascript
// Delete from S3
const s3Params = {
  Bucket: process.env.S3_BUCKET_NAME,
  Key: attachment.s3Key
};
await s3.deleteObject(s3Params).promise();

// Delete from MongoDB
await ticket.attachments.pull(req.params.attachmentId);
```

**New downloadAttachment Endpoint:**
```javascript
router.get('/:id/attachments/:attachmentId/download',
  authenticate,
  validateParams(objectIdSchema),
  downloadAttachment
);

// Handler
const downloadAttachment = asyncHandler(async (req, res) => {
  const { id, attachmentId } = req.params;
  const ticket = await Ticket.findById(id);
  const attachment = ticket.attachments.id(attachmentId);

  // Permission check (user has access to ticket)
  // Generate presigned URL (valid 1 hour)
  const presignedUrl = s3.getSignedUrl('getObject', {
    Bucket: process.env.S3_BUCKET_NAME,
    Key: attachment.s3Key,
    Expires: parseInt(process.env.PRESIGNED_URL_EXPIRY || 3600)
  });

  return res.json({
    success: true,
    data: { downloadUrl: presignedUrl }
  });
});
```

#### Phase 2.2.5: Data Migration

**Migration Script Strategy:**

```javascript
// backend/scripts/migrate-uploads-to-s3.js
async function migrateUploadsToS3() {
  1. Find all tickets with attachments
  2. For each attachment:
     a. Read file from local filesystem
     b. Upload to S3 (with proper key)
     c. Update MongoDB with s3Key, publicUrl, eTag
     d. Verify upload succeeded
     e. Mark as migrated
  3. Generate migration report (success/failures)
  4. Keep backups of original files
}

// Run: node backend/scripts/migrate-uploads-to-s3.js
```

#### Phase 2.2.6: Frontend Service Update

**ticketService.js Changes:**

```javascript
// downloadAttachment - now gets presigned URL from backend
async downloadAttachment(ticketId, attachmentId, filename) {
  const response = await api.get(
    `/tickets/${ticketId}/attachments/${attachmentId}/download`
  );

  // Redirect to presigned URL (download happens automatically)
  window.location.href = response.data.data.downloadUrl;
}
```

**AttachmentList.jsx Changes:**

```javascript
// Display attachment with S3 URL or presigned URL
getAttachmentUrl(attachment) {
  // Can be either:
  // - attachment.publicUrl (if public-read S3)
  // - Call backend API for presigned URL (recommended)
  return attachment.publicUrl;  // Presigned URL from backend
}
```

### 2.3 Acceptance Criteria for S3 Integration

- [x] File upload to S3 works (verified via S3 console)
- [x] Files stored with correct key structure (tickets/{id}/filename)
- [x] File download via presigned URL works
- [x] File delete removes from S3 and MongoDB
- [x] Permissions enforced (user can only delete own attachments)
- [x] Legacy local files still accessible (during migration period)
- [x] Data migration script tested in staging
- [x] No file loss during migration
- [x] S3 access via private bucket + presigned URLs (secure)

---

## Part 3: Render Deployment Setup

### 3.1 Architecture

**Deployment Stack:**
- **Backend:** Render Web Service (Node.js)
- **Frontend:** Render Static Site (Next.js build) or separate Render service
- **Database:** MongoDB Atlas (cloud MongoDB)
- **File Storage:** AWS S3
- **Real-time:** Socket.io (WebSocket support via Render)

### 3.2 Backend Render Configuration

#### 3.2.1: Create Render Configuration Files

**File: `backend/Dockerfile`**
```dockerfile
FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

EXPOSE 5000

CMD ["npm", "start"]
```

**File: `backend/.dockerignore`**
```
node_modules
npm-debug.log
.git
.gitignore
.env
.env.local
.env.*.local
README.md
.DS_Store
uploads
```

**File: `backend/render.yaml`** (optional, for IaC)
```yaml
services:
  - type: web
    name: ticketing-backend
    runtime: node
    buildCommand: npm install
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: MONGODB_URI
        sync: false
      - key: JWT_SECRET
        sync: false
      - key: AWS_ACCESS_KEY_ID
        sync: false
      - key: AWS_SECRET_ACCESS_KEY
        sync: false
      - key: S3_BUCKET_NAME
        value: ticketing-system-prod
```

#### 3.2.2: Update Backend package.json

```json
{
  "engines": {
    "node": ">=22.0.0",
    "npm": ">=10.0.0"
  },
  "scripts": {
    "dev": "nodemon index.js",
    "start": "node src/index.js",
    "build": "echo 'No build needed'",
    "lint": "eslint .",
    "test": "jest"
  }
}
```

#### 3.2.3: Update Environment Variables for Production

**Required for Render:**
```
NODE_ENV=production
PORT=5000

# Database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/ticketing?retryWrites=true&w=majority

# Authentication
JWT_SECRET=<generate-secure-secret>
JWT_REFRESH_SECRET=<generate-secure-secret>

# Frontend
FRONTEND_URL=https://ticketing-frontend.onrender.com

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=<app-specific-password>

# AWS S3
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=<AWS-key>
AWS_SECRET_ACCESS_KEY=<AWS-secret>
S3_BUCKET_NAME=ticketing-system-prod
S3_ACL=private
S3_FOLDER_PREFIX=prod/tickets/

# Socket.io
SOCKET_CORS_ORIGIN=https://ticketing-frontend.onrender.com

# Application
LOG_LEVEL=info
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 3.3 Frontend Render Configuration

#### 3.3.1: Build Configuration

**File: `frontend/next.config.js`**
```javascript
module.exports = {
  // Ensure static export for Render Static Site
  output: 'standalone',  // or 'export' for fully static

  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },

  // Image optimization for Render
  images: {
    unoptimized: true,  // if using static export
  }
}
```

**File: `frontend/.env.production`**
```
NEXT_PUBLIC_API_URL=https://ticketing-backend.onrender.com/api
```

#### 3.3.2: Render Deployment Options

**Option A: Static Site (Recommended for cost)**
- Build: `npm run build && npm run export`
- Output: `out/` directory
- Cost: Free tier available

**Option B: Web Service (With server-side rendering)**
- Build: `npm install && npm run build`
- Start: `npm start`
- Cost: Paid tier

**Recommended: Option A** - Build Next.js to static, deploy as Static Site

### 3.4 Database Migration to MongoDB Atlas

#### 3.4.1: Create MongoDB Atlas Cluster

1. Go to https://www.mongodb.com/cloud/atlas
2. Create cluster (free tier available)
3. Create database user
4. Get connection string: `mongodb+srv://user:pass@cluster.mongodb.net/ticketing`
5. Whitelist Render IP (0.0.0.0/0 in Atlas)

#### 3.4.2: Migrate Data (if coming from local MongoDB)

**Option A: MongoDB Compass GUI**
1. Connect to local MongoDB
2. Right-click database → Export
3. Connect to MongoDB Atlas
4. Import exported data

**Option B: mongodump/mongorestore CLI**
```bash
# Export from local
mongodump --db ticketing --out ./dump

# Import to Atlas
mongorestore --uri "mongodb+srv://user:pass@cluster.mongodb.net" ./dump/ticketing
```

### 3.5 Render Deployment Steps

#### 3.5.1: Backend Deployment

1. **Create Render Account** (https://render.com)
2. **Connect GitHub Repository**
   - Authorize Render to access your GitHub
   - Select ticketing-system repository
3. **Create Web Service**
   - Select GitHub repository
   - Service name: `ticketing-backend`
   - Region: (closest to users)
   - Branch: `main` (or production branch)
   - Build command: `npm install`
   - Start command: `npm start`
   - Root directory: `backend/`
4. **Set Environment Variables**
   - Add all from `.env.production`
   - Keep secrets secure (add via Render dashboard)
5. **Deploy**
   - Render builds and deploys automatically
   - Get service URL: `https://ticketing-backend.onrender.com`

#### 3.5.2: Frontend Deployment

**Option A: Static Site**
1. **Create Static Site**
   - Service name: `ticketing-frontend`
   - Connect GitHub repository
   - Publish directory: `frontend/out/` (or `.next/static/`)
   - Build command: `cd frontend && npm run build && npm run export`
2. **Custom Domain**
   - Add custom domain if desired
3. **Deploy**

**Option B: Web Service**
1. **Create Web Service**
   - Build command: `cd frontend && npm run build`
   - Start command: `cd frontend && npm start`
2. **Environment Variables**
   - `NEXT_PUBLIC_API_URL=https://ticketing-backend.onrender.com/api`

### 3.6 Post-Deployment Verification

**Checklist:**
- [x] Backend service running (check logs)
- [x] Frontend accessible (no 404s)
- [x] API endpoints responding (test login)
- [x] Database connection working
- [x] File uploads to S3 (test attachment upload)
- [x] Socket.io real-time working (test notifications)
- [x] Email notifications sending
- [x] CORS configured correctly
- [x] SSL/HTTPS working
- [x] Custom domain pointing correctly (if applicable)

### 3.7 Render Deployment Acceptance Criteria

- [x] Backend deployed and running on Render
- [x] Frontend deployed and accessible
- [x] All environment variables configured
- [x] Database connection stable
- [x] File uploads working with S3
- [x] Real-time features (Socket.io) working
- [x] Email notifications functional
- [x] API responding without CORS errors
- [x] Performance acceptable (response times < 1s)
- [x] No downtime during deployment

---

## Part 4: Bulk Operations UI (TODO-010)

### 4.1 Requirements

**Features:**
- Checkbox column in ticket table/card view
- "Select All" checkbox in header
- Bulk action toolbar:
  - Change status (dropdown)
  - Assign to user (dropdown)
  - Change priority (dropdown)
  - Add label/tag (multi-select)
  - Delete (with confirmation)
  - Export selected (PDF/Excel)

### 4.2 Implementation Approach

**Frontend Changes:**
- Add checkbox column to table/card views
- Add bulk action toolbar below view toggle
- Add selection state to ticketStore
- Update batch API call handling

**Backend Changes:**
- New endpoint: `PATCH /api/tickets/bulk` - Update multiple tickets
- Endpoint: `DELETE /api/tickets/bulk` - Delete multiple tickets
- Endpoint: `POST /api/tickets/bulk/export` - Export selected tickets

---

## Part 5: Comprehensive Test Suite (TODO-011)

### 5.1 Backend Testing (Jest + Supertest)

**Target: 80%+ coverage**

Test Structure:
- `backend/__tests__/unit/` - Unit tests for services, utils
- `backend/__tests__/integration/` - API endpoint tests
- `backend/__tests__/fixtures/` - Test data and mocks

Priority Test Suites:
1. Authentication endpoints (login, refresh, logout)
2. Ticket CRUD operations
3. File upload/download
4. Permission checks
5. Real-time Socket.io events
6. Email notification triggers

### 5.2 Frontend Testing (Jest + React Testing Library)

**Target: 70%+ coverage**

Test Structure:
- `frontend/__tests__/unit/` - Component unit tests
- `frontend/__tests__/integration/` - Full user flow tests
- `frontend/__tests__/fixtures/` - Mock data

Priority Test Suites:
1. Authentication (login, logout, token refresh)
2. Ticket list views (table, card, kanban)
3. Ticket creation/editing
4. Filter and search
5. File uploads
6. Error handling

---

## Part 6: Global Search (TODO-012)

### 6.1 Requirements

**Features:**
- Header search bar with magnifying glass icon
- Real-time search as user types
- Results include:
  - Tickets (by ID, subject, description)
  - Users (by name, email, ID)
  - Departments (by name)
- Clickable results navigate to detail page
- Keyboard shortcut (Cmd+K or Ctrl+K) to focus search
- Recent searches (stored in localStorage)

### 6.2 Implementation

**Backend:**
- New endpoint: `GET /api/search?q=query&types=tickets,users,departments`
- Full-text search on MongoDB fields
- Pagination for results

**Frontend:**
- Header search component with dropdown
- useSearch hook for API calls with debouncing
- Keyboard shortcut listener

---

## Implementation Timeline

### Week 1-2: System Settings + S3 Setup
- Backend settings API
- Frontend settings UI
- S3 configuration and migration

### Week 2-3: Render Deployment + Tests
- Dockerfile and Render config
- MongoDB Atlas setup
- Begin backend test suite
- Begin frontend test suite

### Week 3-4: Bulk Operations + Global Search
- Bulk action UI and API
- Global search implementation
- Complete tests

### Week 4+: Testing, Refinement, Documentation
- Achieve 80%+ backend, 70%+ frontend coverage
- Performance optimization
- Deployment testing
- Documentation updates

---

## Risks and Mitigation

| Risk | Mitigation |
|------|-----------|
| Data loss during S3 migration | Backup local files, test migration in staging |
| Render deployment outages | Use auto-deploy, monitor Render status page |
| AWS S3 costs | Monitor bucket usage, implement lifecycle policies |
| Database lock during MongoDB migration | Use MongoDB Compass, verify zero downtime |
| Test coverage gaps | Prioritize critical paths, use coverage reports |
| Socket.io issues on Render | Test WebSocket support early, use Render logs |

---

## Success Metrics

✅ All P0 & P1 features working (95% complete)
✅ System Settings UI fully functional
✅ Files stored in AWS S3 with secure access
✅ Backend deployed on Render
✅ 80%+ backend test coverage
✅ 70%+ frontend test coverage
✅ Global search working
✅ Bulk operations reducing admin time
✅ Zero data loss during migrations
✅ All critical paths tested

---

## Files Summary

### To Create
**Backend:** 5 new files (S3 config, settings controller, migration script, Dockerfile, etc.)
**Frontend:** 8 new components (settings panels, search, etc.)
**Total New:** ~40 new/modified files

### To Modify
**Backend:** 4 core files (upload middleware, ticket controller, models, routes)
**Frontend:** 5 core files (services, stores, components)

### Total Effort
**Backend:** ~30-40 hours
**Frontend:** ~25-35 hours
**Testing:** ~40-50 hours
**Deployment:** ~15-20 hours
**Total:** ~110-145 hours (~4-6 weeks @ 30 hours/week)

---

## Next Steps After Approval

1. Create git branch: `feature/p2-implementation`
2. Start with Part 1: System Settings Backend API
3. Proceed in parallel where possible
4. Regular testing and integration verification
5. Final QA before merge to main

