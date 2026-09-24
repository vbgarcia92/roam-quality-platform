FROM node:20-alpine AS build
RUN apk add --no-cache openssl
WORKDIR /usr/src/app
COPY package*.json ./
COPY prisma ./prisma
RUN npm install
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM node:20-alpine
RUN apk add --no-cache openssl
WORKDIR /usr/src/app
ENV NODE_ENV=production
COPY package*.json ./
COPY prisma ./prisma
RUN npm install --omit=dev
COPY --from=build /usr/src/app/dist ./dist
COPY public ./public

EXPOSE 3000
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
