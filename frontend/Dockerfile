# Stage 1: Build React SPA
FROM node:22-alpine AS builder

WORKDIR /app

# Copy dependency definitions
COPY package.json package-lock.json ./

# Install dependencies using clean install (npm ci)
RUN npm ci

# Copy source code
COPY . .

# Pass build arg to environment variable for Vite
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Build production bundle
RUN npm run build

# Stage 2: Serve using Nginx
FROM nginx:alpine

# Copy custom Nginx configuration for client-side routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy build output to Nginx serve directory
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
