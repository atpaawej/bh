# ── Stage 1: Install + build ──
FROM node:20-alpine AS builder
WORKDIR /app

# Copy workspace manifest files for dependency caching
COPY package.json package-lock.json ./
COPY packages/backend/package.json packages/backend/package.json
COPY packages/shared/package.json packages/shared/package.json

# Install all dependencies (devDependencies included for build)
RUN npm ci

# Copy source files
COPY tsconfig.json ./
COPY packages/shared/ packages/shared/
COPY packages/backend/ packages/backend/

# Build shared library first, then backend
RUN npm run -w @bh/shared build && npm run -w @bh/backend build

# ── Stage 2: Production image ──
FROM node:20-alpine
WORKDIR /app

# Create package directories so npm ci can resolve workspaces
RUN mkdir -p packages/backend packages/shared

# Copy production dependency manifests
COPY package.json package-lock.json ./
COPY packages/backend/package.json packages/backend/package.json
COPY packages/shared/package.json packages/shared/package.json

# Install only production dependencies
RUN npm ci --omit=dev

# Copy built artifacts from builder stage
COPY --from=builder /app/packages/backend/dist packages/backend/dist
COPY --from=builder /app/packages/shared/dist packages/shared/dist

# Copy Prisma schema and generate client
COPY packages/backend/prisma/ packages/backend/prisma/
RUN npx prisma generate --schema=packages/backend/prisma/schema.prisma

EXPOSE 4000

CMD ["node", "packages/backend/dist/index.js"]
