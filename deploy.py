import subprocess
import sys


def run_command(command, error_message):
    print(f"==> Running: {command}")
    result = subprocess.run(command, shell=True)
    if result.returncode != 0:
        print(f"ERROR: {error_message}")
        sys.exit(1)


# 1. Check Docker daemon
print("==> Checking Docker daemon...")
run_command("docker info > nul 2>&1", "Docker daemon is not reachable. Start Docker Desktop first.")


# 2. Check Swarm status
print("==> Checking Docker Swarm status...")
result = subprocess.run(
    "docker info --format '{{.Swarm.LocalNodeState}}'",
    shell=True,
    capture_output=True,
    text=True
)

if result.returncode != 0:
    print("ERROR: Unable to read Swarm state.")
    sys.exit(1)

swarm_state = result.stdout.strip()

if swarm_state != "active":
    print("==> Initializing Docker Swarm...")
    run_command("docker swarm init", "Failed to initialize Docker Swarm.")
else:
    print("==> Docker Swarm already active.")


# 3. Build backend
print("==> Building backend image...")
run_command("docker build -t collab_backend:swarm ./backend", "Failed to build backend image.")


# 4. Build frontend
print("==> Building frontend image...")
run_command("docker build -t collab_frontend:swarm ./frontend", "Failed to build frontend image.")


# 5. Deploy stack
print("==> Deploying stack...")
run_command("docker stack deploy -c docker-stack.yml collab", "Failed to deploy stack.")


# 6. Show services
print("==> Stack services:")
run_command("docker stack services collab", "Failed to list services.")


print("==> Done! Use 'docker stack ps collab' to inspect tasks.")