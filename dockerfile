### Development Stage ###
FROM node:18-alpine

# Set working directory
WORKDIR /usr/src/app

# Install Angular CLI globally
RUN npm install -g @angular/cli@14.2.3

# Install dependencies first (better layer caching)
COPY package*.json ./
RUN npm ci && npm cache clean --force

# Copy source code
COPY . .

# Expose port 4200 for Angular dev server
EXPOSE 4200

# Start Angular dev server
CMD ["npm", "start"]
