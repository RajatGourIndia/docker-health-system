FROM node:20-alpine AS web-build
WORKDIR /app/web
COPY web/package*.json ./
RUN npm ci
COPY web ./
RUN npm run build

FROM node:20-alpine
WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY server ./server
COPY --from=web-build /app/web/dist ./web/dist

# node:alpine ships a built-in unprivileged "node" user (uid 1000)
RUN chown -R node:node /app
USER node

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "server/index.js"]
