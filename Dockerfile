FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY backend/package*.json ./

# Install dependencies
RUN npm install

# Copy backend source code including data_new.json
COPY backend/ ./

# Make sure data_new.json is in the right location
# We're creating both locations to be safe
COPY backend/data_new.json /data_new.json
COPY backend/data_new.json ./data_new.json

# Build TypeScript to JavaScript
RUN npm run build

# Expose port
EXPOSE 5000

# Start the app
CMD ["npm", "run", "start"] 