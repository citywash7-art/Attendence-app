FROM node:20-alpine AS web-build

WORKDIR /app/web
COPY attendance-system/web/package.json attendance-system/web/package-lock.json* ./
RUN npm ci
COPY attendance-system/web/ ./
RUN npm run build

FROM node:20-alpine AS server-build

WORKDIR /app/server
COPY attendance-system/server/package.json attendance-system/server/package-lock.json* ./
RUN npm ci --omit=dev
COPY attendance-system/server/ ./

FROM node:20-alpine

ENV NODE_ENV=production
ENV SERVE_WEB=true
ENV PORT=10000

WORKDIR /app
COPY --from=server-build /app/server ./server
COPY --from=web-build /app/web/dist ./web/dist

WORKDIR /app/server
EXPOSE 10000

CMD ["node", "src/index.js"]
