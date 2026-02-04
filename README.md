# 🔒 DocShare - Secure Document Sharing System

A secure platform for sharing sensitive documents with time-limited, password-protected links. Built with security and privacy in mind.

## 🎯 What It Does

Users can upload sensitive documents (PDFs, images, etc.), generate secure shareable links, and control who accesses them. Think "better than emailing attachments" for things like medical records, tax documents, and contracts.

## ✨ Core Features

- **User Authentication**: Secure user accounts and session management
- **Document Upload**: Support for multiple file types with configurable size limits
- **Shareable Links**: Generate unique, secure links for each document
- **Access Controls**:
  - Time-limited (expires after X hours/days)
  - Password-protected links
  - View-only vs download permissions
- **Access Logs**: Track who viewed what and when
- **Secure Deletion**: Automatic cleanup when links expire

## 🛠 Tech Stack

### Backend
- **Runtime**: Node.js 20
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL 16
- **Authentication**: JWT (Ready for Clerk/Auth.js integration)
- **File Storage**: Local filesystem (v1), S3-ready architecture

### Frontend
- **Framework**: React 18
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Build Tool**: Vite
- **State Management**: React Hooks

### DevOps
- **Containerization**: Docker + Docker Compose
- **Development**: Hot reload enabled for both frontend and backend

## 🚀 Quick Start

### Prerequisites
- Docker 20.10+ and Docker Compose v2.0+
- Git

### Automated Installation

The easiest way to get started is using the installation script:

```bash
# Clone the repository
git clone https://github.com/obrienma/secure-document-sharing.git
cd secure-document-sharing

# Run the installation script
./install.sh
```

The script will:
- ✅ Check prerequisites (Docker, Docker Compose)
- ✅ Set up environment variables
- ✅ Build and start Docker containers
- ✅ Initialize the database schema
- ✅ Install all dependencies
- ✅ Verify the installation

### Manual Setup

If you prefer to set up manually:

1. **Clone the repository**
   ```bash
   git clone https://github.com/obrienma/secure-document-sharing.git
   cd doc-share
   ```

2. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your settings
   ```

3. **Start with Docker Compose**
   ```bash
   docker compose up -d --build
   ```

4. **Initialize the database**
   ```bash
   docker compose exec backend psql -h docshare-db -U docshare_user -d docshare < backend/src/db/schema.sql
   ```

5. **Install dependencies**
   ```bash
   docker compose exec backend npm install
   docker compose exec frontend npm install
   ```

6. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000
   - Database: localhost:5432

### Development Commands

```bash
# Start all services
docker compose up

# Start in detached mode
docker compose up -d

# Stop all services
docker compose down

# Rebuild containers
docker compose up --build

# View logs
docker compose logs -f

# Run backend tests
docker compose exec backend npm test

# Run tests with coverage
docker compose exec backend npm test -- --coverage

# Access backend shell
docker compose exec backend sh

# Access database
docker compose exec docshare-db psql -U docshare_user -d docshare
```

## 🧪 Testing

The project includes comprehensive test coverage:

**Test Suites:**
- ✅ 6 test suites
- ✅ 39 passing tests
- ✅ 0 failures

**Coverage:**
- Auth Service: 100%
- Share Service: 100%
- Links Service: 73%
- Documents Service: 72%
- Controllers: 60%+

**Running Tests:**
```bash
# All tests
docker compose exec backend npm test

# Watch mode
docker compose exec backend npm test -- --watch

# Coverage report
docker compose exec backend npm test -- --coverage
```

**Test Structure:**
```
backend/src/
├── auth/__tests__/
│   ├── auth.service.test.ts (5 tests)
│   └── auth.controller.test.ts (4 tests)
├── links/__tests__/
│   ├── links.service.test.ts (18 tests)
│   └── links.controller.test.ts (5 tests)
├── documents/__tests__/
│   └── documents.service.test.ts (6 tests)
└── share/__tests__/
    └── share.service.test.ts (3 tests)
```

# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Local Development (without Docker)

**Backend:**
```bash
cd backend
npm install
npm run dev
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

## 📁 Project Structure

```
doc-share/
├── backend/
│   ├── src/
│   │   └── index.ts          # Express server entry point
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── App.tsx            # Main React component
│   │   ├── main.tsx           # React entry point
│   │   └── index.css          # Tailwind imports
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── docker-compose.yml
├── .env.example
├── .gitignore
└── README.md
```

## 🔐 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Helmet.js security headers
- CORS configuration
- Input validation with Zod
- Secure file storage
- Time-based access expiration
- Audit logging

## 🎯 Roadmap

### Phase 1: MVP (Current)
- [x] Project setup with Docker
- [x] Basic backend API structure
- [x] Frontend skeleton with React + Tailwind
- [x] User registration and login
- [x] File upload functionality
- [x] Basic link generation

### Phase 2: Core Features
- [x] Time-limited links
- [x] Password-protected links
- [x] Access permissions (view/download)
- [x] Access logs and analytics
- [x] User dashboard

### Phase 3: Enhancements
- [ ] Email notifications
- [ ] Bulk file operations
- [ ] Advanced analytics
- [ ] S3 storage integration
- [ ] Clerk/Auth.js integration

### Phase 4: Production
- [ ] Deploy to Vercel (frontend)
- [ ] Deploy to Railway/Render (backend)
- [ ] CI/CD pipeline
- [ ] Monitoring and logging
- [ ] Performance optimization

## 🤝 Contributing

This is a personal project, but suggestions and feedback are welcome!

## � Documentation

- **[Quick Reference](QUICKREF.md)** - Essential commands and quick tasks
- **[Troubleshooting Guide](TROUBLESHOOTING.md)** - Common issues and solutions
- **[Installation Script](install.sh)** - Automated setup- **[Deployment Guide](DEPLOYMENT.md)** - Deploy to Render.com or VPS

## 🚀 Deployment

### Deploy to Render.com

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)

1. Click the button above or push your code to GitHub
2. Sign up for [Render.com](https://render.com)
3. Create a new Blueprint and connect your repository
4. Render will automatically deploy all services from `render.yaml`
5. Initialize the database schema (see [DEPLOYMENT.md](DEPLOYMENT.md))

See the complete [Deployment Guide](DEPLOYMENT.md) for detailed instructions.
## 📝 License

MIT

## 👤 Author

Built as a portfolio project demonstrating full-stack development with security best practices.

