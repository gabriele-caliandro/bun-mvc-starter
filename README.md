# bun-ts-starter

A production-ready starter template for Bun + TypeScript projects with pre-configured logging, config management, and HTTP server setup.

## Features

- ⚡️ [Bun](https://bun.sh/) - Fast all-in-one JavaScript runtime
- 🦕 TypeScript 5 with strict mode
- 📝 Structured logging with Winston + daily rotate
- ⚙️ YAML config management with Zod validation
- 🌐 HTTP server with Elysia
- 🔒 Environment variables management
- 📏 ESLint + Prettier

## Quick Start

1. Click the "Use this template" button above
2. Clone your new repository
3. Install dependencies:
   ```bash
   bun install
   ```
4. Setup configuration:
   ```bash
   cp .env.template .env
   cp config.template.yaml config.yaml
   ```
5. Run development server:
   ```bash
   bun run dev
   ```
****
## Scripts

- `bun run dev` - Start development server
- `bun run dev-watch` - Start development server with watch mode
- `bun run lint` - Run `tsc` and `eslint`
- `bun run format` - Format code with `prettier`
- `bun run build` - Build production bundle
- `bun run start` - Start production bundle

## Configuration

### Environment Variables

Copy `.env.template` to `.env` and configure:

```env
TAG_NAME=
```

- `TAG_NAME` - The name of the tag to be used in the Docker image

### Application Config

Copy `config.template.yaml` to `config.yaml` and configure according to your needs.
All configurations are validated using Zod schemas.

## Logging

The template includes a pre-configured logging setup using Winston with:

- Daily rotating file logs
- Console output in development
- File logging in both JSON and Pretty formats in production

Example usage:

```typescript
import { LoggerManager } from "@/utils/logger/LoggerManager";

const logger = await LoggerManager.createLogger({ service: "my-service" });
logger.info("Server started");
logger.error("Error occurred", { error: err });
```

## License

## Author

Gabriele Caliandro (gabrielecaliandro2001@gmail.com)
