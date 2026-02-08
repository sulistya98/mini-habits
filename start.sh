#!/bin/sh
set -e

# Run migrations
echo "Running database migrations..."
node node_modules/prisma/build/index.js migrate deploy

# Start the application
echo "Starting Next.js server..."
node server.js