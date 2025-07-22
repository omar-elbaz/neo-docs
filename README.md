# Neo-Docs - Collaborative Document Editor

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
                                     ┌──────────────────┐
                                     │   PostgreSQL     │
                                     │    Database      │
                                     └──────────────────┘
                                              ▲
                                              │
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
- **Live cursor tracking** and user presence indicators
- **Event-driven architecture** with Kafka for reliability
- **Rich text editing** with TipTap/ProseMirror
- **Responsive design** for all devices

### Technical Features
- **TypeScript** throughout the stack for type safety
- **Real-time updates** using Socket.IO WebSockets
- **Event sourcing** with Kafka message queue
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
- **Apache Kafka** for event streaming
- **JWT + bcrypt** for authentication
- **Zod** for request validation

### Infrastructure
- **Docker** for containerization
- **PostgreSQL** for primary database
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
│   │   ├── services/         # Business logic & Kafka
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

## 🤖 How AI Was Used

### Development Assistance
- **Architecture Design**: Used AI to evaluate different approaches for real-time collaboration (WebRTC vs WebSocket, direct DB vs event sourcing)
- **Code Generation**: Generated boilerplate for Prisma schemas, API routes, and React components
- **Problem Solving**: Debugged complex issues with Kafka message ordering and WebSocket state management
- **Documentation**: Generated comprehensive API documentation and setup instructions

### Specific AI Contributions
- Designed the Kafka event flow architecture
- Generated TypeScript types from Prisma schema
- Created Material-UI component patterns
- Wrote Docker configuration for development environment
- Generated test data and migration scripts

### AI Limitations Encountered
- Had to manually fine-tune WebSocket event handling
- Required custom logic for document state synchronization
- Needed to implement custom validation beyond what AI suggested
- Database performance optimization required domain expertise

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

### Production Setup
```bash
# Production deployment with Docker
docker-compose -f docker-compose.prod.yml up -d

# Run database migrations
docker-compose -f docker-compose.prod.yml run --rm backend npx prisma migrate deploy
```

### Environment Variables
```env
# Backend Production
DATABASE_URL="postgresql://..."
JWT_SECRET="secure-random-string"
KAFKA_BROKERS="kafka:29092"
NODE_ENV="production"

# Frontend Production  
VITE_API_URL="https://your-api-domain.com"
VITE_SOCKET_URL="https://your-api-domain.com"
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Built with ❤️ using React, Material-UI, Fastify, and Apache Kafka**