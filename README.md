# Neo Takehome - Collaborative Document Editor

A full-stack collaborative document editor built with React, Fastify, and real-time editing capabilities. This project demonstrates modern web development practices with TypeScript, real-time collaboration, and a clean architecture.

## 🚀 Features

### Core Features

- **Real-time collaborative editing** with multiple users
- **User authentication** with JWT and bcrypt
- **Document CRUD operations** with permissions
- **Live cursor tracking** and presence indicators
- **Edit history** with version control
- **Invite and collaboration** features
- **Responsive design** for all devices

### Technical Features

- **TypeScript** throughout the stack for type safety
- **Real-time updates** using Socket.IO
- **Database persistence** with Prisma ORM
- **Modern UI** with Tailwind CSS and shadcn/ui
- **Rich text editing** with TipTap editor
- **Protected routes** and authentication middleware
- **Validation** with Zod schemas

## 🛠️ Technology Stack

### Frontend

- **React 18** with Vite + TypeScript
- **Tailwind CSS** for styling
- **shadcn/ui** (Radix UI + Tailwind) for components
- **socket.io-client** for real-time communication
- **Zod** for form validation
- **TipTap** for rich text editing

### Backend

- **Fastify** with TypeScript
- **Prisma** with PostgreSQL
- **Socket.IO** for real-time features
- **fastify-jwt + bcrypt** for authentication
- **Zod** for request validation
- **Railway** for hosting

## 📦 Installation

### Prerequisites

- Node.js18
- PostgreSQL database
- Railway account (for hosting)

### Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/neo-takehome.git
   cd neo-takehome
   ```

2. **Install dependencies**

   ````bash
   # Install backend dependencies
   cd server
   npm install

   # Install frontend dependencies
   cd ../client
   npm install
   ```3*Environment Setup**
   ```bash
   # Backend (.env)
   DATABASE_URL="postgresql://..."
   JWT_SECRET=your-jwt-secret"
   PORT=31

   # Frontend (.env)
   VITE_API_URL=http://localhost:301   VITE_SOCKET_URL=http://localhost:31```

   ````

3. **Database Setup**

   ```bash
   cd server
   npx prisma generate
   npx prisma db push
   ```

4. **Start Development Servers**

   ```bash
   # Start backend (from server directory)
   npm run dev

   # Start frontend (from client directory)
   npm run dev
   ```

## 🏗️ Project Structure

```
neo-takehome/
├── client/                 # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── context/       # React context providers
│   │   ├── hooks/         # Custom React hooks
│   │   ├── lib/           # Utility libraries
│   │   ├── types/         # TypeScript type definitions
│   │   └── App.tsx
│   ├── tailwind.config.ts
│   └── package.json
├── server/                 # Fastify backend
│   ├── src/
│   │   ├── routes/        # API route handlers
│   │   ├── plugins/       # Fastify plugins
│   │   ├── websocket/     # Socket.IO handlers
│   │   ├── schema/        # Zod validation schemas
│   │   ├── utils/         # Utility functions
│   │   └── index.ts       # Server entry point
│   ├── prisma/
│   │   ├── schema.prisma  # Database schema
│   │   └── migrations/    # Database migrations
│   └── package.json
├── .env                    # Environment variables
├── tsconfig.json
├── package.json
├── README.md
├── .gitignore
└── railway.json           # Railway deployment config
```

## 🎯 Implementation Plan

### Day1: Auth + Setup

- ✅ Initialize Vite + Tailwind + shadcn/ui
- ✅ Set up Fastify + socket.io + JWT
- ✅ Connect Prisma to Railway PostgreSQL
- ✅ Build login/register UI with Zod validation
- ✅ Set up protected routes using JWT

### Day 2: Documents + Real-time

- ✅ Create document routes (CRUD)
- ✅ Build document editor UI with TipTap
- ✅ Add socket.io rooms and broadcast edits
- ✅ Enforce permissions on backend
- ✅ Add invite/collab features

### Day 3: History + Polish

- ✅ Implement edit history sidebar
- ✅ Add loading/error states
- ✅ Polish UI and transitions
- ✅ Finalize README (setup, architecture, AI usage)
- ✅ Deploy frontend + backend on Railway

## 🔧 API Endpoints

### Authentication

- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `GET /auth/me` - Get current user

### Documents

- `GET /documents` - List user's documents
- `POST /documents` - Create new document
- `GET /documents/:id` - Get document by ID
- `PUT /documents/:id` - Update document
- `DELETE /documents/:id` - Delete document
- `POST /documents/:id/invite` - Invite collaborator

### WebSocket Events

- `join-document` - Join document room
- `leave-document` - Leave document room
- `document-edit` - Broadcast document changes
- `cursor-move` - Broadcast cursor position

## 🎨 UI Components

### Core Components

- **AuthForm** - Login/Register forms with validation
- **DocumentEditor** - TipTap-based rich text editor
- **DocumentList** - List of user's documents
- **CollaboratorList** - Show active collaborators
- **HistorySidebar** - Document edit history
- **LoadingSpinner** - Loading states
- **ErrorBoundary** - Error handling

### Layout Components

- **Header** - Navigation and user menu
- **Sidebar** - Document navigation
- **MainContent** - Editor area
- **Modal** - Reusable modal component

## 🔐 Authentication Flow

1 **Registration**: User creates account with email/password
2**: User authenticates and receives JWT token 3. **Protected Routes**: Frontend checks JWT for access4 **API Requests**: Backend validates JWT on each request5eal-time**: Socket.IO uses JWT for room access

## 📊 Database Schema

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String
  name      String?
  documents Document[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Document {
  id          String   @id @default(cuid())
  title       String
  content     String   @default("")
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  collaborators User[] @relation("DocumentCollaborators")
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

## 🚀 Deployment

### Railway Deployment

1. **Backend**: Connect GitHub repo to Railway
   - Set build command: `npm install && npx prisma generate`
   - Set start command: `npm start`
   - Add environment variables2. **Frontend**: Deploy to Vercel
   - Connect GitHub repo to Vercel
   - Set build command: `npm run build`
   - Set output directory: `dist`

### Environment Variables

```env
# Backend (Railway)
DATABASE_URL="postgresql://...
JWT_SECRET=your-secret-key"
PORT=31

# Frontend (Vercel)
VITE_API_URL=https://your-backend.railway.app"
VITE_SOCKET_URL=https://your-backend.railway.app"
```

## 🧪 Testing

```bash
# Backend tests
cd server
npm test

# Frontend tests
cd client
npm test

# E2E tests
npm run test:e2e
```

## 📝 Development Guidelines

### Code Style

- Use TypeScript for all files
- Follow ESLint and Prettier configurations
- Write meaningful commit messages
- Add JSDoc comments for complex functions

### Component Structure

```typescript
interface ComponentProps {
  // Define props interface
}

const Component: React.FC<ComponentProps> = ({ prop1prop2 }) => {
  // Component logic
  return (
    // JSX
  );
};

export default Component;
```

### State Management

- Use React hooks for local state
- Use Context API for global state (auth, documents)
- Keep state as close to where it's used as possible

## 🔮 Future Enhancements

### Planned Features

- [ ] Real-time comments and annotations
- [ ] Document templates
- ] Export to PDF/Markdown
- [ ] Advanced search functionality
- [ ] Mobile app (React Native)

### Performance Improvements

- [ ] Virtual scrolling for large documents
- [ ] Lazy loading of components
- [ ] Web Workers for heavy operations
- Service Worker for offline support

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

-TipTap](https://tiptap.dev/) - Rich text editor

- [Fastify](https://www.fastify.io/) - Fast web framework
- [Prisma](https://www.prisma.io/) - Database toolkit
- [Socket.IO](https://socket.io/) - Real-time communication
- [shadcn/ui](https://ui.shadcn.com/) - Beautiful UI components

## 📞 Support

If you encounter any issues or have questions:

- Create an issue on GitHub
- Check the documentation
- Review the implementation plan

---

**Built with ❤️ using React, Fastify, and TypeScript**
