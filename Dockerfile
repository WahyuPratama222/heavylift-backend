# ---- Build stage ----
FROM node:20-alpine AS builder

# Set working directory inside the container
WORKDIR /app

# Install OpenSSL and libc6-compat for Prisma compatibility
RUN apk update && apk add --no-cache openssl libc6-compat

# 1. Copy dependency files first to maximize cache layer
COPY package*.json ./
RUN npm ci

# 2. Copy Prisma schema and generate client before copying the rest of the source code
# (Ensures the Prisma client generates without re-running if only minor code changes occur)
COPY prisma ./prisma
RUN npx prisma generate

# 3. Copy the rest of the source code and build
COPY . .
RUN npm run build

# ---- Production stage ----
FROM node:20-alpine AS production

# Set working directory inside the container
WORKDIR /app

# Install OpenSSL and libc6-compat for Prisma compatibility
RUN apk update && apk add --no-cache openssl libc6-compat

ENV NODE_ENV=production
ENV PORT=3000

# Copy package configuration files
COPY package*.json ./

# Copy node_modules, dist, and prisma from the builder stage
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

# Remove devDependencies to minimize the final image size
RUN npm prune --production

# Security: Run as the non-root user built into the node image
USER node

EXPOSE 3000
CMD ["node", "dist/main"]