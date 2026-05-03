# Velo Maps

Velo Maps is a live location tracking web app where authenticated users can join a shared map, stream their location in real time, and see movement updates from other active users.

It combines Google authentication, JWT-protected APIs and sockets, Kafka-based event processing, and a React map UI to create a proper real-time system instead of a fake demo flow.

## Demo

<img width="1919" height="969" alt="Screenshot 2026-05-03 162328" src="https://github.com/user-attachments/assets/4e9c8a94-d3d1-4230-b587-5406509d35d3" />
<img width="1916" height="980" alt="Screenshot 2026-05-03 162406" src="https://github.com/user-attachments/assets/9679c6a5-caea-4c57-962f-034361fe7601" />
<img width="749" height="443" alt="Screenshot 2026-05-03 161035" src="https://github.com/user-attachments/assets/6dc416e2-9723-4e4c-b883-af3119030a24" />

https://github.com/user-attachments/assets/f7e8d378-b7ba-492a-9726-3ace6c92b0cb

## Features

- Google OAuth login
- User persistence in PostgreSQL
- JWT-based auth for HTTP and Socket.IO
- Live location streaming over WebSockets
- Kafka producer for location events
- Two Kafka consumers:
  - socket consumer to broadcast updates
  - DB consumer to store updates
- Presence tracking for active users
- Last seen handling on disconnect
- Deduplication and rate limiting for location updates
- Cleanup for stale users
- Movement path drawing on the frontend

## Why This Project Stands Out

- Proper JWT + socket auth
- Kafka is actually used in the real-time pipeline
- Two separate consumers for broadcast and persistence
- Clean backend architecture
- Real movement trail feature on the map
- Active/live user handling with last seen logic

## Tech Stack

### Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- Leaflet
- Socket.IO Client
- Axios
- Lucide React

### Backend

- Node.js
- Express
- TypeScript
- Socket.IO
- KafkaJS
- PostgreSQL
- Drizzle ORM
- Google Auth Library
- JWT
- Zod

### Infra

- Docker
- Docker Compose
- Apache Kafka
- PostgreSQL

## Architecture Summary

### Phase 1: Base Setup

- Monorepo structure
- TypeScript + Express backend
- Docker setup for Kafka and Postgres

### Phase 2: Auth

- Google OAuth
- Save authenticated user in DB
- Return JWT to client

### Phase 3: Socket

- Socket.IO server setup
- JWT auth middleware for socket connections
- Authenticated real-time connection flow

### Phase 4: Kafka

- Kafka producer setup
- Location events published to Kafka

### Phase 5: Consumers

- Socket consumer broadcasts location updates
- DB consumer stores updates in PostgreSQL

### Phase 6: Presence System

- Track active users
- Handle disconnects
- Maintain last seen timestamps

### Phase 7: Optimization

- Deduplication of noisy updates
- Rate limiting for location events
- Cleanup of stale users

### Phase 8: Movement Feature

- Continuous location updates from client
- Path rendering on the frontend map

## Project Structure

```text
.
├── client/   # React frontend
└── server/   # Express + Socket.IO + Kafka + PostgreSQL backend
```

## Environment Variables

### Client

Create `client/.env`:

```env
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

### Server

Create `server/.env`:

```env
PORT=8000
DATABASE_URL=postgres://postgres:postgres@localhost:5432/velo
JWT_SECRET=your_jwt_secret
GOOGLE_CLIENT_ID=your_google_client_id
```

## Local Setup

### 1. Install dependencies

```bash
cd client
npm install
```

```bash
cd server
npm install
```

### 2. Start PostgreSQL and Kafka

From the `server/docker` folder:

```bash
docker compose up -d db kafka
```

### 3. Run database migrations

From the `server` folder:

```bash
npm run db:migrate
```

### 4. Start the backend

From the `server` folder:

```bash
npm run dev
```

Backend runs at `http://localhost:8000`.

### 5. Start the frontend

From the `client` folder:

```bash
npm run dev
```

Frontend runs at `http://localhost:5173`.

## Usage

1. Sign in with Google.
2. The backend verifies the Google token and returns a JWT.
3. The client stores the JWT and connects to Socket.IO using it.
4. The browser sends location updates continuously.
5. The backend publishes those updates to Kafka.
6. One consumer broadcasts updates to connected clients.
7. Another consumer stores updates in the database.
8. The frontend draws user movement paths on the map.

## Main Endpoints

- `POST /api/auth/google` - Google login and JWT issuance
- `GET /api/auth/community` - fetch community avatars for the login screen
- `GET /health` - health check

## Scripts

### Client

- `npm run dev` - start Vite dev server
- `npm run build` - build the frontend
- `npm run lint` - run ESLint

### Server

- `npm run dev` - compile and run backend in watch mode
- `npm run build` - build backend
- `npm run db:generate` - generate Drizzle migrations
- `npm run db:migrate` - run migrations
- `npm run studio` - open Drizzle Studio

## Notes

- The frontend currently expects the backend at `http://localhost:8000`.
- Google OAuth must be configured with the same client ID in both frontend and backend env files.
- Geolocation permission is required in the browser for live tracking to work.

## Future Improvements

- User list / active user panel
- Map filters and history playback
- Better admin monitoring for Kafka consumers
- Deployment config for production
