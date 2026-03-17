# Collaborative Cloud Platform

A Dockerized collaborative Kanban-style cloud platform built with **React + Vite**, **Node.js + Express**, **PostgreSQL**, **Prisma**, and **Socket.IO**.

This project is currently configured for **local development** using Docker Compose.  
Cloud deployment instructions will be added later after the server environment is finalized.

---

## Features

### Authentication and Roles
- User registration and login
- JWT-based authentication
- Role-based access control
- Default registration creates a **MEMBER**
- **ADMIN** users are currently created by promoting an existing user in PostgreSQL

### Task Management
- Create tasks (**ADMIN only**)
- Assign and reassign tasks (**ADMIN only**)
- Update task status
- Delete tasks (**ADMIN only**)
- Kanban board with:
  - TODO
  - IN_PROGRESS
  - DONE

### Collaboration
- Real-time task sync using WebSocket
- Task-specific discussion thread
- Full discussion modal
- Admin can:
  - delete comments
  - lock or unlock discussions
- Comment count badge on each task card

### UI
- Dark / Light theme
- Role-aware dashboard
- Task drawer with:
  - Details tab
  - Discussion tab

---

## Tech Stack

### Frontend
- React
- Vite
- Socket.IO client

### Backend
- Node.js
- Express
- Prisma ORM
- JWT auth
- Socket.IO

### Database
- PostgreSQL

### Local Development / Infrastructure
- Docker
- Docker Compose

---

## Project Structure

```text
collab-cloud-platform/
├─ README.md
├─ .env.example
├─ .gitignore
├─ docker-compose.yml
├─ frontend/
│  ├─ Dockerfile
│  ├─ package.json
│  ├─ index.html
│  └─ src/
├─ backend/
│  ├─ Dockerfile
│  ├─ package.json
│  ├─ prisma/
│  │  ├─ schema.prisma
│  │  └─ migrations/
│  └─ src/
└─ docs/
````

---

## Prerequisites

Make sure the following are installed on your machine:

* Docker
* Docker Compose
* Git

Recommended environment:

* WSL on Windows
* macOS Terminal
* Linux shell

---

## Local Setup

### 1. Clone the repository

```bash
git clone https://github.com/Z1linQ/cloud-platform.git
cd cloud-platform
```

### 2. Create the root `.env`

Copy the example file:

```bash
cp .env.example .env
```

Recommended `.env` values:

```env
POSTGRES_DB=collab_db
POSTGRES_USER=collab_user
POSTGRES_PASSWORD=collab_password

BACKEND_PORT=3000
FRONTEND_PORT=5173

JWT_SECRET=change_this_super_secret_key
```

If you change the database username, password, or database name, make sure you also update the SQL command used later for admin promotion.

### 3. Start the containers

```bash
docker compose up --build
```

After startup, the services should be available at:

* Frontend: `http://localhost:5173`
* Backend health: `http://localhost:3000/api/health`
* Backend database health: `http://localhost:3000/api/db-health`

---

## Database Setup

### 4. Run Prisma migration

After the containers are running, execute:

```bash
docker compose exec backend npx prisma migrate dev
docker compose exec backend npx prisma generate
```

If migrations already exist, this will apply them to the local database.

---

## Creating Users

### 5. Register a normal MEMBER account

Open the frontend in your browser:

```text
http://localhost:5173
```

Register a user normally through the UI.

Example test users:

* `admin@example.com`
* `member@example.com`

At this stage, **all users registered through the UI are created as MEMBER by default**.

---

## Creating an ADMIN User

### 6. Promote an existing user to ADMIN

After registering a user, promote them manually in PostgreSQL.

Example:

```bash
docker compose exec db psql -U collab_user -d collab_db -c "UPDATE \"User\" SET role='ADMIN' WHERE email='admin@example.com';"
```

If your `.env` uses different database values, replace:

* `collab_user`
* `collab_db`

After promotion, log out and log back in with that account to refresh the role in the frontend.

---

## Role Policy

### MEMBER can:

* View tasks related to them
* Change the status of related tasks
* Add comments
* View comments
* View locked discussions in read-only mode

### ADMIN can:

* Create tasks
* Assign and reassign tasks
* Change any task status
* Delete tasks
* Lock and unlock discussions
* Delete any comment
* View all tasks and summary statistics

---

## Useful Commands

### Start containers

```bash
docker compose up --build
```

### Stop containers

```bash
docker compose down
```

### Stop containers and remove volumes

```bash
docker compose down -v
```

### Check running services

```bash
docker compose ps
```

### View backend logs

```bash
docker compose logs backend
```

### View frontend logs

```bash
docker compose logs frontend
```

### View database logs

```bash
docker compose logs db
```

### Open a shell inside the backend container

```bash
docker compose exec backend sh
```

### Open PostgreSQL shell

```bash
docker compose exec db psql -U collab_user -d collab_db
```

---

## API Smoke Tests

### Backend health

```bash
curl http://localhost:3000/api/health
```

Expected response:

```json
{"message":"Backend is running","status":"ok"}
```

### Database health

```bash
curl http://localhost:3000/api/db-health
```

Expected response:

```json
{"message":"Database connection successful","status":"ok"}
```

---

## Development Notes

### Hot Reload

The project is configured for development using mounted Docker volumes.

That means:

* editing frontend files updates the UI automatically
* editing backend files restarts the backend automatically

In most cases, you do **not** need to rebuild the containers after normal source-code changes.

### Rebuild is needed when:

* `Dockerfile` changes
* `package.json` changes
* dependencies are added or removed
* environment/build configuration changes

Then run:

```bash
docker compose down
docker compose up --build
```

---

## Team Setup Notes

For local development, each teammate should:

1. Pull the latest code
2. Copy `.env.example` to `.env`
3. Run `docker compose up --build`
4. Run Prisma migration
5. Register their own account through the UI
6. Promote one account to ADMIN if admin testing is needed
7. Use two browser sessions for testing:

   * one ADMIN
   * one MEMBER

---

## Current Deployment Scope

This README currently documents **local development only**.

Server deployment steps, production environment variables, and cloud configuration will be documented later after the deployment environment is finalized.
