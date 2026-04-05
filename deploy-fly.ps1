# Automated Fly.io Deployment Script for Windows PowerShell
# Usage: .\deploy-fly.ps1
#        .\deploy-fly.ps1 -DatabaseURL "postgres://..." -JwtSecret "your-secret"

param(
    [string]$DatabaseURL = "",
    [string]$JwtSecret = "",
    [string]$ClientURL = "https://collab-frontend-ece1779.fly.dev"
)

function Write-Status {
    param([string]$message)
    Write-Host "==> $message" -ForegroundColor Green
}

function Write-Error-Custom {
    param([string]$message)
    Write-Host "ERROR: $message" -ForegroundColor Red
    exit 1
}

# Check if flyctl is installed
if (-not (Get-Command flyctl -ErrorAction SilentlyContinue)) {
    Write-Error-Custom "flyctl is not installed. Please install it from https://fly.io/docs/getting-started/installing-flyctl/"
}

Write-Status "Checking Fly.io authentication..."
flyctl auth whoami 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Error-Custom "Not logged in to Fly.io. Run 'flyctl auth login' first."
}

Write-Status "Starting deployment to Fly.io..."

# Deploy Backend
Write-Status "Deploying Backend..."
flyctl deploy -f fly-backend.toml
if ($LASTEXITCODE -ne 0) {
    Write-Error-Custom "Failed to deploy backend."
}

# Set backend environment variables
Write-Status "Configuring backend environment variables..."

if (-not $DatabaseURL) {
    Write-Host "Enter PostgreSQL connection string (DATABASE_URL):" -ForegroundColor Yellow
    $DatabaseURL = Read-Host
}

if (-not $JwtSecret) {
    Write-Host "Enter JWT secret (min 32 characters):" -ForegroundColor Yellow
    $JwtSecret = Read-Host -AsSecureString
    $JwtSecret = [System.Net.NetworkCredential]::new('', $JwtSecret).Password
}

flyctl -a collab-backend-ece1779 config set `
  DATABASE_URL="$DatabaseURL" `
  JWT_SECRET="$JwtSecret" `
  CLIENT_URL="$ClientURL"

if ($LASTEXITCODE -ne 0) {
    Write-Error-Custom "Failed to set backend environment variables."
}

# Deploy Frontend
Write-Status "Deploying Frontend..."
flyctl deploy -f fly-frontend.toml
if ($LASTEXITCODE -ne 0) {
    Write-Error-Custom "Failed to deploy frontend."
}

Write-Status "Running database migrations..."
Write-Host "Connecting to backend via SSH..." -ForegroundColor Cyan
flyctl -a collab-backend-ece1779 ssh console <<'EOF'
npx prisma migrate deploy
exit
EOF

Write-Status "Deployment completed successfully!"
Write-Host ""
Write-Host "Your apps are now deployed on Fly.io:" -ForegroundColor Cyan
Write-Host "Backend:  https://collab-backend-ece1779.fly.dev" -ForegroundColor Yellow
Write-Host "Frontend: https://collab-frontend-ece1779.fly.dev" -ForegroundColor Yellow
Write-Host ""
Write-Host "View logs:" -ForegroundColor Cyan
Write-Host "  flyctl -a collab-backend-ece1779 logs" -ForegroundColor Gray
Write-Host "  flyctl -a collab-frontend-ece1779 logs" -ForegroundColor Gray
