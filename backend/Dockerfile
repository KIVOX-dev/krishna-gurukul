# Build stage
FROM node:22-alpine AS builder
WORKDIR /app

# Copy package files
COPY backend/package*.json ./
COPY package-lock.json ./
COPY backend/tsconfig.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY backend/src ./src

# Runtime stage
FROM node:22-alpine AS runtime
WORKDIR /app

# Copy package files
COPY backend/package*.json ./
COPY package-lock.json ./

# Install only production dependencies
RUN npm ci --omit=dev

# Copy built application from builder
COPY --from=builder /app/src ./src
COPY --from=builder /app/tsconfig.json ./

# Expose port (adjust if needed)
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start the app
CMD ["npm", "start"]
