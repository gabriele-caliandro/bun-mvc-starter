FROM oven/bun:1.3.3 AS build
WORKDIR /app

# Cache packages installation
COPY package.json package.json
COPY bun.lock bun.lock
RUN bun install
COPY . .

ENV NODE_ENV=production
RUN bun build \
  --compile \
  --minify-whitespace \
  --target=bun-linux-x64 \
  --minify-syntax \
  --outfile server \
  src/main.ts

FROM gcr.io/distroless/base AS release
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/server ./server
CMD ["/app/server"]
EXPOSE 8080
