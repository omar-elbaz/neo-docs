# Neo-Docs Project Requirements

## Purpose

You are building a real-time collaborative writing platform where multiple users can:

- Create and edit documents
- Invite others with different permission levels (read/write)
- Collaborate in real-time with conflict resolution
- View a live edit history sidebar
- Authenticate securely

## Core Features (Required)

### 1. Authentication

- **Email/password login**
- **JWT-based or session authentication**
- **Basic registration and login forms**
- **Protect routes on both frontend and backend**

### 2. Documents

- **Create, view, and edit documents**
- **Store rich text** (HTML or JSON via a rich text editor)
- **List all documents** a user has access to

### 3. Sharing & Permissions

- **Users can invite others to a document:**
  - View-only
  - Edit access
- **Backend must enforce permissions**

### 4. Real-Time Collaboration

- **Multiple users editing** the same document should see each other's updates in real time
- **Use WebSockets or a real-time backend**
- **Handle basic conflict resolution** (e.g., last-write-wins or optimistic updates)

### 5. Live Edit History Sidebar

- **Sidebar shows list of changes** made during the current session:
  - User who made the change
  - Timestamp
  - Action (e.g., "Inserted text", "Deleted block", etc.)

### 6. Frontend Polishing

- **Modern UI** using React + Tailwind or another library
- **Good UX** (loading states, error handling, etc.)

## Technical Constraints

### What You May Do

- ✅ Use AI to assist you
- ✅ Use helpful open source packages
- ✅ Choose any tech stack, infrastructure, etc. (unopinionated)

### What You May NOT Do

- ❌ **Use open source editors that come with real-time collaborative editing out of the box**
- ❌ You **must implement collaborative editing yourself**

## Evaluation Criteria

### Primary Evaluation Areas

1. **Code structure & clarity**
2. **Real-time functionality**
3. **Permissions & authentication**
4. **UX/UI polish**
5. **Conflict handling**
6. **Bonus features**

### Discussion Requirements

- 45-minute discussion about your solution
- Must be able to explain tradeoffs you considered while developing
- Focus on technical decisions and architectural choices

## Bonus Features (Nice to Have)

### Optional Enhancements

- [ ] **Folder structure or document tagging**
- [ ] **Offline support or autosave**
- [ ] **Basic unit or integration tests**
- [ ] **Git-style version history**
- [ ] **Mobile responsiveness**

## Implementation Status

### ✅ Completed Core Features

- [x] Authentication (JWT + bcrypt)
- [x] Document CRUD operations
- [x] Real-time collaboration (Socket.IO + Kafka)
- [x] Sharing & permissions system
- [x] Modern UI with Material-UI
- [x] Conflict resolution (last-write-wins with Kafka ordering)

### ❌ Missing Core Features

- [ ] **Live Edit History Sidebar** (Critical - Core Requirement)

### ✅ Completed Bonus Features

- [x] Document tagging (schema exists)
- [x] Mobile responsiveness (partial)
- [x] Modern React UI

### ❌ Missing Bonus Features

- [ ] Unit/integration tests
- [ ] Git-style version history UI
- [ ] Offline support/autosave
- [ ] Complete mobile responsiveness

## Architecture Decisions Made

### Real-Time Collaboration Implementation

- **Chosen**: WebSocket (Socket.IO) + Kafka event sourcing
- **Alternative Considered**: Direct WebSocket without event queue
- **Tradeoff**: Added complexity for better reliability and audit trail

### Conflict Resolution Strategy

- **Chosen**: Last-write-wins with Kafka message ordering
- **Alternative Considered**: Operational transforms
- **Tradeoff**: Simpler implementation but potential data loss in complex scenarios

### Authentication Method

- **Chosen**: JWT-based authentication
- **Alternative Considered**: Session-based authentication
- **Tradeoff**: Stateless but requires secure token storage

### Rich Text Editor

- **Chosen**: TipTap/ProseMirror
- **Alternative Considered**: Draft.js, Slate.js
- **Tradeoff**: More complex but better collaborative editing support

## Critical Next Steps

### Immediate Priorities (Core Requirements)

1. **Implement Live Edit History Sidebar** - This is a core requirement that's completely missing
2. **Enhance conflict resolution feedback** - Users need to see when conflicts occur
3. **Improve real-time collaboration robustness** - Handle edge cases and connection issues

### Technical Debt

1. **Add comprehensive testing** - No tests currently exist
2. **Improve error handling** - Inconsistent error states
3. **Add proper logging and monitoring** - Limited visibility into system behavior

## Notes

- This is a temporary requirements document for development reference
- Will be removed before final submission
- Use this to track progress against original requirements
- Focus on completing missing core features before bonus features

ACTION ITEMS:

Fix edit history tracking cadence

use long term file store

menu options from dashboard document card to delete

username and settings in tool bar menu
deploy to railway
