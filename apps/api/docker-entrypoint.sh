#!/bin/sh
set -e

cd /app
/app/node_modules/.bin/prisma migrate deploy
cd /app/apps/api
exec node dist/main.js
