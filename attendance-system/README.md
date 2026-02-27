# Attendance System

Full-stack attendance system with GPS + selfie punch, admin controls, and role-based access.

## Tech Stack
- Backend: Node.js (CommonJS) + Express + MongoDB Atlas (Mongoose) + Multer
- Frontend: React + Vite + TailwindCSS
- Auth: JWT Bearer + role-based access

## Prerequisites
- Node.js 20+
- MongoDB Atlas cluster
- Docker (optional)

## Environment
Create `server/.env` from `server/.env.example` and fill values.

## Local Development
1. Backend
```
cd attendance-system/server
npm install
npm run seed
npm run dev
```

2. Frontend
```
cd attendance-system/web
npm install
npm run dev
```

3. Open
- Frontend: http://localhost:5173
- Backend: http://localhost:4000

Default seed users:
- Admin: admin@test.com / Admin@123
- Worker: worker@test.com / Worker@123

Camera works on HTTPS or localhost.

## Deployment

### Option A: Docker (recommended)
1. Create `server/.env` with production values.
2. Build and run:
```
cd attendance-system
docker compose up --build
```
3. Open: http://localhost:4000

### Option B: VPS
1. Build the frontend:
```
cd attendance-system/web
npm install
npm run build
```
2. Serve in one of two ways:

Serve from Express:
- Copy `web/dist` to the VPS alongside `attendance-system/web/dist`.
- Set `SERVE_WEB=true` in `server/.env`.
- Start server:
```
cd attendance-system/server
npm install
node src/index.js
```

Serve via Nginx:
- Copy `web/dist` to `/var/www/attendance`.
- Configure Nginx to serve static files and proxy `/api` and `/uploads` to your Node server.

## Notes
- Photos are stored locally at `server/src/uploads`.
- Geofence and accuracy rules are enforced on the server.
- Attendance timestamps use server time only.
