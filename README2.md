# Final Report: Collaborative Task Management Platform

## 1. Team Information

| Name | Student Number | Preferred Email | Main Responsibility |
|------|----------------|-----------------|---------------------|
| Qingyun Jia | TODO | qjia2@ualberta.ca | Backend, database schema, authentication, task/comment APIs, RBAC |
| Jiaming Liu | TODO | jiaming.liu@mail.utoronto.ca | Frontend UI, user interaction flow, CI workflow, backup script, report support |
| Zilin Qiu | TODO | zilin.qiu@mail.utoronto.ca | Frontend integration, WebSocket collaboration features, Docker/Swarm deployment, monitoring |

## 2. Motivation

Many small or educational teams need a lightweight collaboration platform for organizing tasks, assigning responsibilities, and tracking progress in real time. Commercial task management systems often have three drawbacks for this context: increasing subscription cost, limited control over deployment and data ownership, and low flexibility for experimenting with cloud-native architecture.

This project was chosen to address those limitations by building a self-hostable collaborative Kanban platform that combines real-time task synchronization, role-aware access control, persistent PostgreSQL storage, and containerized deployment. The project is also valuable as a practical cloud computing exercise because it integrates application development, data persistence, orchestration, monitoring, and CI automation in a single system.

## 3. Objectives

The goal of this project was to implement a cloud-native collaborative task management application in which authenticated users can create, assign, update, and discuss tasks with persistent state and near real-time visibility across clients.

More specifically, our team aimed to:

- Provide secure authentication and role-based authorization for `ADMIN` and `MEMBER` users.
- Support Kanban-style task tracking with assignment, status updates, and discussion threads.
- Synchronize task and comment updates across connected clients using WebSocket events.
- Store user, task, assignment, and comment data in PostgreSQL with volume-backed persistence.
- Containerize frontend, backend, and database services for reproducible local development.
- Use Docker Swarm for stack deployment, service restart policy, and frontend replication.
- Expose monitoring metrics through Prometheus and visualize them in Grafana dashboards.
- Add a GitHub Actions workflow so that pushes and pull requests automatically trigger backend/frontend CI checks.
- Provide a database backup script to export PostgreSQL data.

## 4. Technical Stack

### Application Stack

- **Frontend:** React, Vite, Axios, Socket.IO Client
- **Backend:** Node.js, Express, Socket.IO, JWT, bcryptjs
- **Database:** PostgreSQL 16
- **ORM / Migration:** Prisma Client and Prisma Migrate

### Infrastructure and DevOps Stack

- **Containerization:** Docker
- **Local composition:** Docker Compose
- **Orchestration:** Docker Swarm using `docker-stack.yml`
- **Monitoring:** Prometheus, Grafana, `prom-client`
- **CI:** GitHub Actions workflow in `.github/workflows/ci.yml`
- **Backup:** shell script `backup.sh` using `pg_dump`

### Architecture Summary

The frontend runs as a Vite-based React application and communicates with the backend through REST APIs and Socket.IO. The backend serves authentication, task, user, and comment endpoints, emits real-time update events, and exposes `/metrics`, `/api/health`, and `/api/db-health`. PostgreSQL stores all persistent entities, and Docker volumes preserve database and monitoring data across container restarts. Prometheus scrapes backend metrics, while Grafana automatically loads the provided dashboard JSON through provisioning files under `monitoring/grafana`.

## 5. Features and Requirement Coverage

### 5.1 Authentication and Role-Based Access Control

Users can register and log in through the frontend. The backend issues JWT tokens and uses middleware to authenticate requests. Two roles are supported:

- `MEMBER`: can view assigned/related tasks, update task status when authorized, and participate in discussions.
- `ADMIN`: can create tasks, reassign users, delete tasks/comments, and lock or unlock task discussions.

This feature satisfies the advanced requirement for role-based access control and ensures that task management actions are restricted by user responsibility.

### 5.2 Kanban Task Management

The application provides a Kanban workflow with three task states: `TODO`, `IN_PROGRESS`, and `DONE`. Admin users can create tasks, edit title/description/assignees, and delete tasks. Members can update the status of tasks they are related to. Each task card includes a comment count badge and opens a task drawer with details and discussion tabs.

This feature fulfills the core objective of collaborative task tracking and demonstrates stateful CRUD operations backed by PostgreSQL.

### 5.3 Real-Time Collaboration

The backend initializes a Socket.IO server and emits events such as `task:created`, `task:updated`, `task:deleted`, `comment:created`, and `comment:deleted`. The frontend listens to these events so that users can see task board and discussion updates without manual refresh.

This implements the advanced real-time functionality requirement and improves collaboration usability for distributed teams.

### 5.4 Persistent Storage

PostgreSQL is mounted to a Docker volume (`pgdata`) in both Compose and Swarm configurations so that data survives container restarts. Prisma migrations define the schema for `User`, `Task`, `TaskAssignment`, and `Comment`.

This satisfies the state management requirement and ensures durable project data storage.

### 5.5 Containerization and Orchestration

The frontend and backend each include a Dockerfile, and `docker-compose.yml` defines a local development stack with backend, frontend, and database services. For orchestration, `docker-stack.yml` deploys a Swarm stack with overlay networking, restart policies, and two frontend replicas for basic replication/load-balancing demonstration.

This satisfies the containerization and orchestration requirements. One design decision was to keep backend replicas at 1 because Socket.IO multi-instance synchronization was not implemented with a shared adapter such as Redis. This avoids inconsistent broadcast behavior across backend replicas.

### 5.6 Monitoring

The backend uses `prom-client` to collect default process metrics and custom HTTP request count/duration metrics, then exposes them at `/metrics`. Prometheus scrapes the backend and Grafana is configured with:

- a provisioned Prometheus datasource
- a provisioned dashboard provider
- an auto-loaded dashboard JSON: `ECE1779MonitorDashboard.json`

This satisfies the monitoring requirement and allows the team to observe backend request rate and process metrics.

### 5.7 CI Pipeline

The GitHub Actions workflow runs on pushes to `main`/`master` and on pull requests. It contains two jobs:

- **backend job:** checkout, setup Node.js 20, `npm install`, `npm run prisma:generate`
- **frontend job:** checkout, setup Node.js 20, reinstall frontend dependencies, `npm run build`

This implements the CI portion of the proposed CI/CD advanced feature by automatically validating that backend dependency setup and frontend production build still pass after code changes.

### 5.8 Database Backup

The `backup.sh` script loads environment variables from `.env`, runs `pg_dump` inside the `collab_db` container, copies the dump file to the repository root, and removes incomplete output if the dump command fails. This provides a manual backup mechanism for PostgreSQL data. A future extension would be scheduled backup and upload to external object storage.

## 6. User Guide

### 6.1 Start the Application

```bash
git clone https://github.com/Z1linQ/cloud-platform.git
cd cloud-platform
cp .env.example .env
docker compose up --build
```

After the services start, open:

- Frontend: `http://localhost:5173`
- Backend health check: `http://localhost:3000/api/health`
- Database health check: `http://localhost:3000/api/db-health`

### 6.2 Register and Log In

1. Open `http://localhost:5173`.
2. Create a new account from the authentication page.
3. Log in with the registered email/password.

By default, newly registered users are `MEMBER` users.

### 6.3 Promote an ADMIN User

To test admin-only functionality, first register a user through the UI, then promote that user in PostgreSQL:

```bash
docker compose exec db psql -U collab_user -d collab_db -c "UPDATE \"User\" SET role='ADMIN' WHERE email='admin@example.com';"
```

After promotion, log out and log in again so the frontend receives the updated role.

### 6.4 Create, Assign, and Update Tasks

- As `ADMIN`, use the dashboard create-task panel to enter a title, optional description, and assignees.
- Move/update task status through the task controls.
- As `MEMBER`, update only tasks that are assigned to you or created by you, depending on backend authorization.
- Open a task card to inspect details in the task drawer.

### 6.5 Use Discussion Threads

- Open a task drawer and switch to the discussion tab.
- Post comments on unlocked discussions.
- As `ADMIN`, delete comments or lock/unlock a discussion when needed.
- Use the full-thread modal to inspect the complete discussion history.

### 6.6 Switch Theme

Use the UI theme toggle to switch between dark and light mode.

### 6.7 Monitoring Dashboard

To inspect monitoring in Swarm mode:

```bash
python3 deploy.py
```

Then open:

- Prometheus: `http://localhost:9090`
- Grafana: `http://localhost:3001`

Grafana login defaults to `admin` / `admin` unless overridden through environment variables. The dashboard should be provisioned automatically from `monitoring/grafana/dashboards/ECE1779MonitorDashboard.json`.

### 6.8 Backup Database

```bash
chmod +x backup.sh
./backup.sh
ls -lh backup_*.sql
```

## 7. Development Guide

### 7.1 Environment Configuration

Create a root `.env` file from the template and set:

```env
POSTGRES_DB=collab_db
POSTGRES_USER=collab_user
POSTGRES_PASSWORD=collab_pass
BACKEND_PORT=3000
FRONTEND_PORT=5173
JWT_SECRET=supersecret123
```

If database credentials are changed after the PostgreSQL volume already exists, the old database user password may remain in the existing volume. In that case, either update the database user password inside PostgreSQL or recreate the volume.

### 7.2 Database Migration

After the containers are running, apply Prisma migrations and regenerate Prisma Client:

```bash
docker compose exec backend npx prisma migrate deploy
docker compose exec backend npx prisma generate
```

To inspect whether application tables exist:

```bash
docker compose exec db psql -U collab_user -d collab_db -c '\dt'
```

### 7.3 Local Testing and Debugging

Useful commands:

```bash
docker compose ps
docker compose logs backend
docker compose logs frontend
docker compose logs db
curl http://localhost:3000/api/health
curl http://localhost:3000/api/db-health
```

We used these commands to verify that backend, frontend, and PostgreSQL were running, and to diagnose one database authentication issue caused by mismatch between `.env` and an older PostgreSQL volume state.

### 7.4 Swarm Deployment

The repository includes a helper script for Swarm deployment:

```bash
python3 deploy.py
docker stack services collab
docker stack ps collab
```

`deploy.py` checks Docker daemon availability, initializes Swarm when needed, builds backend/frontend images, deploys `docker-stack.yml`, and lists services.

### 7.5 CI Workflow Verification

After pushing to GitHub, inspect the Actions tab to confirm both `backend` and `frontend` jobs pass. During development, the frontend job initially failed because Rollup's Linux optional package was missing in the GitHub runner environment. We updated the workflow to reinstall frontend dependencies cleanly before running `npm run build`.

## 8. Deployment Information

- **Live application URL:** TODO
- **Local frontend URL:** `http://localhost:5173`
- **Local backend health URL:** `http://localhost:3000/api/health`
- **Grafana URL in Swarm mode:** `http://localhost:3001`
- **Prometheus URL in Swarm mode:** `http://localhost:9090`

At the time of writing, the repository is fully runnable locally with Docker Compose, and Swarm stack deployment is available through `deploy.py`. If a public cloud VM or domain is finalized before submission, its URL should be inserted into the live URL field above.

## 9. AI Assistance and Verification Summary

AI tools were used as coding and documentation support, mainly for:

- organizing proposal/report structure in Markdown
- suggesting CI workflow structure and DevOps troubleshooting steps
- debugging Docker/PostgreSQL backup and Prisma authentication issues
- drafting concise explanations for architectural decisions and implementation tradeoffs

The team did not treat AI output as automatically correct. One representative AI limitation was that a backup script suggestion initially assumed the database name from `.env` matched the real PostgreSQL database inside the persistent volume. In practice, the old volume had been initialized with a different database name, causing `pg_dump` to fail and generating an empty SQL file. We verified this by querying PostgreSQL directly with `psql -l`, then fixed the environment/database mismatch and added shell error handling in `backup.sh`.

Correctness was verified through technical means including Docker container status checks, backend and database health endpoints, Prisma migration commands, PostgreSQL table inspection, application logs, manual UI testing, and CI results in GitHub Actions.

Detailed AI interaction examples should be documented in `ai-session.md` as requested by the course instructions.

## 10. Individual Contributions

### Qingyun Jia

- Implemented backend and database-related features including authentication, Prisma schema/migration work, task APIs, comment APIs, and authorization logic.
- Fixed deployment script behavior in `deploy.py` and contributed to Swarm/monitoring setup.
- Participated in backend testing and database troubleshooting.

Evidence in Git history includes commits by `Qingyun Jia`, such as backend/deployment related updates and the merged `Qingyun` branch.

### Jiaming Liu

- Contributed to frontend-facing workflow validation, CI workflow creation, backup script implementation, Git branch/merge operations, and documentation/report drafting.
- Diagnosed and fixed GitHub Actions frontend build failure caused by frontend dependency installation differences on Linux runners.
- Helped validate local runtime health by checking container states, backend health endpoints, database migration status, and PostgreSQL tables.

Evidence in Git history includes commits by `bjxx-liu`, such as `Add CI workflow, Grafana provisioning, and backup script` and `Fix frontend CI dependency install`.

### Zilin Qiu

- Implemented the frontend Kanban UI, task board interactions, WebSocket synchronization, comment thread features, theme support, and README updates.
- Contributed Docker/Swarm and monitoring-related integration and maintained the main repository history.
- Coordinated repository structure and user-facing feature documentation.

Evidence in Git history includes commits by `Z1linQ`, such as `Skeleton done`, `version0.2 websocket sync added`, `version 0.4 Update comments functionality`, and README updates.

## 11. Lessons Learned and Concluding Remarks

This project demonstrated that building a collaborative cloud application requires careful coordination across frontend state, backend authorization, database persistence, and deployment configuration. A key lesson was that containerized services can still fail due to environment drift, especially when old persistent volumes preserve previous database credentials or schema assumptions. Another lesson was that real-time communication becomes more complicated under horizontal backend scaling; without a shared Socket.IO adapter, increasing backend replicas may lead to inconsistent event delivery.

We also learned that CI failures may appear only in Linux-based GitHub runners even when local macOS development succeeds, especially when dependency resolution includes optional native packages. Monitoring integration was useful not only as a course requirement but also as a practical way to inspect backend request behavior.

Overall, the project achieved a functional self-hosted collaborative task management platform with authentication, RBAC, real-time synchronization, persistent PostgreSQL storage, Docker-based deployment, Swarm orchestration support, Prometheus/Grafana monitoring, CI validation, and manual database backup. Future improvements include a public cloud production deployment URL, scheduled offsite backups, automated admin management in the UI, backend multi-replica Socket.IO support through Redis, and a more complete automated test suite.
