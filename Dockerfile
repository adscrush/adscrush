# Base stage for pnpm and turbo
FROM oven/bun:1.1 as base
RUN apt-get update && apt-get install -y nodejs npm && npm install -g pnpm turbo
WORKDIR /app

# Prune stage to isolate application dependencies
FROM base as pruner
ARG APP
COPY . .
RUN turbo prune @adscrush/${APP} --docker

# Installer stage to install dependencies
FROM base as installer
ARG APP
COPY .gitignore .gitignore
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN pnpm install --frozen-lockfile

# Builder stage to build the application
COPY --from=pruner /app/out/full/ .
COPY turbo.json turbo.json
RUN pnpm turbo build --filter=@adscrush/${APP}

# Runner stage for the final image
FROM base as runner
ARG APP
WORKDIR /app
COPY --from=installer /app .

# Define entrypoints based on the app
ENV APP_NAME=${APP}
CMD if [ "$APP_NAME" = "web" ]; then \
      cd apps/web && pnpm start; \
    else \
      cd apps/${APP_NAME} && bun run start; \
    fi
