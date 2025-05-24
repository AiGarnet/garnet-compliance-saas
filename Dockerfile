FROM node:18-alpine

WORKDIR /app

# Copy backend package files
COPY backend/package*.json ./

# Install backend dependencies
RUN npm install

# Copy backend source
COPY backend/ ./

# Build the backend
RUN npm run build

# Expose the port
EXPOSE 5000

# Start the backend
CMD ["npm", "run", "start"] 