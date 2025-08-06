#!/bin/sh
# frontend/entrypoint.sh

set -e

echo "Waiting for backend to be ready..."
while ! nc -z backend 5000; do
  sleep 2
done
echo "Backend is ready!"

echo "Starting Vite development server..."
npm run dev -- --host 0.0.0.0