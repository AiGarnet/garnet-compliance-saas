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

# Expose the ports the app might run on
EXPOSE 5000 8080

# Start the application in production mode using the railway script
CMD ["npm", "run", "railway-start"] 