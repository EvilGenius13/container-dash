# Stage 1: Build and install dependencies
FROM node:14-alpine as builder
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install production dependencies and clean cache to reduce layer size
RUN npm install --production && npm cache clean --force

# Copy app source code (excluding node_modules with .dockerignore)
COPY . .

# Stage 2: Setup runtime environment
FROM node:14-alpine
WORKDIR /app

# Copy built node modules and built app files from builder stage
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/public ./public
COPY --from=builder /app/app.js .

# Expose port 3000 for the application
EXPOSE 3000

# Start the application
CMD ["node", "app.js"]
