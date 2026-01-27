#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo -e "${BLUE}╔════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Secure Document Sharing - Installation Script   ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════╝${NC}"
echo ""

# Function to print success messages
success() {
    echo -e "${GREEN}✓${NC} $1"
}

# Function to print error messages
error() {
    echo -e "${RED}✗${NC} $1"
}

# Function to print info messages
info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

# Function to print warning messages
warn() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Check prerequisites
echo -e "${YELLOW}Checking prerequisites...${NC}"
echo ""

# Check for Docker
if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version | awk '{print $3}' | sed 's/,//')
    success "Docker installed (version $DOCKER_VERSION)"
else
    error "Docker is not installed"
    echo "  Please install Docker from https://docs.docker.com/get-docker/"
    exit 1
fi

# Check for Docker Compose
if docker compose version &> /dev/null; then
    COMPOSE_VERSION=$(docker compose version --short)
    success "Docker Compose installed (version $COMPOSE_VERSION)"
elif command -v docker-compose &> /dev/null; then
    COMPOSE_VERSION=$(docker-compose --version | awk '{print $3}' | sed 's/,//')
    success "Docker Compose installed (version $COMPOSE_VERSION)"
    warn "You're using docker-compose v1. Consider upgrading to docker compose v2"
    COMPOSE_CMD="docker-compose"
else
    error "Docker Compose is not installed"
    echo "  Please install Docker Compose from https://docs.docker.com/compose/install/"
    exit 1
fi

# Set Docker Compose command
COMPOSE_CMD=${COMPOSE_CMD:-"docker compose"}

# Check if Docker daemon is running
if ! docker info &> /dev/null; then
    error "Docker daemon is not running"
    echo "  Please start Docker and try again"
    exit 1
fi
success "Docker daemon is running"

echo ""
echo -e "${YELLOW}Setting up environment...${NC}"
echo ""

# Check if .env file exists, create from .env.example if not
if [ -f "$SCRIPT_DIR/.env" ]; then
    info "Environment file already exists"
else
    if [ -f "$SCRIPT_DIR/.env.example" ]; then
        cp "$SCRIPT_DIR/.env.example" "$SCRIPT_DIR/.env"
        success "Created .env file from .env.example"
    else
        info "Creating default .env file"
        cat > "$SCRIPT_DIR/.env" << 'EOF'
# Database Configuration
POSTGRES_HOST=docshare-db
POSTGRES_PORT=5432
POSTGRES_DB=docshare
POSTGRES_USER=docshare_user
POSTGRES_PASSWORD=secure_password_change_me

# Backend Configuration
NODE_ENV=development
JWT_SECRET=your_jwt_secret_key_change_me_in_production
FRONTEND_URL=http://localhost:5173

# Frontend Configuration
VITE_API_URL=http://localhost:3000
EOF
        success "Created default .env file"
        warn "Please update .env with secure values before deploying to production"
    fi
fi

# Stop any existing containers
echo ""
info "Stopping any existing containers..."
$COMPOSE_CMD down -v 2>/dev/null || true

# Build and start containers
echo ""
echo -e "${YELLOW}Building and starting Docker containers...${NC}"
echo ""

info "This may take a few minutes on first run..."
if $COMPOSE_CMD up -d --build; then
    success "Docker containers started successfully"
else
    error "Failed to start Docker containers"
    exit 1
fi

# Wait for database to be ready
echo ""
info "Waiting for PostgreSQL to be ready..."

# Load environment variables
if [ -f "$SCRIPT_DIR/.env" ]; then
    export $(grep -v '^#' "$SCRIPT_DIR/.env" | xargs)
fi

# Use environment variables or defaults
DB_USER=${POSTGRES_USER:-docshare}
DB_NAME=${POSTGRES_DB:-docshare_db}

sleep 5

MAX_RETRIES=30
RETRY_COUNT=0
until docker compose exec -T postgres pg_isready -h localhost -U "$DB_USER" &>/dev/null || [ $RETRY_COUNT -eq $MAX_RETRIES ]; do
    RETRY_COUNT=$((RETRY_COUNT + 1))
    if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
        error "Database failed to start after ${MAX_RETRIES} attempts"
        exit 1
    fi
    echo -n "."
    sleep 2
done
echo ""
success "PostgreSQL is ready"

# Initialize database schema
echo ""
echo -e "${YELLOW}Initializing database...${NC}"
echo ""

if [ -f "$SCRIPT_DIR/backend/src/db/schema.sql" ]; then
    info "Running database migrations..."
    if docker compose exec -T postgres psql -U "$DB_USER" -d "$DB_NAME" < "$SCRIPT_DIR/backend/src/db/schema.sql" 2>&1 | grep -q "ERROR"; then
        error "Failed to initialize database schema"
        info "Checking database status..."
        docker compose logs postgres --tail 10
        exit 1
    else
        success "Database schema initialized"
    fi
else
    warn "Database schema file not found, skipping initialization"
fi

# Install backend dependencies
echo ""
info "Installing backend dependencies..."
if $COMPOSE_CMD exec -T backend npm install &>/dev/null; then
    success "Backend dependencies installed"
else
    error "Failed to install backend dependencies"
    exit 1
fi

# Install frontend dependencies
echo ""
info "Installing frontend dependencies..."
if $COMPOSE_CMD exec -T frontend npm install &>/dev/null; then
    success "Frontend dependencies installed"
else
    error "Failed to install frontend dependencies"
    exit 1
fi

# Check container health
echo ""
echo -e "${YELLOW}Verifying installation...${NC}"
echo ""

sleep 3

# Check if containers are running
BACKEND_STATUS=$($COMPOSE_CMD ps backend --format json 2>/dev/null | grep -o '"State":"[^"]*"' | cut -d'"' -f4)
FRONTEND_STATUS=$($COMPOSE_CMD ps frontend --format json 2>/dev/null | grep -o '"State":"[^"]*"' | cut -d'"' -f4)
DB_STATUS=$($COMPOSE_CMD ps postgres --format json 2>/dev/null | grep -o '"State":"[^"]*"' | cut -d'"' -f4)

if [[ "$BACKEND_STATUS" == "running" ]]; then
    success "Backend container is running"
else
    error "Backend container is not running"
fi

if [[ "$FRONTEND_STATUS" == "running" ]]; then
    success "Frontend container is running"
else
    error "Frontend container is not running"
fi

if [[ "$DB_STATUS" == "running" ]]; then
    success "Database container is running"
else
    error "Database container is not running"
fi

# Print success message and next steps
echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║           Installation completed successfully!     ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo ""
echo "  1. Frontend: ${GREEN}http://localhost:5173${NC}"
echo "  2. Backend API: ${GREEN}http://localhost:3000${NC}"
echo "  3. Database: ${GREEN}localhost:5432${NC}"
echo ""
echo -e "${BLUE}Useful commands:${NC}"
echo ""
echo "  View logs:           $COMPOSE_CMD logs -f"
echo "  Stop containers:     $COMPOSE_CMD down"
echo "  Restart:             $COMPOSE_CMD restart"
echo "  Run tests:           $COMPOSE_CMD exec backend npm test"
echo "  Backend shell:       $COMPOSE_CMD exec backend sh"
echo "  Database shell:      $COMPOSE_CMD exec postgres psql -U $DB_USER -d $DB_NAME"
echo ""
echo -e "${YELLOW}Note:${NC} Update the .env file with secure credentials before production deployment"
echo ""
