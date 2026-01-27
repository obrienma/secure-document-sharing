# Deployment Guide

This guide covers deploying the Secure Document Sharing System to production.

## Table of Contents

- [Render.com Deployment](#rendercom-deployment)
- [Manual Deployment](#manual-deployment)
- [Environment Variables](#environment-variables)
- [Post-Deployment](#post-deployment)

## Render.com Deployment

Render.com provides free PostgreSQL databases and web services, making it ideal for this application.

### Prerequisites

1. A [Render.com](https://render.com) account
2. Your code pushed to a Git repository (GitHub, GitLab, or Bitbucket)

### Option 1: One-Click Deploy (Recommended)

1. **Push your code to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/doc-share.git
   git push -u origin main
   ```

2. **Deploy to Render**
   - Go to [Render Dashboard](https://dashboard.render.com/)
   - Click **"New +"** → **"Blueprint"**
   - Connect your GitHub repository
   - Select your `doc-share` repository
   - Render will automatically detect `render.yaml` and create all services

3. **Wait for deployment**
   - Database: ~2-3 minutes
   - Backend: ~5-7 minutes
   - Frontend: ~3-5 minutes

4. **Initialize the database**
   - Go to your backend service in Render Dashboard
   - Click **"Shell"** tab
   - Run:
     ```bash
     psql $DATABASE_URL -f backend/src/db/schema.sql
     ```

### Option 2: Manual Setup

#### Step 1: Create PostgreSQL Database

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **"New +"** → **"PostgreSQL"**
3. Configure:
   - **Name**: `docshare-db`
   - **Database**: `docshare_db`
   - **User**: `docshare`
   - **Region**: Choose closest to your users
   - **Plan**: Free (or paid for better performance)
4. Click **"Create Database"**
5. Copy the **Internal Database URL** (starts with `postgresql://`)

#### Step 2: Deploy Backend

1. Click **"New +"** → **"Web Service"**
2. Connect your repository
3. Configure:
   - **Name**: `docshare-backend`
   - **Root Directory**: `backend`
   - **Environment**: `Docker`
   - **Region**: Same as database
   - **Plan**: Free (or paid for zero downtime)
   - **Dockerfile Path**: `backend/Dockerfile`

4. Add **Environment Variables**:
   ```
   NODE_ENV=production
   PORT=3000
   DATABASE_URL=[Paste Internal Database URL from Step 1]
   JWT_SECRET=[Generate a random 32+ character string]
   FRONTEND_URL=[Will update after frontend deployment]
   MAX_FILE_SIZE=10485760
   ```

5. Click **"Create Web Service"**

6. Once deployed, note the **URL** (e.g., `https://docshare-backend.onrender.com`)

#### Step 3: Initialize Database Schema

1. Go to your backend service
2. Click **"Shell"** tab (or use Render's Connect button)
3. Run:
   ```bash
   psql $DATABASE_URL -f backend/src/db/schema.sql
   ```
4. Verify:
   ```bash
   psql $DATABASE_URL -c "\dt"
   ```
   Should show: `users`, `documents`, `shared_links`, `access_logs`

#### Step 4: Deploy Frontend

1. Click **"New +"** → **"Static Site"**
2. Connect your repository
3. Configure:
   - **Name**: `docshare-frontend`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
   - **Plan**: Free

4. Add **Environment Variable**:
   ```
   VITE_API_URL=https://docshare-backend.onrender.com
   ```
   (Use the backend URL from Step 2)

5. Click **"Create Static Site"**

6. Once deployed, note the **URL** (e.g., `https://docshare-frontend.onrender.com`)

#### Step 5: Update Backend Environment

1. Go back to **backend service**
2. Go to **"Environment"** tab
3. Update `FRONTEND_URL`:
   ```
   FRONTEND_URL=https://docshare-frontend.onrender.com
   ```
4. Click **"Save Changes"** (backend will redeploy)

### Verification

1. **Test Frontend**: Open your frontend URL
2. **Test Backend**: Visit `https://your-backend-url/api/health`
3. **Test Registration**: Create a test account
4. **Test Upload**: Upload a test document
5. **Test Sharing**: Generate and test a share link

## Environment Variables

### Required for Backend

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `production` |
| `PORT` | Server port | `3000` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `JWT_SECRET` | Secret for JWT tokens (min 32 chars) | `your_random_string_here` |
| `FRONTEND_URL` | Frontend domain (for CORS) | `https://app.example.com` |
| `MAX_FILE_SIZE` | Max upload size in bytes | `10485760` (10MB) |

### Required for Frontend

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `https://api.example.com` |

### Generate Secure Secrets

```bash
# Generate JWT_SECRET (32+ characters)
openssl rand -base64 32

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## Manual Deployment (VPS/Cloud)

### Prerequisites

- Ubuntu 20.04+ or similar Linux server
- Docker and Docker Compose installed
- Domain name (optional but recommended)
- SSL certificate (Let's Encrypt recommended)

### Steps

1. **Clone repository**
   ```bash
   git clone https://github.com/yourusername/doc-share.git
   cd doc-share
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   nano .env  # Update with production values
   ```

3. **Update docker-compose.yml for production**
   ```yaml
   # Remove port mappings for security
   # Add restart policies
   restart: unless-stopped
   ```

4. **Deploy**
   ```bash
   docker compose -f docker-compose.yml up -d --build
   ```

5. **Initialize database**
   ```bash
   docker compose exec postgres psql -U docshare -d docshare_db < backend/src/db/schema.sql
   ```

6. **Set up reverse proxy (Nginx)**
   ```nginx
   # /etc/nginx/sites-available/docshare
   server {
       listen 80;
       server_name yourdomain.com;

       # Frontend
       location / {
           proxy_pass http://localhost:5173;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }

       # Backend API
       location /api {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```

7. **Enable SSL with Let's Encrypt**
   ```bash
   sudo certbot --nginx -d yourdomain.com
   ```

## Post-Deployment

### Security Checklist

- [ ] All environment variables use secure, random values
- [ ] JWT_SECRET is at least 32 characters
- [ ] POSTGRES_PASSWORD is strong and unique
- [ ] CORS is configured correctly (FRONTEND_URL matches actual domain)
- [ ] SSL/HTTPS is enabled
- [ ] Database backups are configured
- [ ] File upload limits are appropriate
- [ ] Rate limiting is enabled (if applicable)

### Monitoring

1. **Set up health checks**
   - Backend: `GET /api/health`
   - Database: Check connection status

2. **Enable logging**
   - Application logs: Check Render logs or container logs
   - Database logs: Monitor slow queries
   - Access logs: Track API usage

3. **Set up alerts**
   - Downtime notifications
   - Error rate thresholds
   - Disk space warnings

### Database Backups

#### Render.com (Paid Plans)

Render provides automatic daily backups on paid database plans.

#### Manual Backups

```bash
# Create backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Restore backup
psql $DATABASE_URL < backup_20260127.sql

# Automated backup script (cron)
0 2 * * * /path/to/backup-script.sh
```

**backup-script.sh**:
```bash
#!/bin/bash
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump $DATABASE_URL | gzip > "$BACKUP_DIR/backup_$DATE.sql.gz"

# Keep only last 30 days
find "$BACKUP_DIR" -name "backup_*.sql.gz" -mtime +30 -delete
```

### Performance Optimization

1. **Database indexing**: Already optimized in schema.sql
2. **CDN**: Consider using Cloudflare for static assets
3. **Caching**: Add Redis for session management (future enhancement)
4. **File storage**: Migrate to S3 for scalability

### Scaling

#### Free Tier Limitations

- Render.com free tier sleeps after 15 minutes of inactivity
- 750 hours/month of runtime
- 100GB bandwidth/month
- Database: 1GB storage

#### Upgrade Path

1. **Starter ($7/month per service)**
   - Always on (no sleep)
   - Custom domains
   - More resources

2. **Database upgrade ($7/month)**
   - 10GB storage
   - Daily backups
   - Point-in-time recovery

3. **Horizontal scaling**
   - Deploy multiple backend instances
   - Add load balancer
   - Separate read replicas

## Troubleshooting

### Common Issues

**Backend fails to connect to database**
- Check DATABASE_URL is correct
- Verify database is running
- Check network connectivity (use internal URL on Render)

**CORS errors**
- Verify FRONTEND_URL matches actual frontend domain
- Check VITE_API_URL points to correct backend
- Ensure no trailing slashes in URLs

**File uploads fail**
- Check MAX_FILE_SIZE setting
- Verify disk space available
- Check file permissions in container

**Frontend shows blank page**
- Check browser console for errors
- Verify VITE_API_URL is correct
- Check backend is responding at /api/health

## Support

- **Documentation**: See [README.md](README.md) and [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
- **Issues**: [GitHub Issues](https://github.com/yourusername/doc-share/issues)
- **Render.com Docs**: https://render.com/docs

---

**Last Updated**: January 27, 2026
