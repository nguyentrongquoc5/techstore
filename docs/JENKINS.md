# Deploy TechStore bằng Jenkins

## Cần cài gì?

1. Docker Desktop (Windows) — bật WSL2
2. Jenkins (khuyến nghị chạy bằng Docker)
3. Git

## Pipeline

Jenkinsfile: Checkout → Backend npm/prisma → Frontend build → Docker build API/Web → docker compose up
