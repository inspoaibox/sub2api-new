#!/usr/bin/env bash
# =============================================================================
# Sub2API Docker update script
# =============================================================================
# Run this script from the existing deployment directory. It refreshes the
# Compose file, preserves the existing data and secrets, pulls the GitHub
# Container Registry image, and recreates only the application container.
# =============================================================================

set -Eeuo pipefail

GITHUB_RAW_URL="https://raw.githubusercontent.com/inspoaibox/sub2api-new/main/deploy"
DEFAULT_IMAGE="ghcr.io/inspoaibox/sub2api-new:latest"
IMAGE="$DEFAULT_IMAGE"

print_info() {
    printf '[INFO] %s\n' "$1"
}

print_success() {
    printf '[SUCCESS] %s\n' "$1"
}

print_warning() {
    printf '[WARNING] %s\n' "$1"
}

print_error() {
    printf '[ERROR] %s\n' "$1" >&2
}

usage() {
    cat <<'EOF'
Usage: docker-update.sh [--image IMAGE]

Update the Sub2API application in the current Docker Compose deployment.
The default image is ghcr.io/inspoaibox/sub2api-new:latest.
EOF
}

while [ "$#" -gt 0 ]; do
    case "$1" in
        --image)
            [ "$#" -ge 2 ] || { print_error "--image requires a value"; exit 2; }
            IMAGE="$2"
            shift 2
            ;;
        --image=*)
            IMAGE="${1#*=}"
            shift
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        *)
            print_error "Unknown argument: $1"
            usage
            exit 2
            ;;
    esac
done

command -v docker >/dev/null 2>&1 || { print_error "docker is not installed"; exit 1; }
docker compose version >/dev/null 2>&1 || { print_error "Docker Compose v2 is required"; exit 1; }

if [ -f "docker-compose.yml" ]; then
    COMPOSE_FILE="docker-compose.yml"
elif [ -f "docker-compose.local.yml" ]; then
    COMPOSE_FILE="docker-compose.local.yml"
else
    print_error "No docker-compose.yml or docker-compose.local.yml found in $(pwd)"
    print_info "Run this command from the existing deployment directory."
    exit 1
fi

[ -f ".env" ] || { print_error "No .env found; refusing to update an unknown deployment"; exit 1; }

if grep -Eq '[[:space:]]-[[:space:]]+\./data:/app/data' "$COMPOSE_FILE"; then
    REMOTE_COMPOSE_FILE="docker-compose.local.yml"
    STORAGE_MODE="local directories"
else
    REMOTE_COMPOSE_FILE="docker-compose.yml"
    STORAGE_MODE="Docker named volumes"
fi

compose() {
    docker compose -f "$COMPOSE_FILE" "$@"
}

STAMP="$(date -u +%Y%m%d-%H%M%S)"
BACKUP_DIR="backups/$STAMP"
mkdir -p "$BACKUP_DIR"

print_info "Backing up deployment configuration to $BACKUP_DIR"
cp -a .env "$BACKUP_DIR/.env"
cp -a "$COMPOSE_FILE" "$BACKUP_DIR/$COMPOSE_FILE"

if compose ps --status running --services 2>/dev/null | grep -qx 'postgres'; then
    compose exec -T postgres sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB"' \
        > "$BACKUP_DIR/sub2api.sql"
    print_success "PostgreSQL backup created"
else
    print_warning "PostgreSQL is not running; SQL backup was not created"
fi

TEMP_COMPOSE="$(mktemp "${COMPOSE_FILE}.update.XXXXXX")"
cleanup() {
    rm -f "$TEMP_COMPOSE"
}
trap cleanup EXIT

print_info "Downloading the latest Compose configuration ($STORAGE_MODE)"
curl -fsSL "$GITHUB_RAW_URL/$REMOTE_COMPOSE_FILE" -o "$TEMP_COMPOSE"
mv "$TEMP_COMPOSE" "$COMPOSE_FILE"
print_success "Compose configuration updated"

if grep -q '^SUB2API_IMAGE=' .env; then
    sed -i "s#^SUB2API_IMAGE=.*#SUB2API_IMAGE=$IMAGE#" .env
else
    printf '\nSUB2API_IMAGE=%s\n' "$IMAGE" >> .env
fi
chmod 600 .env
export SUB2API_IMAGE="$IMAGE"

print_info "Resolved images"
compose config --images

print_info "Pulling $IMAGE"
compose pull sub2api
compose up -d --force-recreate sub2api

HOST_PORT="$(compose port sub2api 8080 | tail -n 1 | sed 's/.*://')"
if [ -n "$HOST_PORT" ]; then
    print_info "Checking application health on port $HOST_PORT"
    curl -fsS "http://127.0.0.1:$HOST_PORT/health"
    printf '\n'
fi

print_success "Application container updated"
docker inspect sub2api --format 'image={{.Config.Image}}'
docker exec sub2api /app/sub2api -version || true
compose ps
