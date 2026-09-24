# Build context is the repo root (see apps/web/railway.json).

# 1. Compile the Rust scoring code to WASM.
FROM rust:1 AS wasm
RUN rustup target add wasm32-unknown-unknown && cargo install wasm-pack --locked
WORKDIR /src
COPY services/wasm-calculations ./services/wasm-calculations
RUN wasm-pack build services/wasm-calculations --target web --release

# 2. Build the SQLite databases (used by the /foods pages and /api routes).
FROM python:3.12-slim AS db
WORKDIR /src
COPY data ./data
COPY services/data-pipeline ./services/data-pipeline
COPY apps/web/next.config.ts ./apps/web/next.config.ts
RUN mkdir -p data/db && cd services/data-pipeline && python -m src.build_db

# 3. Build the Next.js app.
FROM node:22-slim AS build
WORKDIR /src
COPY package.json package-lock.json ./
COPY apps/web/package.json apps/web/
COPY --from=wasm /src/services/wasm-calculations/pkg services/wasm-calculations/pkg
RUN npm ci
COPY apps/web apps/web
# Use the next.config.ts with the DB_VERSION that matches the built database.
COPY --from=db /src/apps/web/next.config.ts apps/web/next.config.ts
# NEXT_PUBLIC_* values are baked into the browser bundle at build time.
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
RUN npm run build -w apps/web

# 4. Runtime image.
FROM node:22-slim
WORKDIR /src
ENV NODE_ENV=production
COPY --from=build /src ./
COPY --from=db /src/data/db ./data/db
ENV DATA_DIR=/src/data/db
# next start reads PORT, which Railway provides.
CMD ["npm", "run", "start", "-w", "apps/web"]
