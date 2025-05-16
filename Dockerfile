FROM oven/bun AS build
WORKDIR /app

# Cache packages installation
COPY package.json package.json
COPY bun.lockb bun.lockb
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