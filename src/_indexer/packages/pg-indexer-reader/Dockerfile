FROM node:20-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
COPY . /app
WORKDIR /app

##install dependencies
FROM base AS prod-deps
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install

FROM prod-deps AS pg-indexer-reader

# Expose the port the app runs on
EXPOSE 3001

# Command to run indexer 
CMD ["pnpm", "start"] 