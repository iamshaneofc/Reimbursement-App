FROM node:20-alpine AS base

WORKDIR /app

RUN apk add --no-cache libc6-compat openssl

COPY package.json package-lock.json* ./
COPY prisma ./prisma/

RUN npm ci

COPY . .

ENV NODE_ENV=production
ENV DATABASE_URL="file:./dev.db"
ENV JWT_SECRET="nortex-super-secret-demo-jwt-key-2026-reimbursement"
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN npx prisma generate
RUN npx prisma db push --accept-data-loss
RUN npx tsx prisma/seed.ts
RUN npx next build

RUN mkdir -p public/uploads

EXPOSE 3000

CMD ["npm", "run", "start"]
