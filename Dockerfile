FROM oven/bun:1.2.21-alpine AS build
WORKDIR /app

# Cache packages installation
COPY package.json package.json
COPY bun.lock bun.lock
RUN bun install
COPY . .

ENV NODE_ENV=production
RUN bun run build-binary

FROM gcr.io/distroless/base AS release
WORKDIR /app
COPY --from=build /app/build/server ./build/server
ENV NODE_ENV=production
CMD ["./build/server"]
EXPOSE 8080
