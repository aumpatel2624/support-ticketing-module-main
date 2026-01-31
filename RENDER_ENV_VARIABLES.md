# Render Environment Variables Configuration

## Backend Service (.onrender.com)

All environment variables currently configured on your Render backend service. Replace placeholder values with your actual credentials.

### Server Configuration

```env
PORT=10000
NODE_ENV=production
LOG_LEVEL=info
```

**Description:**
- `PORT`: Render assigns port 10000 for web services
- `NODE_ENV`: Set to production for the deployed environment
- `LOG_LEVEL`: Set to info for production logging

---

### Database Configuration

```env
MONGODB_URI=mongodb+srv://aumpatelc36:aumpatel2624@apidelaum.nlhcg51.mongodb.net/
```

**Description:**
- Connection string to your MongoDB Atlas cluster
- Currently connected to: `aumpatelc36` account
- Cluster: `apidelaum`
- ⚠️ **Ensure**: IP whitelist includes Render's servers (0.0.0.0/0 or specific Render IPs in MongoDB Atlas)

---

### JWT Authentication Secrets

```env
JWT_SECRET=<generate-with-crypto.randomBytes(32).toString('hex')>
JWT_REFRESH_SECRET=<generate-with-crypto.randomBytes(32).toString('hex')>
```

**Description:**
- Token signing keys for JWT authentication
- Access token expiry: 30 minutes
- Refresh token expiry: 7 days

⚠️ **ACTION REQUIRED:**
Replace the placeholder values with actual generated secrets. Generate them using:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Then set in Render:
```
JWT_SECRET=<generated-hex-string>
JWT_REFRESH_SECRET=<generated-hex-string>
```

---

### Email Configuration (SMTP)

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=app-password-from-google
FROM_EMAIL=noreply@company.com
FROM_NAME=Ticketing System
```

**Description:**
- Gmail SMTP configuration
- `SMTP_USER`: Gmail email address that sends notifications
- `SMTP_PASS`: Gmail App Password (NOT regular password)
- `FROM_EMAIL`: Reply-to email address for system notifications
- `FROM_NAME`: Display name in email headers

⚠️ **ACTION REQUIRED:**
- Replace `your-email@gmail.com` with your actual Gmail address
- Replace `app-password-from-google` with your Gmail App Password
  - [Get Gmail App Password](https://myaccount.google.com/apppasswords)
- Update `FROM_EMAIL` to your company domain

---

### Frontend Configuration

```env
FRONTEND_URL=https://ticketing-frontend.onrender.com
```

**Description:**
- Frontend URL for CORS configuration
- Allows frontend to communicate with backend API
- Currently set to Render's frontend service URL

⚠️ **Note:** If you add a custom domain, update this to match (e.g., `https://ticketing.yourdomain.com`)

---

### AWS S3 Configuration

```env
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=xxx...
S3_BUCKET_NAME=ticketing-system-prod
S3_ACL=private
S3_FOLDER_PREFIX=prod/tickets/
PRESIGNED_URL_EXPIRY=3600
```

**Description:**
- AWS region: `us-east-1` (Eastern US)
- `AWS_ACCESS_KEY_ID`: IAM user access key ID
- `AWS_SECRET_ACCESS_KEY`: IAM user secret key
- `S3_BUCKET_NAME`: S3 bucket for file uploads
- `S3_ACL`: All files stored as private (not public)
- `S3_FOLDER_PREFIX`: Files organized under `prod/tickets/` folder
- `PRESIGNED_URL_EXPIRY`: Signed URLs valid for 3600 seconds (1 hour)

⚠️ **ACTION REQUIRED:**
Replace placeholder values with actual AWS credentials:
- `AKIA...` → Your actual AWS Access Key ID
- `xxx...` → Your actual AWS Secret Access Key

**Setup:**
1. Create S3 bucket: `ticketing-system-prod`
2. Create IAM user with S3 permissions
3. Store credentials securely in Render

---

## Frontend Service (.onrender.com)

Static site hosting on Render.

### Frontend API Connection

```env
NEXT_PUBLIC_API_URL=https://ticketing-backend.onrender.com/api
```

**Description:**
- Points to your Render backend API service
- Used by frontend to make API requests
- Publicly accessible (NEXT_PUBLIC prefix)

⚠️ **Note:** If you add custom domains, update both URLs to match your domain pattern

---

## Summary of Required Actions

- [ ] Generate and set actual `JWT_SECRET` value
- [ ] Generate and set actual `JWT_REFRESH_SECRET` value
- [ ] Update `SMTP_USER` with your Gmail address
- [ ] Update `SMTP_PASS` with Gmail App Password
- [ ] Update `FROM_EMAIL` with your company email
- [ ] Set actual `AWS_ACCESS_KEY_ID` value
- [ ] Set actual `AWS_SECRET_ACCESS_KEY` value
- [ ] Verify MongoDB Atlas IP whitelist includes Render
- [ ] Test file uploads to S3 bucket
- [ ] Test email notifications (create a ticket)

---

## How to Update in Render

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Select your **Backend Service** (ticketing-backend)
3. Click **Environment** tab
4. Update the environment variables
5. Deploy will trigger automatically (or manually trigger if needed)

---

## Verification Commands

Test your deployed backend:

```bash
# Health check
curl https://ticketing-backend.onrender.com/api/health

# Get public settings
curl https://ticketing-backend.onrender.com/api/settings/public

# Test login
curl -X POST https://ticketing-backend.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "superadmin@example.com",
    "password": "Admin123"
  }'
```

---

## Security Notes

- ⚠️ **Never commit `.env` files to git**
- ⚠️ **Keep AWS keys secret** - use Render's environment variable UI
- ⚠️ **Rotate JWT secrets** periodically in production
- ⚠️ **Use App Passwords for Gmail**, not your main password
- ✅ All values stored securely in Render's encrypted environment

---

## Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| MongoDB connection error | Wrong credentials or IP whitelist | Verify URI and whitelist Render IP in MongoDB Atlas |
| Email not sending | Invalid SMTP credentials | Use Gmail App Password, not regular password |
| File upload fails | Missing AWS credentials | Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY |
| CORS errors | Wrong FRONTEND_URL | Update FRONTEND_URL to match actual frontend domain |
| JWT errors | Placeholder secrets still in use | Generate and set actual JWT secret values |

---

**Last Updated:** 2026-01-31
