### Development Stage ###
FROM node:18-alpine

# Set working directory
WORKDIR /usr/src/app

# Install dependencies first (better layer caching)
COPY package*.json ./
RUN npm ci && npm cache clean --force

# Copy source code
COPY . .

# Expose port 4200 for Angular dev server
EXPOSE 4200

# Start Angular dev server with host binding for Docker
CMD ["npm", "start", "--", "--host", "0.0.0.0", "--port", "4200"]
