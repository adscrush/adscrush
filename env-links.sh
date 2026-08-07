#!/usr/bin/env bash
# Create symlinks from root .env to each app
# Run after cloning or modifying root .env

set -e

REPO_ROOT="$(cd "$(dirname "$0")" && pwd)"

for app_dir in apps/*; do
  [ -d "$app_dir" ] || continue
  app_name=$(basename "$app_dir")
  target="$REPO_ROOT/$app_dir/.env"
  source="$REPO_ROOT/.env"

  if [ -f "$target" ] && [ ! -L "$target" ]; then
    echo "⚠️  $app_name has a real .env file — skipping (delete it to symlink)"
    continue
  fi

  ln -sf "$source" "$target"
  echo "✅ $app_name/.env → ../../.env"
done

echo ""
echo "Done. All apps now share the root .env"
