FROM node:lts-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# --- runtime ---
FROM node:lts-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY --from=builder /app/dist ./dist

RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

ENV MCP_TRANSPORT=http

EXPOSE 3001

ENTRYPOINT ["node", "dist/index.js"]

LABEL maintainer="PostgSail - https://github.com/xbgmsharp/PostgSail"
LABEL org.opencontainers.image.description="PostgSail - An open source PostgreSQL-based marine vessel tracking and monitoring platform."
LABEL org.opencontainers.image.source="https://github.com/xbgmsharp/PostgSail"
LABEL org.opencontainers.image.licenses="Apache-2.0"
LABEL org.opencontainers.image.title="PostgSail MCP Server HTTP"
LABEL org.opencontainers.image.url="https://github.com/xbgmsharp/postgsail-mcp-server"
LABEL org.opencontainers.image.vendor="Francois Lacroix"
LABEL org.opencontainers.image.version="latest"
