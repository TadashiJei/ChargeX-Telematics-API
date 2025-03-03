FROM node:18-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy application code
COPY . .

# Expose the API docs port
EXPOSE 3050

# Start the API docs server
CMD ["node", "server.js"]
