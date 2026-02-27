FROM node:20-alpine AS web-build
WORKDIR /app/web
COPY web/package.json web/package-lock.json* ./
RUN npm install
COPY web/ .
RUN npm run build

FROM node:20-alpine AS server-build
WORKDIR /app/server
COPY server/package.json server/package-lock.json* ./
RUN npm install --omit=dev
COPY server/ .

FROM node:20-alpine
WORKDIR /app
COPY --from=server-build /app/server /app/server
COPY --from=web-build /app/web/dist /app/web/dist

ENV NODE_ENV=production
ENV SERVE_WEB=true

WORKDIR /app/server
EXPOSE 4000
CMD ["node", "src/index.js"]
