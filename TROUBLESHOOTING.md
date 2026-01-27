# Troubleshooting Guide

Common issues and their solutions for the Secure Document Sharing System.

## Installation Issues

### Docker Daemon Not Running

**Error:**
```
Cannot connect to the Docker daemon
```

**Solution:**
1. Start Docker Desktop (macOS/Windows)
2. Or start Docker service (Linux):
   ```bash
   sudo systemctl start docker
   ```

### Port Already in Use

**Error:**
```
Bind for 0.0.0.0:3000 failed: port is already allocated
```

**Solution:**
1. Check what's using the port:
   ```bash
   lsof -i :3000  # or :5173, :5432
   ```
2. Stop the conflicting service or change ports in docker-compose.yml

### Database Connection Failed

**Error:**
```
database "docshare" does not exist
```

**Solution:**
1. Reinitialize the database:
   ```bash
   docker compose down -v
   docker compose up -d
   docker compose exec backend psql -h docshare-db -U docshare_user -d docshare < backend/src/db/schema.sql
   ```

## Runtime Issues

### Frontend Can't Connect to Backend

**Symptoms:**
- Network errors in browser console
- API calls failing with CORS errors

**Solution:**
1. Check backend is running:
   ```bash
   docker compose ps
   ```
2. Verify VITE_API_URL in .env matches backend URL
3. Check backend logs:
   ```bash
   docker compose logs backend
   ```

### File Upload Fails

**Error:**
```
File too large
```

**Solution:**
1. Default limit is 10MB
2. To change, update backend/src/config/multer.config.ts:
   ```typescript
   limits: {
     fileSize: 20 * 1024 * 1024 // 20MB
   }
   ```
3. Rebuild backend:
   ```bash
   docker compose up -d --build backend
   ```

### JWT Token Expired

**Error:**
```
401 Unauthorized
```

**Solution:**
1. Tokens expire after 7 days
2. User needs to log in again
3. To change expiration, update backend/src/auth/auth.service.ts:
   ```typescript
   expiresIn: '30d' // 30 days
   ```

## Database Issues

### Can't Access Database

**Solution:**
```bash
# Check if database container is running
docker compose ps docshare-db

# Access database shell
docker compose exec docshare-db psql -U docshare_user -d docshare

# If connection fails, check logs
docker compose logs docshare-db
```

### Database Schema Out of Sync

**Solution:**
```bash
# Backup data first if needed
docker compose exec docshare-db pg_dump -U docshare_user docshare > backup.sql

# Reset database
docker compose down -v
docker compose up -d
docker compose exec backend psql -h docshare-db -U docshare_user -d docshare < backend/src/db/schema.sql
```

### Slow Queries

**Solution:**
1. Check database indexes exist:
   ```sql
   \d documents
   \d shared_links
   ```
2. Add missing indexes if needed
3. Analyze query performance:
   ```sql
   EXPLAIN ANALYZE SELECT * FROM shared_links WHERE link_token = 'abc';
   ```

## Test Issues

### Tests Failing

**Common causes:**
1. Database not initialized
2. Environment variables not set
3. Dependencies not installed

**Solution:**
```bash
# Reinstall dependencies
docker compose exec backend npm install

# Clear Jest cache
docker compose exec backend npm test -- --clearCache

# Run tests
docker compose exec backend npm test
```

### TypeScript Errors in Tests

**Solution:**
```bash
# Rebuild TypeScript
docker compose exec backend npm run build

# Check tsconfig.json is correct
# Verify all @types/* packages are installed
```

## Performance Issues

### Slow Container Startup

**Solution:**
1. Increase Docker Desktop memory allocation (macOS/Windows)
2. Clean up unused images/volumes:
   ```bash
   docker system prune -a --volumes
   ```

### High Memory Usage

**Solution:**
1. Limit container resources in docker-compose.yml:
   ```yaml
   services:
     backend:
       deploy:
         resources:
           limits:
             memory: 512M
   ```

## Production Issues

### Memory Leaks

**Solution:**
1. Monitor container memory:
   ```bash
   docker stats
   ```
2. Restart containers periodically
3. Check for unclosed database connections
4. Review application logs for errors

### High CPU Usage

**Possible causes:**
- Infinite loops
- Heavy database queries
- File processing

**Solution:**
1. Profile the application
2. Add query optimization
3. Implement caching
4. Use background workers for heavy tasks

## Getting Help

If you can't resolve your issue:

1. **Check logs:**
   ```bash
   docker compose logs -f
   ```

2. **Check container status:**
   ```bash
   docker compose ps
   ```

3. **Verify environment variables:**
   ```bash
   docker compose exec backend env
   ```

4. **Review GitHub Issues:**
   - Check existing issues for similar problems
   - Open a new issue with:
     - Error message
     - Steps to reproduce
     - Docker version
     - Operating system

5. **Debug mode:**
   - Set `NODE_ENV=development` in .env
   - Check detailed error messages in logs

## Clean Slate Reset

If all else fails, start fresh:

```bash
# Stop and remove everything
docker compose down -v

# Remove Docker images
docker rmi $(docker images 'docshare*' -q)

# Remove node_modules
rm -rf backend/node_modules frontend/node_modules

# Run installation script again
./install.sh
```

## Common Error Messages

### "EACCES: permission denied"
- Docker permission issue on Linux
- Solution: Add user to docker group or use sudo

### "Cannot find module"
- Missing npm dependencies
- Solution: `docker compose exec backend npm install`

### "Syntax error near unexpected token"
- Script line ending issues (Windows)
- Solution: Convert to Unix line endings (LF)

### "Network ... not found"
- Docker network cleanup needed
- Solution: `docker network prune`
