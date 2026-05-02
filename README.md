# Team Task Manager

A full-stack application built to manage teams, projects, and tasks with role-based access control.

## Features
- **Authentication**: JWT-based secure signup and login.
- **Projects**: Create projects and manage team members (Admin / Member roles).
- **Task Management**: Create tasks, assign them to members, set due dates, and update statuses (TODO, IN_PROGRESS, DONE).
- **Dashboard Overview**: View aggregated stats on task progress and easily access your projects.
- **Rich Aesthetics**: Deep dark mode, neon accents, glassmorphism, and smooth animations using Vanilla CSS.

## Tech Stack
- **Frontend**: React, Vite, React Router, Context API, Vanilla CSS.
- **Backend**: Node.js, Express.js, TypeScript.
- **Database & ORM**: PostgreSQL, Prisma.
- **Deployment**: Configured for Railway deployment out-of-the-box.

## Local Development (Quick Start)

### Prerequisites
- Node.js (v18+)
- SQLite (pre-configured for local dev) or PostgreSQL.

### Setup
1. Install dependencies from the root directory:
   ```bash
   npm install
   ```

2. Initialize the database (SQLite by default for local):
   ```bash
   cd backend
   npx prisma db push
   npx prisma generate
   ```

3. Start the application:
   - Terminal 1 (Backend): `cd backend && npm run dev`
   - Terminal 2 (Frontend): `cd frontend && npm run dev`

## Deployment to Railway

This repository is structured as a monorepo specifically configured to deploy easily on Railway as a single Web Service.

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Deploy on Railway**:
   - Go to [Railway](https://railway.app/).
   - Click **New Project** > **Deploy from GitHub repo**.
   - Select your newly created repository.
   - Add a **PostgreSQL Database** to your Railway project.

3. **Configure Environment Variables**:
   In your Web Service on Railway, set the following environment variables:
   - `DATABASE_URL`: Add the connection string from your Railway Postgres database.
   - `JWT_SECRET`: A strong random string for JWT signing.
   - `NODE_ENV`: `production`
   - `PORT`: Automatically set by Railway (or set to `5000`).

4. **Migrate Production Database**:
   Since Prisma requires an initial schema push for a new database, you may need to run this command in the Railway "Command" panel for the web service, or update the `build` script to include `npx prisma db push --accept-data-loss`.

## Submission Details
- **Live URL**: (To be added after deployment)
- **GitHub Repo**: (Your repository URL)
- **Demo Video**: Record your 2-5 min Loom or OBS video and attach the link!
