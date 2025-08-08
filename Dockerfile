# Use Node.js as the base image
FROM node:18-alpine AS development

# Set working directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install Oracle Instant Client dependencies
RUN apk add --no-cache libaio libc6-compat

# Install dependencies
RUN npm install --only=development

# Copy application source
COPY . .

# Build the application
RUN npm run build

# Stage 2: Production
FROM node:18-alpine AS production

# Set NODE_ENV
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

# Set working directory
WORKDIR /usr/src/app

# Install Oracle Instant Client dependencies
RUN apk add --no-cache libaio libc6-compat

# Create directory for Oracle Instant Client
RUN mkdir -p /usr/src/app/instantclient

# Copy Oracle Instant Client (you need to have these files)
COPY --from=development /usr/src/app/instantclient /usr/src/app/instantclient

# Set environment variable for Oracle Instant Client
ENV LD_LIBRARY_PATH=/usr/src/app/instantclient

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm install --only=production

# Copy compiled application from development stage
COPY --from=development /usr/src/app/dist ./dist

# Expose application port
EXPOSE 2233

# Set user to node (more secure than running as root)
USER node

# Start the application
CMD ["node", "dist/main"]