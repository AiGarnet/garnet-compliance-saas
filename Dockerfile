# Multi-stage build optimized for Railway deployment
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Set npm configuration for better performance and reduced memory usage
RUN npm config set registry https://registry.npmjs.org/ && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm config set fetch-retries 3

# Copy package files first for better Docker layer caching
COPY package*.json ./

# Install dependencies with memory optimization and timeout handling
# Use --legacy-peer-deps to avoid dependency resolution issues
# Use --no-audit and --no-fund to speed up installation
RUN npm ci --legacy-peer-deps --no-audit --no-fund --prefer-offline && \
    npm cache clean --force

# Copy source code (use .dockerignore to exclude unnecessary files)
COPY . .

# Build the application
RUN npm run build

# Production stage - optimized for minimal size
FROM node:18-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create app user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

WORKDIR /app

# Set npm configuration for production
RUN npm config set registry https://registry.npmjs.org/ && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm config set fetch-retries 3

# Copy package files
COPY package*.json ./

# Install only production dependencies with optimization
RUN npm ci --only=production --legacy-peer-deps --no-audit --no-fund --prefer-offline && \
    npm cache clean --force && \
    rm -rf /root/.npm

# Copy built application from builder stage
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist

# Copy necessary data files
COPY --from=builder --chown=nestjs:nodejs /app/data_new.json ./data_new.json
COPY --from=builder --chown=nestjs:nodejs /app/Dataset.json ./Dataset.json

# Create uploads directory with proper permissions
RUN mkdir -p uploads && chown -R nestjs:nodejs uploads

# Switch to non-root user
USER nestjs

# Expose port
EXPOSE 8080

# Add health check with longer timeout for Railway
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))"

# Use dumb-init for proper signal handling and start the application
CMD ["dumb-init", "node", "dist/main.js"] 