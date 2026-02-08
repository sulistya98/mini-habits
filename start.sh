#!/bin/sh
set -e

# Run migrations
echo "Running database migrations..."
./node_modules/.bin/prisma migrate deploy

# Start the application
echo "Starting Next.js server..."
node server.js