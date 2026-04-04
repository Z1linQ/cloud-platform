# Final Report: Collaborative Task Management Platform

## 1. Team Information

| Name | Student Number | Preferred Email | Main Responsibility |
|------|----------------|-----------------|---------------------|
| Qingyun Jia | 1008308172 | qingyun.jia@mail.utoronto.ca | Docker/Swarm deployment, monitoring , authentication, task/comment APIs, RBAC |
| Jiaming Liu | 1006736383 | jiaming.liu@mail.utoronto.ca | Frontend workflow validation, CI workflow, backup script, documentation and report preparation |
| Zilin Qiu | 1012339391 | zilin.qiu@mail.utoronto.ca | Frontend feature development, WebSocket integration, Backend implementation, database schema design |

## 2. Motivation

Many small teams and academic project groups need a lightweight collaboration platform for organizing tasks, assigning responsibilities, and tracking progress in real time. However, commercial task management systems often introduce recurring subscription costs, limited control over data ownership and deployment, and restricted flexibility for experimenting with cloud-native architectures.

This project was therefore selected to address these limitations by developing a self-hostable collaborative Kanban platform that integrates real-time task synchronization, role-based access control, persistent PostgreSQL storage, and containerized deployment. From a course perspective, the project is also meaningful because it combines application development, stateful storage, service orchestration, monitoring, and CI automation within one end-to-end cloud system.

## 3. Objectives

The objective of this project was to implement a cloud-native collaborative task management application in which authenticated users can create, assign, update, and discuss tasks while preserving application state and receiving near real-time updates across clients.

Specifically, our team aimed to:

- Provide secure authentication and role-based authorization for `ADMIN` and `MEMBER` users.
- Support Kanban-style task tracking with assignment, status updates, and discussion threads.
- Synchronize task and comment updates across connected clients using WebSocket events.
- Store user, task, assignment, and comment data in PostgreSQL with volume-backed persistence.
- Containerize frontend, backend, and database services for reproducible local development.
- Use Docker Swarm for stack deployment, service restart policy, and frontend replication.
- Expose monitoring metrics through Prometheus and visualize them in Grafana dashboards.
- Add a GitHub Actions workflow so that pushes and pull requests automatically trigger backend/frontend CI checks.
- Provide a database backup script for exporting PostgreSQL data.

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

The frontend is implemented as a Vite-based React application and communicates with the backend through REST APIs and Socket.IO. The backend provides authentication, task, user, and comment endpoints, emits real-time update events, and exposes `/metrics`, `/api/health`, and `/api/db-health`. PostgreSQL stores all persistent entities, while Docker volumes preserve database and monitoring data across container restarts. Prometheus scrapes backend metrics, and Grafana automatically provisions both its Prometheus datasource and dashboard configuration from files under `monitoring/grafana`.

## 5. Features and Requirement Coverage

### 5.1 Authentication and Role-Based Access Control

Users can register and log in through the frontend. The backend issues JWT tokens and applies authentication middleware to protect API requests. Two roles are supported:

- `MEMBER`: can view assigned/related tasks, update task status when authorized, and participate in discussions.
- `ADMIN`: can create tasks, reassign users, delete tasks/comments, and lock or unlock task discussions.

This feature satisfies the advanced role-based access control requirement and ensures that task management operations are restricted according to user responsibility.

### 5.2 Kanban Task Management

The application provides a Kanban workflow with three task states: `TODO`, `IN_PROGRESS`, and `DONE`. Admin users can create tasks, edit task metadata and assignees, and delete tasks. Members can update the status of tasks with which they are associated. Each task card displays a comment count badge and opens a task drawer containing task details and discussion tabs.

This feature fulfills the core objective of collaborative task tracking and demonstrates stateful CRUD operations backed by PostgreSQL.

### 5.3 Real-Time Collaboration

The backend initializes a Socket.IO server and emits events including `task:created`, `task:updated`, `task:deleted`, `comment:created`, and `comment:deleted`. The frontend subscribes to these events so that task board and discussion updates are reflected without requiring manual page refresh.

This implements the advanced real-time functionality requirement and improves collaboration usability for distributed teams.

### 5.4 Persistent Storage

PostgreSQL is mounted to a Docker volume (`pgdata`) in both Compose and Swarm configurations so that data survives container restarts. Prisma migrations define the schema for `User`, `Task`, `TaskAssignment`, and `Comment`.

This satisfies the state management requirement and ensures durable project data storage.

### 5.5 Containerization and Orchestration

The frontend and backend each include a Dockerfile, and `docker-compose.yml` defines the local development stack for frontend, backend, and database services. For orchestration, `docker-stack.yml` deploys a Docker Swarm stack with an overlay network, service restart policies, and two frontend replicas to demonstrate basic replication and load balancing.

This satisfies the containerization and orchestration requirements. One intentional design decision was to keep the backend replica count at 1 because Socket.IO multi-instance synchronization was not implemented with a shared adapter such as Redis. This avoids inconsistent broadcast behavior across multiple backend replicas.

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

This implements the CI portion of the proposed CI/CD advanced feature by automatically validating backend dependency setup and frontend production build correctness after code changes.

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

By default, newly registered accounts are assigned the `MEMBER` role.

### 6.3 Promote an ADMIN User

To test admin-only functionality, first register a user through the UI, then promote that user in PostgreSQL:

```bash
docker compose exec db psql -U collab_user -d collab_db -c "UPDATE \"User\" SET role='ADMIN' WHERE email='admin@example.com';"
```

After this update, log out and log in again so that the frontend receives the refreshed role information.

### 6.4 Create, Assign, and Update Tasks

- As `ADMIN`, use the create-task panel to enter a title, an optional description, and assignees.
- Move/update task status through the task controls.
- As `MEMBER`, update only tasks that are assigned to you or created by you, depending on backend authorization.
- Open a task card to inspect details in the task drawer.

### 6.5 Use Discussion Threads

- Open a task drawer and switch to the discussion tab.
- Post comments on unlocked discussions.
- As `ADMIN`, delete comments or lock/unlock a discussion when needed.
- Use the full-thread modal to inspect the complete discussion history.

### 6.6 Switch Theme

Use the theme toggle in the UI to switch between dark and light modes.

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

If database credentials are changed after the PostgreSQL volume has already been initialized, the previous database user password may still remain in the existing volume. In that case, either update the user password directly inside PostgreSQL or recreate the database volume.

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

These commands were used to verify that the backend, frontend, and PostgreSQL services were running correctly, and to diagnose a database authentication failure caused by a mismatch between `.env` and the state stored in an older PostgreSQL volume.

### 7.4 Swarm Deployment

The repository includes a helper script for Swarm deployment:

```bash
python3 deploy.py
docker stack services collab
docker stack ps collab
```

`deploy.py` checks Docker daemon availability, initializes Swarm when needed, builds backend and frontend images, deploys `docker-stack.yml`, and lists stack services.

### 7.5 CI Workflow Verification

After pushing to GitHub, inspect the Actions tab to confirm both `backend` and `frontend` jobs pass. During development, the frontend job initially failed because Rollup's Linux optional package was missing in the GitHub runner environment. We updated the workflow to reinstall frontend dependencies cleanly before running `npm run build`.

## 8. Deployment Information

- **Live application URL:** TODO
- **Local frontend URL:** `http://localhost:5173`
- **Local backend health URL:** `http://localhost:3000/api/health`
- **Grafana URL in Swarm mode:** `http://localhost:3001`
- **Prometheus URL in Swarm mode:** `http://localhost:9090`

At the time of writing, the repository is fully runnable in a local environment with Docker Compose, and Swarm stack deployment is available through `deploy.py`. If a public cloud VM or domain is finalized before submission, the corresponding endpoint should be inserted into the live URL field above.

## 9. AI Assistance and Verification Summary

AI tools were used as implementation and documentation support, primarily for:

- organizing proposal/report structure in Markdown
- suggesting CI workflow structure and DevOps troubleshooting steps
- debugging Docker/PostgreSQL backup and Prisma authentication issues
- drafting concise explanations for architectural decisions and implementation tradeoffs

The team did not treat AI-generated output as automatically correct. One representative limitation was that an initial backup-script suggestion implicitly assumed that the database name defined in `.env` matched the actual PostgreSQL database stored in the persistent volume. In practice, the existing volume had been initialized with a different database name, which caused `pg_dump` to fail and produced an empty SQL file. This issue was verified by querying PostgreSQL directly with `psql -l`, after which the environment/database mismatch was corrected and explicit shell error handling was added to `backup.sh`.

Correctness was verified through Docker container status inspection, backend/database health endpoints, Prisma migration commands, PostgreSQL table inspection, application logs, manual UI testing, and CI results from GitHub Actions.

Detailed AI interaction examples are intended to be documented separately in `ai-session.md`, as required by the course instructions.

## 10. Individual Contributions

### Qingyun Jia

- Implemented Docker/Swarm and monitoring-related integration, theme support, README updates and maintained the main repository history.
- Fixed deployment script behavior in `deploy.py` and contributed to Swarm/monitoring setup.
- Participated in backend testing and database troubleshooting.

Evidence in the Git history includes commits authored by `Qingyun Jia`, including backend/deployment updates and changes merged from the `Qingyun` branch.

### Jiaming Liu

- Contributed to frontend workflow validation, CI workflow creation, backup script implementation, Git branch/merge operations, and documentation/report drafting.
- Diagnosed and fixed GitHub Actions frontend build failure caused by frontend dependency installation differences on Linux runners.
- Helped validate local runtime health by checking container states, backend health endpoints, database migration status, and PostgreSQL tables.

Evidence in the Git history includes commits authored by `bjxx-liu`, such as `Add CI workflow, Grafana provisioning, and backup script` and `Fix frontend CI dependency install`.

### Zilin Qiu

- Implemented the frontend Kanban UI, task board interactions, WebSocket synchronization, comment thread features, theme support, and README updates.
- Implemented backend and database-related functionality, including authentication, Prisma schema/migration work, task APIs, comment APIs, and authorization logic.
- Coordinated repository structure and user-facing feature documentation.

Evidence in the Git history includes commits authored by `Z1linQ`, such as `Skeleton done`, `version0.2 websocket sync added`, `version 0.4 Update comments functionality`, and README updates.

## 11. Lessons Learned and Concluding Remarks

This project demonstrated that building a collaborative cloud application requires careful coordination across frontend state management, backend authorization, database persistence, and deployment configuration. A key lesson was that containerized services can still fail because of environment drift, especially when persistent volumes retain earlier database credentials or schema assumptions. Another important lesson was that real-time communication becomes more complex under horizontal backend scaling; without a shared Socket.IO adapter, increasing backend replicas may lead to inconsistent event delivery.

We also learned that CI failures may appear only in Linux-based GitHub runners even when local macOS development succeeds, especially when dependency resolution includes optional native packages. Monitoring integration was useful not only as a course requirement but also as a practical way to inspect backend request behavior.

Overall, the project delivered a functional self-hosted collaborative task management platform with authentication, RBAC, real-time synchronization, persistent PostgreSQL storage, Docker-based deployment, Swarm orchestration support, Prometheus/Grafana monitoring, CI validation, and manual database backup. Future improvements include public cloud production deployment, scheduled offsite backups, UI-based admin management, backend multi-replica Socket.IO support through Redis, and a more comprehensive automated test suite.
