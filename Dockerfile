# Use dev variant for build stage

FROM node:24.14-alpine AS build-stage

ENV NODE_ENV=production

WORKDIR /app

# Copy packages.json and pnpm lock file
COPY package.json pnpm-lock.yaml ./

# Enable corepack and prepare pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Install dependencies and ensure node_modules exists
RUN pnpm install -P && mkdir -p node_modules

# Use runtime variant for final stage 
FROM node:24.14-alpine AS runtime-stage

ENV NODE_ENV=production

WORKDIR /app

# Copy node_modules from build-stage
COPY --from=build-stage /app/node_modules ./node_modules

# Copy application code
COPY . .

# Expose port
EXPOSE 3450

# Ensure entrypoint is executable
RUN chmod +x /app/entrypoint.sh

ENTRYPOINT [ "app/entrypoint.sh" ]