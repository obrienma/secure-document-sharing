# Quick Reference

Essential commands and information for the Secure Document Sharing System.

## 🚀 Getting Started

```bash
# Install and run everything
./install.sh

# Or manually
docker compose up -d --build
```

## 📋 Common Commands

### Container Management
```bash
# Start all services
docker compose up -d

# Stop all services
docker compose down

# Restart a service
docker compose restart backend

# View logs (all services)
docker compose logs -f

# View logs (specific service)
docker compose logs -f backend

# Check container status
docker compose ps
```

### Database
```bash
# Access database shell
docker compose exec docshare-db psql -U docshare_user -d docshare

# Backup database
docker compose exec docshare-db pg_dump -U docshare_user docshare > backup.sql

# Restore database
docker compose exec -T docshare-db psql -U docshare_user -d docshare < backup.sql

# Reset database
docker compose down -v
docker compose up -d
docker compose exec backend psql -h docshare-db -U docshare_user -d docshare < backend/src/db/schema.sql
```

### Development
```bash
# Backend shell
docker compose exec backend sh

# Frontend shell
docker compose exec frontend sh

# Install npm package (backend)
docker compose exec backend npm install <package-name>

# Install npm package (frontend)
docker compose exec frontend npm install <package-name>

# Run tests
docker compose exec backend npm test

# Run tests with coverage
docker compose exec backend npm test -- --coverage

# Watch mode for tests
docker compose exec backend npm test -- --watch
```

### Cleanup
```bash
# Remove containers and volumes
docker compose down -v

# Remove everything including images
docker compose down -v --rmi all

# Clean Docker system
docker system prune -a --volumes
```

## 🌐 URLs

| Service | URL | Credentials |
|---------|-----|-------------|
| Frontend | http://localhost:5173 | Create account |
| Backend API | http://localhost:3000 | - |
| Database | localhost:5432 | docshare_user / (see .env) |

## 📁 Project Structure

```
doc-share/
├── backend/
│   ├── src/
│   │   ├── auth/          # JWT authentication
│   │   ├── documents/     # File upload & management
│   │   ├── links/         # Share link generation
│   │   ├── share/         # Public access endpoints
│   │   ├── db/            # Database schema & connection
│   │   └── middleware/    # Auth middleware
│   ├── uploads/           # File storage
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── pages/         # React pages
│   │   ├── components/    # UI components
│   │   ├── services/      # API clients
│   │   └── contexts/      # React contexts
│   └── package.json
├── docker-compose.yml     # Docker services
├── .env                   # Environment config
├── install.sh            # Installation script
└── README.md
```

## 🔑 Environment Variables

Essential variables in `.env`:

```bash
# Database
POSTGRES_PASSWORD=your_secure_password

# Backend
JWT_SECRET=your_jwt_secret_here
FRONTEND_URL=http://localhost:5173

# Frontend
VITE_API_URL=http://localhost:3000
```

## 🔐 API Endpoints

### Authentication
```bash
POST /api/auth/register    # Register new user
POST /api/auth/login       # Login
GET  /api/auth/me          # Get current user
```

### Documents
```bash
POST   /api/documents/upload       # Upload file
GET    /api/documents              # List all documents
GET    /api/documents/:id          # Get document details
DELETE /api/documents/:id          # Delete document
GET    /api/documents/:id/download # Download file
```

### Share Links
```bash
POST   /api/links              # Create share link
GET    /api/links              # List user's links
GET    /api/links/:id/logs     # Get access logs
DELETE /api/links/:id          # Deactivate link
```

### Public Access
```bash
POST /api/share/:token/verify   # Verify access & password
GET  /api/share/:token/download # Download shared file
```

## 🧪 Testing

```bash
# Run all tests
docker compose exec backend npm test

# Coverage report
docker compose exec backend npm test -- --coverage

# Run specific test file
docker compose exec backend npm test auth.service.test.ts

# Watch mode
docker compose exec backend npm test -- --watch
```

**Test Suites:**
- `auth.service.test.ts` - Authentication logic (5 tests)
- `auth.controller.test.ts` - Auth endpoints (4 tests)
- `links.service.test.ts` - Link generation (18 tests)
- `links.controller.test.ts` - Link endpoints (5 tests)
- `documents.service.test.ts` - Document management (6 tests)
- `share.service.test.ts` - Public sharing (3 tests)

## 🐛 Troubleshooting

```bash
# View all logs
docker compose logs -f

# Check container status
docker compose ps

# Restart everything
docker compose restart

# Complete reset
docker compose down -v
./install.sh
```

**Common Issues:**
- Port in use → Change ports in docker-compose.yml
- Database connection failed → Run `docker compose down -v && docker compose up -d`
- Frontend can't reach backend → Check VITE_API_URL in .env
- Tests failing → Run `docker compose exec backend npm install`

See [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for detailed solutions.

## 📊 Database Schema

**Tables:**
- `users` - User accounts
- `documents` - Uploaded files metadata
- `shared_links` - Shareable URLs with settings
- `access_logs` - Access audit trail

**Quick queries:**
```sql
-- List all users
SELECT * FROM users;

-- List documents with owner
SELECT d.*, u.email FROM documents d 
JOIN users u ON d.user_id = u.id;

-- List active links
SELECT * FROM shared_links WHERE is_active = true;

-- Recent access logs
SELECT * FROM access_logs ORDER BY accessed_at DESC LIMIT 10;
```

## 🔒 Security Features

- ✅ JWT-based authentication (7-day expiry)
- ✅ Bcrypt password hashing (10 rounds)
- ✅ Secure token generation (crypto.randomBytes)
- ✅ Password-protected shares
- ✅ Time-limited links
- ✅ View count limits
- ✅ Comprehensive access logging
- ✅ SQL injection prevention (parameterized queries)

## 📝 Quick Tasks

### Create a new user programmatically
```bash
docker compose exec docshare-db psql -U docshare_user -d docshare -c \
  "INSERT INTO users (email, password_hash, full_name) VALUES ('test@example.com', '\$2b\$10\$hash', 'Test User');"
```

### View active links count
```bash
docker compose exec docshare-db psql -U docshare_user -d docshare -c \
  "SELECT COUNT(*) FROM shared_links WHERE is_active = true;"
```

### Check disk usage
```bash
du -sh backend/uploads/
```

### Export access logs
```bash
docker compose exec docshare-db psql -U docshare_user -d docshare -c \
  "COPY (SELECT * FROM access_logs) TO STDOUT WITH CSV HEADER" > logs.csv
```

## 🚢 Production Deployment

### Deploy to Render.com

1. Push code to GitHub
2. Go to [Render Dashboard](https://dashboard.render.com/)
3. Create new Blueprint → Connect repository
4. Render auto-deploys from `render.yaml`
5. Initialize database:
   ```bash
   psql $DATABASE_URL -f backend/src/db/schema.sql
   ```

See [DEPLOYMENT.md](DEPLOYMENT.md) for complete guide.

**Pre-deployment checklist:**
- [ ] Update `JWT_SECRET` in .env (min 32 chars)
- [ ] Update `POSTGRES_PASSWORD` in .env
- [ ] Set `NODE_ENV=production`
- [ ] Configure HTTPS/SSL
- [ ] Set up database backups
- [ ] Configure log rotation
- [ ] Set up monitoring
- [ ] Update `FRONTEND_URL` to production domain
- [ ] Review file size limits
- [ ] Test all features

**Backup script:**
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
docker compose exec docshare-db pg_dump -U docshare_user docshare > backup_$DATE.sql
```

## 📚 Additional Resources

- [README.md](README.md) - Full documentation
- [DEPLOYMENT.md](DEPLOYMENT.md) - Production deployment guide
- [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - Detailed solutions
- [Backend API](http://localhost:3000) - Swagger docs (coming soon)
- [GitHub Issues](https://github.com/obrienma/secure-document-sharing/issues) - Report bugs

---

**Need help?** Check logs first: `docker compose logs -f`
