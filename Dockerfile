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

# Created ahead of time (not just left to be lazily mkdir'd at runtime) so a
# named volume mounted over /app/data inherits this ownership instead of
# defaulting to root, which the non-root "node" user below couldn't write to.
RUN mkdir -p /app/data

# node:alpine ships a built-in unprivileged "node" user (uid 1000)
RUN chown -R node:node /app
USER node

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "server/index.js"]
