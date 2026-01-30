# Deployment Guide - Render + AWS S3

## Pre-Deployment Checklist

This guide walks you through deploying the ticketing system to production using:
- **Backend:** Render.com (Node.js Web Service)
- **Frontend:** Render.com (Static Site)
- **Database:** MongoDB Atlas
- **File Storage:** AWS S3
- **Email:** SMTP (Gmail, Office365, SendGrid, etc.)

---

## Part 1: AWS Setup (15 minutes)

### 1.1 Create S3 Bucket

1. Go to [AWS Console](https://console.aws.amazon.com)
2. Navigate to S3 → Create Bucket
3. **Bucket Settings:**
   - Name: `ticketing-system-prod` (must be globally unique, add your company name)
   - Region: `us-east-1` (or closest to your location)
   - Block Public Access: ✅ All enabled
   - Versioning: ✅ Enable (for recovery)
   - Server-side encryption: ✅ AES-256

4. **Click Create Bucket**

### 1.2 Create IAM User for Application

1. Go to IAM → Users → Create User
2. **User Details:**
   - Username: `ticketing-backend-prod`
   - Access type: Programmatic access only
   - Click Create

3. **Attach Permissions:**
   - Select "Attach existing policies directly"
   - Create custom policy:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": [
           "s3:PutObject",
           "s3:GetObject",
           "s3:DeleteObject",
           "s3:ListBucket"
         ],
         "Resource": [
           "arn:aws:s3:::ticketing-system-prod",
           "arn:aws:s3:::ticketing-system-prod/*"
         ]
       }
     ]
   }
   ```

4. **Copy Credentials:**
   - Copy `Access Key ID` → Save to secure location
   - Copy `Secret Access Key` → Save to secure location
   - ⚠️ **Never commit these to git!**

### 1.3 Configure S3 CORS (Optional - for direct uploads)

1. Go to S3 bucket → Permissions → CORS
2. Add CORS Configuration:
```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST"],
    "AllowedOrigins": ["https://ticketing.yourdomain.com"],
    "ExposeHeaders": ["ETag"]
  }
]
```

---

## Part 2: MongoDB Atlas Setup (10 minutes)

### 2.1 Create MongoDB Atlas Account

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create account or sign in
3. Create new project: `Ticketing System`

### 2.2 Create Database Cluster

1. Click "Create" → Database
2. **Cluster Configuration:**
   - Cluster Tier: `M0 Shared` (free tier)
   - Cloud Provider: AWS
   - Region: Same as S3 if possible (us-east-1)
   - Click Create

3. **Wait for cluster to be ready** (5-10 minutes)

### 2.3 Configure Database User

1. Database Access → Add Database User
2. **User Details:**
   - Username: `ticketing_prod`
   - Password: Generate strong password
   - Built-in Role: `Atlas Admin`
   - Click Add User

3. **Copy Connection String:**
   - Go to Deployment → Database → Connect
   - Select "Drivers"
   - Copy MongoDB URI
   - Replace `<password>` with your password
   - Replace `<username>` with your username
   - Example: `mongodb+srv://ticketing_prod:PASSWORD@cluster.mongodb.net/ticketing?retryWrites=true&w=majority`

### 2.4 Whitelist IP Addresses

1. Network Access → Add IP Address
2. **For Development:** `0.0.0.0/0` (allow all - less secure)
3. **For Production:** Add only Render's IP or use VPC (more secure)
4. Click Confirm

---

## Part 3: Email Setup (5 minutes)

Choose one option:

### Option A: Gmail (Easiest for testing)

1. Enable 2-Factor Authentication in Google Account
2. Create App Password:
   - Go to Google Account → Security
   - App passwords → Select Mail, Windows
   - Copy password (this is your SMTP_PASS)

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx
FROM_EMAIL=noreply@ticketing.com
FROM_NAME=Ticketing System
```

### Option B: SendGrid (Recommended for production)

1. Create [SendGrid](https://sendgrid.com) account
2. Create API Key
3. Configure SMTP:
```
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
FROM_EMAIL=noreply@ticketing.com
FROM_NAME=Ticketing System
```

### Option C: Office 365 / Outlook

```
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_USER=your-email@company.com
SMTP_PASS=your-password
FROM_EMAIL=noreply@ticketing.com
FROM_NAME=Ticketing System
```

---

## Part 4: Render Setup (20 minutes)

### 4.1 Create Render Account

1. Go to [Render.com](https://render.com)
2. Sign up with GitHub (recommended for auto-deploy)
3. Connect GitHub repository

### 4.2 Create Backend Service

1. Dashboard → New → Web Service
2. **Service Settings:**
   - Connect GitHub repository (select your ticketing-system repo)
   - Select `main` branch
   - Name: `ticketing-backend`
   - Root Directory: `backend/` (⚠️ Important!)
   - Runtime: Node
   - Plan: Standard ($7/month)

3. **Build Command:**
   ```
   npm install
   ```

4. **Start Command:**
   ```
   npm start
   ```

5. **Environment Variables** (click "Advanced" → Environment Variables):
   Add all variables from your `.env.production.example`:

   ```
   PORT=10000
   NODE_ENV=production
   MONGODB_URI=mongodb+srv://ticketing_prod:PASSWORD@cluster.mongodb.net/ticketing?retryWrites=true&w=majority
   JWT_SECRET=<generate-with-crypto.randomBytes(32).toString('hex')>
   JWT_REFRESH_SECRET=<generate-with-crypto.randomBytes(32).toString('hex')>
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=app-password-from-google
   FROM_EMAIL=noreply@company.com
   FROM_NAME=Ticketing System
   FRONTEND_URL=https://ticketing-frontend.onrender.com
   AWS_REGION=us-east-1
   AWS_ACCESS_KEY_ID=AKIA...
   AWS_SECRET_ACCESS_KEY=xxx...
   S3_BUCKET_NAME=ticketing-system-prod
   S3_ACL=private
   S3_FOLDER_PREFIX=prod/tickets/
   PRESIGNED_URL_EXPIRY=3600
   LOG_LEVEL=info
   ```

6. Click "Create Web Service"
7. **Wait for deployment** (3-5 minutes)
8. Note the service URL: `https://ticketing-backend.onrender.com`

### 4.3 Create Frontend Service

1. Dashboard → New → Static Site
2. **Service Settings:**
   - Connect GitHub repository
   - Select `main` branch
   - Name: `ticketing-frontend`
   - Root Directory: `frontend/`
   - Plan: Free

3. **Build Command:**
   ```
   npm install && npm run build
   ```

4. **Publish Directory:**
   ```
   .next/standalone
   ```

5. **Environment Variables:**
   ```
   NEXT_PUBLIC_API_URL=https://ticketing-backend.onrender.com/api
   ```

6. Click "Create Static Site"
7. **Wait for deployment** (2-3 minutes)
8. Note the service URL: `https://ticketing-frontend.onrender.com`

---

## Part 5: Post-Deployment Verification (10 minutes)

### 5.1 Test Backend Health

```bash
curl https://ticketing-backend.onrender.com/api/health
```

Expected response:
```json
{
  "success": true,
  "message": "Server is running"
}
```

### 5.2 Test Public Settings Endpoint

```bash
curl https://ticketing-backend.onrender.com/api/settings/public
```

Expected response:
```json
{
  "success": true,
  "data": {
    "companyName": "Ticketing System",
    "brandColor": "#3b82f6"
  }
}
```

### 5.3 Test Frontend

1. Open: `https://ticketing-frontend.onrender.com`
2. Should redirect to login page
3. Try login with test credentials

### 5.4 Test File Upload

1. Login to dashboard
2. Create or edit a ticket
3. Upload a file
4. Verify file appears in S3 bucket
   - Go to AWS S3 Console
   - Check: `ticketing-system-prod/prod/tickets/`
   - Should see your uploaded files

### 5.5 Test API with Authentication

```bash
# Get token
curl -X POST https://ticketing-backend.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "superadmin@example.com",
    "password": "Admin123"
  }'

# Use token to test settings API
curl https://ticketing-backend.onrender.com/api/admin/settings \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Part 6: Additional Configuration

### 6.1 Custom Domain (Optional)

1. Render Dashboard → Settings → Custom Domain
2. Add your domain
3. Update DNS records per Render's instructions
4. Enable auto-renewal of SSL certificate

### 6.2 Monitoring & Logs

1. Render Dashboard → Service → Logs
2. Check for errors: `grep -i error`
3. Monitor performance: Check response times

### 6.3 Database Seed (First Time Only)

Run seed script to populate test data:

```bash
# Via Render:
1. Go to Render Dashboard → Backend Service
2. Select service → Shell
3. Run: node backend/scripts/seed-superadmin.js
```

Or via local terminal (if you have direct DB access):
```bash
cd backend
MONGODB_URI="your-atlas-uri" node scripts/seed-superadmin.js
```

### 6.4 Migrate Local Files to S3 (Optional)

If you have existing uploads to migrate:

```bash
# Run migration script
cd backend
MONGODB_URI="your-atlas-uri" \
AWS_REGION="us-east-1" \
AWS_ACCESS_KEY_ID="AKIA..." \
AWS_SECRET_ACCESS_KEY="xxx..." \
S3_BUCKET_NAME="ticketing-system-prod" \
node scripts/migrate-uploads-to-s3.js
```

---

## Common Issues & Troubleshooting

### Backend won't deploy
- Check Render logs: Render Dashboard → Service → Logs
- Verify root directory is set to `backend/`
- Ensure `backend/package.json` exists
- Check all environment variables are set

### Frontend shows "API connection error"
- Verify `NEXT_PUBLIC_API_URL` is correct
- Check CORS configuration on backend
- Ensure `FRONTEND_URL` in backend env matches frontend URL

### File uploads fail
- Verify AWS credentials in environment
- Check S3 bucket permissions
- Ensure bucket name is correct
- Test S3 access: `aws s3 ls s3://your-bucket/`

### Database connection errors
- Verify MongoDB URI is correct (replace `<password>`)
- Check IP whitelist in MongoDB Atlas
- Ensure user has proper permissions

### Email not sending
- Test SMTP credentials locally first
- Check email logs: Render Dashboard → Logs
- Verify FROM_EMAIL is correct format
- For Gmail: Ensure App Password is used, not regular password

---

## Useful Commands

```bash
# Check backend logs
curl https://ticketing-backend.onrender.com/api/health

# Check frontend is serving
curl https://ticketing-frontend.onrender.com

# Connect to MongoDB Atlas shell
mongosh "mongodb+srv://..."

# List S3 files
aws s3 ls s3://ticketing-system-prod/ --recursive
```

---

## Next Steps After Deployment

1. ✅ Test all core features in production
2. ✅ Verify S3 uploads work
3. ✅ Test email notifications
4. ✅ Check Socket.io real-time features
5. 🔄 Complete frontend Settings UI (Task #3, #4)
6. 🔄 Add custom domain
7. 🔄 Setup monitoring (Sentry, Datadog)
8. 🔄 Configure backups for database
9. 🔄 Add CI/CD pipeline (GitHub Actions)

---

## Support

- **Render Docs:** https://render.com/docs
- **MongoDB Atlas:** https://docs.atlas.mongodb.com/
- **AWS S3:** https://docs.aws.amazon.com/s3/
- **Your Repo:** GitHub (for issues and code)
