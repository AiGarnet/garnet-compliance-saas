FROM node:18-alpine

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install ALL dependencies (including devDependencies for building)
RUN npm install

# Copy the data file explicitly to ensure it's available
COPY data_new.json ./data_new.json

# Copy the rest of the application code
COPY . .

# Build the TypeScript code
RUN npm run build

# Remove devDependencies to reduce image size
RUN npm prune --production

# Expose the port the app will run on
EXPOSE $PORT

# Start the application in production mode
CMD ["npm", "start"]
