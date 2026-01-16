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
- Docker and Docker Compose installed
- Node.js 20+ (for local development without Docker)
- Git

### Setup

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd doc-share
   ```

2. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your settings
   ```

3. **Start with Docker Compose**
   ```bash
   docker-compose up
   ```

4. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001
   - Database: localhost:5432

### Development Commands

```bash
# Start all services
docker-compose up

# Start in detached mode
docker-compose up -d

# Stop all services
docker-compose down

# Rebuild containers
docker-compose up --build

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
- [ ] User registration and login
- [ ] File upload functionality
- [ ] Basic link generation

### Phase 2: Core Features
- [ ] Time-limited links
- [ ] Password-protected links
- [ ] Access permissions (view/download)
- [ ] Access logs and analytics
- [ ] User dashboard

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

## 📝 License

MIT

## 👤 Author

Built as a portfolio project demonstrating full-stack development with security best practices.
