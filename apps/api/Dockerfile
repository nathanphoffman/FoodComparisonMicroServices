# Build context is the repo root (see apps/api/railway.json).

# 1. Build the SQLite database from the committed JSON source files.
FROM python:3.12-slim AS db
WORKDIR /src
COPY data ./data
COPY services/data-pipeline ./services/data-pipeline
# build_db bumps DB_VERSION in this file, so it has to be present.
COPY apps/web/next.config.ts ./apps/web/next.config.ts
RUN mkdir -p data/db && cd services/data-pipeline && python -m src.build_db

# 2. Compile the API.
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY apps/api/FoodApi.csproj apps/api/
RUN dotnet restore apps/api/FoodApi.csproj
COPY apps/api apps/api
RUN dotnet publish apps/api/FoodApi.csproj -c Release -o /app --no-restore

# 3. Runtime image.
FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app
COPY --from=build /app .
COPY --from=db /src/data/db ./data
ENV DATA_DIR=/app/data
# Railway provides PORT at runtime.
CMD ["sh", "-c", "exec dotnet FoodApi.dll --urls http://+:${PORT:-8080}"]
