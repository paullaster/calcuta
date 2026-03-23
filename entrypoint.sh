#!/bin/sh

set -e


  
  # Load variables into the shell session
set -a
. ./.env.production
set +a


# 3. Run database migrations
echo "🚀 Running database migrations & database seeders..."
npm run db:setup


# 4. Start the application
echo "🏁 Starting application..."
npm run start:prod