# Scribe - Collaborative Document Editor

A full-stack collaborative document editor built with React, Fastify, and real-time editing capabilities. This project demonstrates modern web development practices with TypeScript, event-driven architecture, and real-time collaboration.

## 🏗️ System Architecture

```
┌─────────────────┐    WebSocket     ┌──────────────────┐
│  React Frontend │ ←──────────────→ │  Fastify Server  │
│   (Material-UI) │    Socket.IO     │   (WebSocket)    │
└─────────────────┘                  └──────────────────┘
                                              │
                                              │ HTTP API
                                              ▼
                            ┌──────────────────┬──────────────────┐
                            │   PostgreSQL     │   AWS S3         │
                            │  (Metadata)      │ (File Storage)   │
                            └──────────────────┴──────────────────┘
                                              ▲
                                              │ Hybrid Storage
┌─────────────────┐    Consume       ┌──────────────────┐
│  Kafka Worker   │ ←──────────────── │   Apache Kafka   │
│  (Persistence)  │     Messages     │  (Event Queue)   │
└─────────────────┘                  └──────────────────┘
                                              ▲
                                              │ Publish
                                              │ Events
                                     ┌──────────────────┐
                                     │  WebSocket       │
                                     │  Event Handler   │
                                     └──────────────────┘
```

## 🚀 Features

### Core Features
- **Real-time collaborative editing** with multiple users
- **User authentication** with JWT and bcrypt
- **Document CRUD operations** with sharing permissions
- **Hybrid storage system** - PostgreSQL + AWS S3
- **Live cursor tracking** and user presence indicators
- **Event-driven architecture** with Kafka for reliability
- **Rich text editing** with TipTap/ProseMirror
- **Responsive design** for all devices

### Technical Features
- **TypeScript** throughout the stack for type safety
- **Real-time updates** using Socket.IO WebSockets
- **Event sourcing** with Kafka message queue
- **Hybrid storage** - PostgreSQL metadata + S3 file storage
- **Database persistence** with Prisma ORM
- **Modern UI** with Material-UI components
- **Protected routes** and authentication middleware
- **Schema validation** with Zod

## 🛠️ Technology Stack

### Frontend
- **React 18** with Vite + TypeScript
- **Material-UI** for component library
- **TipTap/ProseMirror** for rich text editing
- **Socket.IO Client** for real-time communication
- **Zod** for form validation
- **React Router** for navigation

### Backend
- **Fastify** with TypeScript
- **Socket.IO** for WebSocket connections
- **Prisma ORM** with PostgreSQL
- **AWS S3** for file storage
- **Apache Kafka** for event streaming
- **JWT + bcrypt** for authentication
- **Zod** for request validation

### Infrastructure
- **Docker** for containerization
- **DigitalOcean Droplet** for hosting
- **PostgreSQL** for metadata and document structure
- **AWS S3** for document content storage
- **Apache Kafka** with Zookeeper for event streaming
- **Prisma Studio** for database management

## 📦 Setup Instructions

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- Git

### Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/neo-docs.git
   cd neo-docs
   ```

2. **Start the development environment**
   ```bash
   # Start all services (PostgreSQL, Kafka, Zookeeper, Backend, Frontend, Worker)
   docker-compose -f docker-compose.dev.yml up
   ```

3. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001
   - Prisma Studio: http://localhost:5555
   - Kafka UI: http://localhost:8080

### Manual Development Setup

If you prefer to run services individually:

1. **Environment Setup**
   ```bash
   # Backend environment (.env in backend/)
   DATABASE_URL="postgresql://user:password@localhost:5432/neodocs"
   JWT_SECRET="your-jwt-secret"
   KAFKA_BROKERS="localhost:9092"
   PORT=3001
   
   # AWS S3 Configuration (optional - will use PostgreSQL only if not set)
   AWS_ACCESS_KEY_ID="your-access-key"
   AWS_SECRET_ACCESS_KEY="your-secret-key"
   AWS_REGION="us-east-1"
   S3_BUCKET_NAME="neo-docs-storage"
   ```

2. **Install dependencies**
   ```bash
   # Backend
   cd backend
   npm install
   
   # Frontend  
   cd ../frontend
   npm install
   ```

3. **Database Setup**
   ```bash
   cd backend
   npx prisma generate
   npx prisma migrate dev
   ```

4. **Start services**
   ```bash
   # Terminal 1: Start Kafka & PostgreSQL
   docker-compose -f docker-compose.dev.yml up db kafka zookeeper
   
   # Terminal 2: Backend server
   cd backend && npm run dev
   
   # Terminal 3: Kafka worker
   cd backend && npm run worker
   
   # Terminal 4: Frontend
   cd frontend && npm run dev
   ```

## 🏗️ Project Structure

```
neo-docs/
├── backend/                    # Fastify backend
│   ├── prisma/
│   │   ├── schema.prisma      # Database schema
│   │   └── migrations/        # Database migrations
│   ├── src/
│   │   ├── routes/           # API route handlers
│   │   │   ├── auth/         # Authentication routes
│   │   │   └── documents.ts  # Document CRUD routes
│   │   ├── websocket/        # Socket.IO handlers
│   │   ├── services/         # Business logic & storage
│   │   │   ├── s3.ts         # AWS S3 service
│   │   │   └── storage.ts    # Hybrid storage service
│   │   ├── schema/           # Zod validation schemas
│   │   ├── utils/            # Utility functions
│   │   ├── server.ts         # Fastify server setup
│   │   └── worker.ts         # Kafka consumer worker
│   └── package.json
├── frontend/                   # React frontend
│   ├── src/
│   │   ├── components/       # UI components
│   │   ├── pages/           # Page components
│   │   ├── lib/             # API client & utilities
│   │   ├── types/           # TypeScript definitions
│   │   └── main.tsx         # App entry point
│   └── package.json
├── docker-compose.dev.yml      # Development environment
├── docker-compose.prod.yml     # Production environment
└── README.md
```

## 🎯 Design Decisions

### Event-Driven Architecture
**Decision**: Use Kafka for document operations instead of direct database writes
**Reasoning**: 
- Ensures data consistency across multiple users
- Provides audit trail of all document changes
- Allows for future features like document history replay
- Separates real-time collaboration from persistence concerns

### WebSocket-First Updates
**Decision**: Disable REST PUT endpoints for document updates
**Reasoning**:
- Forces all updates through real-time collaboration flow
- Prevents conflicts between REST and WebSocket updates
- Ensures all users see changes immediately
- Simplifies state management

### Separate Worker Process
**Decision**: Run Kafka consumer as separate service from web server
**Reasoning**:
- Improves reliability - web server can restart without losing events
- Better resource isolation for CPU-intensive operations
- Easier to scale workers independently
- Clean separation of concerns

### Material-UI Over Custom Components
**Decision**: Use Material-UI instead of custom component library
**Reasoning**:
- Faster development with pre-built components
- Consistent design system
- Built-in accessibility features
- Good TypeScript support

## ⚖️ Tradeoffs & Improvements

### Current Tradeoffs

1. **Complexity vs Reliability**
   - **Tradeoff**: Added Kafka increases system complexity
   - **Benefit**: Much better reliability and event ordering
   - **Improvement**: Could add health checks and better error recovery

2. **Memory Usage**
   - **Tradeoff**: In-memory document state for WebSocket performance
   - **Risk**: Memory leaks with many concurrent documents
   - **Improvement**: Implement document state cleanup and LRU eviction

3. **Real-time vs Consistency**
   - **Tradeoff**: WebSocket updates are eventually consistent
   - **Benefit**: Immediate user feedback
   - **Improvement**: Add operational transforms for true conflict resolution

### What I'd Improve With More Time

1. **Testing Infrastructure**
   - Add comprehensive unit, integration, and e2e tests
   - Mock Kafka for testing
   - Add WebSocket testing utilities

2. **Performance Optimization**
   - Implement virtual scrolling for large documents
   - Add lazy loading and code splitting
   - Optimize bundle size and loading times

3. **Enhanced Collaboration**
   - Add comment threads and annotations
   - Implement proper operational transforms
   - Add user presence indicators and cursor colors

4. **Mobile Experience**
   - Improve responsive design
   - Add touch-friendly editing
   - Consider PWA features

5. **Production Features**
   - Add monitoring and logging
   - Implement rate limiting
   - Add backup and disaster recovery
   - User permission management UI

## 🎯 Storage Architecture

### Hybrid Storage System
The application uses a **hybrid storage approach** that combines the best of both worlds:

**PostgreSQL (Metadata & Structure)**:
- Document metadata (title, author, permissions, timestamps)
- User authentication and sharing permissions
- Document relationships and access control
- Fast queries for document lists and user management

**AWS S3 (Content Storage)**:
- Document content and rich text data
- Scalable file storage for large documents
- Automatic backup and versioning
- Cost-effective long-term storage

### Storage Modes
The system automatically detects and switches between storage modes:

1. **PostgreSQL-only mode**: When S3 credentials are not configured
2. **Hybrid mode**: When S3 is configured - stores metadata in PostgreSQL and content in S3
3. **Graceful fallback**: If S3 fails, automatically falls back to PostgreSQL storage

### Benefits
- **Performance**: Fast metadata queries with PostgreSQL
- **Scalability**: Unlimited document storage with S3
- **Reliability**: Automatic fallback ensures high availability
- **Cost-effective**: Pay only for S3 storage you use
- **Future-proof**: Easy migration path as your application grows

## 🔧 API Endpoints

### Authentication
- `POST /auth/register` - User registration with names
- `POST /auth/login` - User login
- `GET /auth/me` - Get current user profile

### Documents
- `GET /documents` - List user's accessible documents
- `POST /documents` - Create new document
- `GET /documents/:id` - Get document by ID
- `DELETE /documents/:id` - Delete document (owner only)
- `POST /documents/:id/share` - Share document with user

### WebSocket Events
- `join-document` - Join document collaboration room
- `leave-document` - Leave document room  
- `document-operation` - Send document edit operation
- `user-cursor` - Broadcast cursor position
- `user-selection` - Broadcast text selection

## 🔐 Authentication Flow

1. **Registration**: User creates account with email/password and names
2. **Login**: User authenticates and receives JWT token
3. **Protected Routes**: Frontend checks JWT for page access
4. **API Requests**: Backend validates JWT on each request
5. **WebSocket**: Socket.IO uses JWT for room access and user identification

## 🚀 Deployment

### DigitalOcean Production Deployment

The application is deployed on a DigitalOcean droplet using Docker Compose.

#### Deployment Steps

1. **Setup DigitalOcean Droplet**
   ```bash
   # SSH into your droplet
   ssh root@your-droplet-ip
   
   # Clone the repository
   git clone https://github.com/omar-elbaz/neo-docs.git
   cd neo-docs
   ```

2. **Configure Environment Variables**
   ```bash
   # Create .env file with production values
   cp .env.example .env
   nano .env
   ```

3. **Deploy with Docker Compose**
   ```bash
   # Run the deployment script
   chmod +x deploy.sh
   ./deploy.sh
   ```

#### Access Your Application
- **Frontend**: http://your-droplet-ip:8150
- **Backend API**: http://your-droplet-ip:3001
- **Database**: PostgreSQL running on port 5432 (internal)

### Environment Variables
```env
# Database Configuration
POSTGRES_USER=omarelbaz
POSTGRES_PASSWORD=your_secure_password

# JWT Configuration
JWT_SECRET=your-super-long-jwt-secret-key

# Kafka Configuration
KAFKA_BROKERS=kafka:29092

# AWS S3 Configuration (optional)
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
S3_BUCKET_NAME=your-bucket-name

# API Configuration
API_URL=http://your-droplet-ip:3001

# Environment
NODE_ENV=production
```

### Production Services
The application runs the following Docker containers:
- **Frontend**: React app on port 8150
- **Backend**: Fastify API server on port 3001
- **Worker**: Kafka consumer for document processing
- **PostgreSQL**: Database on port 5432
- **Kafka + Zookeeper**: Event streaming infrastructure

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Built with ❤️ using React, Material-UI, Fastify, and Apache Kafka**
