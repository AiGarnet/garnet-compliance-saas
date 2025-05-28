FROM node:18-alpine

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the data file explicitly to ensure it's available
COPY data_new.json ./data_new.json

# Copy the rest of the application code
COPY . .

# Build the application
RUN npm run build

# Set the port explicitly
ENV PORT=8080

# Expose the ports the app might run on
EXPOSE 8080

# Start the application in production mode - using exec form for proper signal handling
ENTRYPOINT ["node", "dist/index.js"] 