FROM node:20-alpine
WORKDIR /app
RUN apk add --no-cache openssl
COPY package.json package-lock.json* ./
COPY prisma ./prisma/
RUN npm install
COPY . .
RUN npx prisma generate
RUN mkdir -p prisma/data public/images/products
ENV DATABASE_URL="file:./data/prod.db"
ENV PORT=4000
EXPOSE 4000
CMD sh -c "mkdir -p prisma/data && npx prisma db push && npx tsx prisma/seed.ts && npx tsx src/index.ts"
