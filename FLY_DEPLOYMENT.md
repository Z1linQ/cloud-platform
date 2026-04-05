# Fly.io Deployment Guide

## Prerequisites

1. Install Fly CLI: https://fly.io/docs/getting-started/installing-flyctl/
2. Login to Fly.io:
   ```
   flyctl auth login
   ```
3. Have your PostgreSQL connection string ready, or plan to create a Fly-managed PostgreSQL database

## Step-by-Step Deployment

### Step 1: Create PostgreSQL on Fly.io (required)

If your database is on Fly.io, that is the recommended path here. It is not a third-party external database; it is a Fly-managed database that your backend will connect to with the URL Fly provides.

```powershell
# Create a PostgreSQL app
flyctl postgres create --org personal

# Note the connection string it provides
# Format: postgres://user:password@app-name.internal:5432/dbname
```

### Step 2: Create Fly apps for backend and frontend (required)

Before deploying, create the two Fly apps that match the names in `backend/fly.toml` and `frontend/fly.toml`.

```powershell
flyctl apps create collab-backend-ece1779
flyctl apps create collab-frontend-ece1779
```

### Step 3: Attach Fly Postgres to backend (required)

Attach the Fly-managed PostgreSQL app to the backend app. This sets `DATABASE_URL` for you, so you do not need to set it manually.

```powershell
# Replace <your-postgres-app-name> with the app name created by flyctl postgres create
flyctl postgres attach <your-postgres-app-name> --app collab-backend-ece1779
flyctl postgres attach ece1779project --app collab-backend-ece1779
# After attach, Fly will create the DATABASE_URL secret automatically.
# You only need to set JWT_SECRET manually if it is not already defined.
flyctl -a collab-backend-ece1779 secrets set JWT_SECRET="your-super-secret-key-min-32-chars"
flyctl -a collab-backend-ece1779 secrets set JWT_SECRET="IloveECE1779andCloudPlatform_A9k3M7p2"
```

### Step 4: Deploy Backend

```powershell
# Navigate to backend directory so Docker build context matches backend files
cd "c:\Users\Qingyun\Desktop\UOA2024\ECE1779\Project\cloud-platform\backend"

# Deploy backend using the local fly.toml
flyctl deploy

# CLIENT_URL is already set in backend/fly.toml.
# Run database migrations after the backend machine is up.
flyctl -a collab-backend-ece1779 ssh console
# Inside console:
# npx prisma migrate deploy
# exit
```

### Step 5: Deploy Frontend

```powershell
# Navigate to frontend directory so Docker build context matches frontend files
cd "c:\Users\Qingyun\Desktop\UOA2024\ECE1779\Project\cloud-platform\frontend"

# Deploy frontend using the local fly.toml
flyctl deploy

# The API URL in fly-frontend.toml is preconfigured to point to backend
# VITE_API_URL = "https://collab-backend-ece1779.fly.dev"
```

### Step 6: Verify Deployment

```powershell
# Check status
flyctl -a collab-backend-ece1779 status
flyctl -a collab-frontend-ece1779 status

# View logs
flyctl -a collab-backend-ece1779 logs
flyctl -a collab-frontend-ece1779 logs

# Test health endpoints
# Backend health: https://collab-backend-ece1779.fly.dev/api/health
# Frontend: https://collab-frontend-ece1779.fly.dev
```

## Key Changes from Local Swarm Deployment

### What Changed:
1. **docker-stack.yml** → **fly-backend.toml** + **fly-frontend.toml**
2. **Docker Swarm** → **Fly.io managed containers**
3. **Local PostgreSQL** → **Fly Postgres or managed external DB**
4. **Port mapping** → **Automatic via Fly.io services**

### Environment Variables to Set:
| Variable | Backend | Frontend | Example |
|----------|---------|----------|---------|
| DATABASE_URL | ✓ | ✗ | postgres://user:pass@host/db |
| JWT_SECRET | ✓ | ✗ | min-32-random-chars |
| CLIENT_URL | ✓ | ✗ | https://collab-frontend-ece1779.fly.dev |
| VITE_API_URL | ✗ | ✓ | https://collab-backend-ece1779.fly.dev |
| VITE_SOCKET_URL | ✗ | ✓ | https://collab-backend-ece1779.fly.dev |
| PORT | ✓ | ✓ | 3000 (backend), 5173 (frontend) |

### Functionality Preserved:
- ✓ Authentication (JWT, bcrypt)
- ✓ Task management (CRUD)
- ✓ Comments system
- ✓ Real-time updates (Socket.io)
- ✓ Monitoring (Prometheus metrics)
- ✓ Database persistence (Prisma ORM)
- ✓ CORS handling
- ✓ Dark/Light theme

## Troubleshooting

### Backend won't start
```powershell
flyctl -a collab-backend-ece1779 logs --lines 100
# Check for DATABASE_URL, JWT_SECRET missing
# Check Prisma migrations status
```

### Frontend can't connect to backend
```powershell
# Verify VITE_API_URL and VITE_SOCKET_URL point to correct backend
cd "c:\Users\Qingyun\Desktop\UOA2024\ECE1779\Project\cloud-platform\frontend"
flyctl deploy --no-cache
```

### Database connection failed
```powershell
# Test connection from backend
flyctl -a collab-backend-ece1779 ssh console
# curl http://localhost:3000/api/db-health
```

## Scaling

Scale your apps:
```powershell
# Scale backend to 2 instances
flyctl -a collab-backend-ece1779 scale count 2

# Scale frontend to 3 instances
flyctl -a collab-frontend-ece1779 scale count 3
```

## Cleanup

Remove deployed apps:
```powershell
flyctl apps destroy collab-backend-ece1779
flyctl apps destroy collab-frontend-ece1779
```

## Additional Resources

- Fly.io Docs: https://fly.io/docs/
- Node.js on Fly: https://fly.io/docs/languages-and-frameworks/nodejs/
- PostgreSQL: https://fly.io/docs/postgres/
- Pricing: https://fly.io/docs/about/pricing/
