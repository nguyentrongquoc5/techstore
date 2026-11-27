# =============================================================================
# TechStore Frontend – Multi-stage production Dockerfile (Vite → Nginx)
# =============================================================================
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# VITE_API_URL phải trỏ tới backend public URL khi build cho production
# Có thể override bằng --build-arg khi docker build / trong CI
ARG VITE_API_URL=https://techstore-api.onrender.com/api
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# ---- Production Nginx image ----
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
