#!/usr/bin/env bash
set -Eeuo pipefail

# iUnlockd production VPS deploy
#
# Usage:
#   bash deploy.sh
#
# Optional overrides:
#   WEB_ROOT=/var/www/html/iunlockd API_PORT=5000 bash deploy.sh
#   DEPLOY_API=0 bash deploy.sh
#
# Required on the VPS:
#   git, node, pnpm, and (for the default web/API flow) nginx and pm2
#   Production secrets exported in the VPS environment or already managed by PM2.

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_REMOTE="${DEPLOY_REMOTE:-origin}"
DEPLOY_BRANCH="${DEPLOY_BRANCH:-main}"

WEB_ROOT="${WEB_ROOT:-/var/www/html/iunlockd}"
WEB_DIST="$REPO_DIR/artifacts/sales-assistant/dist/public"
FRONTEND_BUILD_PORT="${FRONTEND_BUILD_PORT:-4173}"

DEPLOY_API="${DEPLOY_API:-1}"
API_PORT="${API_PORT:-5000}"
API_ENTRY="$REPO_DIR/artifacts/api-server/dist/index.mjs"
API_PM2_NAME="${API_PM2_NAME:-iunlockd-api}"

log() {
  printf '\n[%s] %s\n' "$(date '+%H:%M:%S')" "$*"
}

warn() {
  printf '\nWARNING: %s\n' "$*" >&2
}

die() {
  printf '\nERROR: %s\n' "$*" >&2
  exit 1
}

as_root() {
  if [ "$(id -u)" -eq 0 ]; then
    "$@"
  elif command -v sudo >/dev/null 2>&1; then
    sudo "$@"
  else
    die "This step needs root privileges. Run as root or install sudo."
  fi
}

require_command() {
  command -v "$1" >/dev/null 2>&1 || die "Required command not found: $1"
}

validate_configuration() {
  [[ "$API_PORT" =~ ^[0-9]+$ ]] || die "API_PORT must be a number"
  [[ "$FRONTEND_BUILD_PORT" =~ ^[0-9]+$ ]] ||
    die "FRONTEND_BUILD_PORT must be a number"
  [ "$API_PORT" -gt 0 ] && [ "$API_PORT" -lt 65536 ] ||
    die "API_PORT is out of range"
  [ "$FRONTEND_BUILD_PORT" -gt 0 ] && [ "$FRONTEND_BUILD_PORT" -lt 65536 ] ||
    die "FRONTEND_BUILD_PORT is out of range"

  case "$WEB_ROOT" in
    ""|"/"|"$REPO_DIR"|"$REPO_DIR/"|"/var/www"|"/var/www/"|"/var/www/html"|"/var/www/html/")
      die "WEB_ROOT points to an unsafe or overly broad directory: $WEB_ROOT"
      ;;
  esac
}

clean_generated_files() {
  log "Cleaning generated workspace files"

  # These files are safe build/fetch artifacts. Do not use git clean here:
  # .env files and server-side local files must never be deleted automatically.
  rm -f "$REPO_DIR/FETCH_HEAD"
  find "$REPO_DIR" -type f -name '*.tsbuildinfo' -delete
}

sync_source() {
  clean_generated_files

  log "Fetching ${DEPLOY_REMOTE}/${DEPLOY_BRANCH}"
  git fetch "$DEPLOY_REMOTE" "$DEPLOY_BRANCH"

  local remote_ref="${DEPLOY_REMOTE}/${DEPLOY_BRANCH}"
  local current_ref
  current_ref="$(git rev-parse HEAD)"

  if [ -n "$(git status --porcelain)" ]; then
    local local_backup_ref="backup/vps-working-tree-before-deploy-$(date '+%Y%m%d-%H%M%S')-$$"
    log "Local changes found; preserving current commit as ${local_backup_ref}"
    git branch "$local_backup_ref" HEAD
    warn "Tracked local changes will be replaced by ${remote_ref}"
    git reset --hard
    git clean -fd \
      -e .env \
      -e '.env.*' \
      -e 'uploads/' \
      -e 'storage/' \
      -e 'backup.sql'
    [ -z "$(git status --porcelain)" ] ||
      die "Working tree is still dirty after safe cleanup; refusing to deploy."
  fi

  if [ "$current_ref" = "$(git rev-parse "$remote_ref")" ]; then
    log "Source is already at ${remote_ref}"
    return
  fi

  if git merge-base --is-ancestor HEAD "$remote_ref"; then
    log "Fast-forwarding to ${remote_ref}"
    git merge --ff-only "$remote_ref"
    return
  fi

  local backup_ref="backup/vps-before-deploy-$(date '+%Y%m%d-%H%M%S')"
  log "Local history diverged; preserving current HEAD as ${backup_ref}"
  git branch "$backup_ref" HEAD
  log "Synchronizing checkout to ${remote_ref}"
  git reset --hard "$remote_ref"
}

install_dependencies() {
  log "Installing locked dependencies"
  pnpm install --frozen-lockfile
}

build_frontend() {
  log "Building iUnlockd frontend"
  PORT="$FRONTEND_BUILD_PORT" BASE_PATH="/" NODE_ENV=production \
    pnpm --filter @workspace/sales-assistant run build
  [ -d "$WEB_DIST" ] || die "Frontend build output not found: $WEB_DIST"
}

build_api() {
  [ "$DEPLOY_API" = "1" ] || {
    log "Skipping API build because DEPLOY_API=$DEPLOY_API"
    return
  }

  log "Building iUnlockd API"
  NODE_ENV=production pnpm --filter @workspace/api-server run build
  [ -f "$API_ENTRY" ] || die "API build output not found: $API_ENTRY"
}

publish_frontend() {
  log "Publishing frontend to $WEB_ROOT"

  local web_parent web_name next_root previous_root
  web_parent="$(dirname "$WEB_ROOT")"
  web_name="$(basename "$WEB_ROOT")"
  next_root="$web_parent/.${web_name}.next"
  previous_root="$web_parent/.${web_name}.previous"

  as_root mkdir -p "$web_parent"
  as_root rm -rf "$next_root" "$previous_root"
  as_root cp -a "$WEB_DIST" "$next_root"

  if [ -e "$WEB_ROOT" ]; then
    as_root mv "$WEB_ROOT" "$previous_root"
  fi
  as_root mv "$next_root" "$WEB_ROOT"
  as_root rm -rf "$previous_root"
}

reload_nginx() {
  if ! command -v nginx >/dev/null 2>&1; then
    warn "Nginx is not installed; frontend files were copied but not served by this script."
    return
  fi

  log "Validating Nginx configuration"
  as_root nginx -t

  if command -v systemctl >/dev/null 2>&1 &&
    systemctl is-active --quiet nginx; then
    log "Reloading Nginx"
    as_root systemctl reload nginx
  else
    warn "Nginx is installed but not active; start it with: sudo systemctl enable --now nginx"
  fi
}

restart_api() {
  [ "$DEPLOY_API" = "1" ] || return
  require_command pm2

  log "Starting or restarting API with PM2"
  if pm2 describe "$API_PM2_NAME" >/dev/null 2>&1; then
    PORT="$API_PORT" NODE_ENV=production pm2 restart "$API_PM2_NAME" --update-env
  else
    PORT="$API_PORT" NODE_ENV=production pm2 start "$API_ENTRY" \
      --name "$API_PM2_NAME" \
      --cwd "$REPO_DIR" \
      --update-env
  fi
  pm2 save

  if command -v curl >/dev/null 2>&1; then
    log "Checking API health"
    local health_url="http://127.0.0.1:${API_PORT}/api/healthz"
    for _ in 1 2 3 4 5; do
      if curl --fail --silent --show-error "$health_url" >/dev/null; then
        return
      fi
      sleep 1
    done
    die "API health check failed: $health_url"
  else
    warn "curl is not installed; API health check was skipped."
  fi
}

main() {
  cd "$REPO_DIR"
  validate_configuration
  require_command git
  require_command node
  require_command pnpm

  sync_source
  install_dependencies
  build_frontend
  build_api
  publish_frontend
  reload_nginx
  restart_api

  log "iUnlockd deploy completed successfully"
  printf 'Frontend: %s\n' "$WEB_ROOT"
  if [ "$DEPLOY_API" = "1" ]; then
    printf 'API:      PM2 process %s on port %s\n' "$API_PM2_NAME" "$API_PORT"
  fi
}

main "$@"