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

## Docker Swarm Deployment

This repository includes a Swarm stack file for orchestration demo and service management.

### Files

* `docker-stack.yml` for Swarm stack services
* `deploy.py` for one-command deploy on Windows PowerShell

### Quick Deploy (PowerShell)

From project root:

python deploy.py

The script will:

1. Initialize Swarm if not active
2. Build backend and frontend images
3. Deploy stack `collab`
4. Print running Swarm services

### Manual Deploy Commands

```bash
docker swarm init
docker build -t collab_backend:swarm ./backend
docker build -t collab_frontend:swarm ./frontend
docker stack deploy -c docker-stack.yml collab
docker stack services collab
```

### Scale Services (demo for orchestration)

```bash
docker service scale collab_frontend=2
docker service scale collab_backend=2
docker stack services collab
```

### Inspect Service Tasks

```bash
docker stack ps collab
```

### Remove Stack

```bash
docker stack rm collab
```

### Initial Demo Data Setup for Swarm (recommended before presentation)

For consistent presentation demo experience, set up demo accounts and tasks after deploying the stack.

After `docker stack deploy -c docker-stack.yml collab` is complete and all services are running:

1. Open browser and navigate to `http://localhost:5173`

2. Register an ADMIN account:
   ```
   Email: admin@example.com
   Password: Password123!
   ```

3. Register a MEMBER account in a different browser/incognito:
   ```
   Email: member@example.com
   Password: Password123!
   ```

4. Promote admin account to ADMIN role:
   ```bash
   docker exec -it $(docker ps -q -f name=collab_db) psql -U collab_user -d collab_db -c "UPDATE \"User\" SET role='ADMIN' WHERE email='admin@example.com';"
   ```

5. Create demo tasks by logging in as admin and using the UI to create 2-3 sample tasks assigned to the member.

**Note:** This ensures both `docker compose` and `docker stack` deployments have identical initial data for presentation, avoiding confusion about demo readiness.

### Stateful Design Note

PostgreSQL data is stored in a named volume `pgdata`.
This ensures application data survives container restarts and service redeployments.

---

## Monitoring and Observability

Prometheus and Grafana are included in the Swarm stack for metrics collection and visualization.

### Monitoring Services

* Prometheus: `http://localhost:9090`
* Grafana: `http://localhost:3001`

Default Grafana credentials (can be overridden in `.env`):

* username: `admin`
* password: `admin`

### What is monitored

* Backend request counter: `http_requests_total`
* Backend CPU Usage
* Backend Memory Usage

### Quick verification commands

```bash
docker stack services collab
curl http://localhost:3000/metrics
curl http://localhost:9090/-/healthy
```

### Demo flow for presentation

1. Open Grafana using http://localhost:3001
2. Import ECE1779MonitorDashboard.json
3. Go to the dashboard and check the visualized monitoring

---

## Current Deployment Scope

This README documents both:

* local development via Docker Compose
* local orchestration demo via Docker Swarm

Server deployment steps, production environment variables, and cloud configuration will be documented later after the deployment environment is finalized.
