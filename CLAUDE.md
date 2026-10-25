# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

WeTalk is a chat app: a Next.js frontend (`web/`) and Go microservices (`backend/`). There is no root build system. Each Go service is its own Go module with its own `go.mod`, `.env` and `.air.toml`, so run commands from inside the service directory. `web/` has its own [CLAUDE.md](web/CLAUDE.md), which points to `AGENTS.md`. That file warns that this Next.js version (16.x) has breaking changes, so read `node_modules/next/dist/docs/` before writing Next.js code.

## Commands

### Backend (run inside `backend/<service>/`)

- Hot-reload dev server: `air`. It builds `./main/main.go` into `./tmp/main`.
- Run without air: `go run ./main/main.go`
- Build: `go build ./...`
- Tests: `go test ./...`. The only tests so far are in `socket/internal/socketio/socketio_test.go`.
- Run a single test: `go test ./internal/socketio -run TestEventsAndAcks`

Every service except `gateway` calls `godotenv.Load()` and fails at startup if `.env` is missing. Each config reads its variables with `getEnvOrPanic`. Copy `.env.example` to `.env` first; `socket` has no example file and needs `PORT`, `JWT_SECRET` and `RABBITMQ_URL`. Local infrastructure is Postgres, RabbitMQ (`amqp://guest:guest@localhost:5672/`) and Redis. The socket service hardcodes Redis at `localhost:6379`. The `docker-compose.yml` files are currently empty.

### Frontend (run inside `web/`)

- `npm run dev`, `npm run build`, `npm run lint` (ESLint 9 flat config). The folder has both `package-lock.json` and `yarn.lock`.
- There is no test runner.
- Environment variables: `NEXT_PUBLIC_API_URL` (default `http://localhost:8080/api`) and `NEXT_PUBLIC_SOCKET_URL` (default `ws://localhost:9000`).

## Architecture

### Request flow

The browser calls the **gateway** (:8080), which reverse-proxies to the downstream services:

| Gateway route | Service | Default port | JWT required |
|---|---|---|---|
| `/api/v1/auth/*` | auth-service | 8081 | no |
| `/api/v1/users/*` | user-service | 8082 | `AUTH_REQUIRED_FOR_USERS` |
| `/api/v1/conversations/*` | conversation | 8083 | yes |
| `/api/v1/messages/*` | message | 8084 | yes |

- Services are registered in `gateway/main/services/service.go`. To add a service or API version, add an entry there and a URL in `gateway/config/config.go`.
- The gateway forwards the full path unchanged, so each downstream service mounts its routes under the same `/api/v1/<prefix>` path.
- The gateway validates the HS256 JWT (claim `id`) and injects an `X-User-Id` header. Downstream services trust this header and do not re-validate the token.
- The gateway owns CORS and strips CORS headers from downstream responses.
- All services and the gateway must share the same `JWT_SECRET`.

The **socket** service is a separate realtime server (port 9000 per the web default) that the browser connects to directly, not through the gateway.

### Service layout

Every Go service follows `main/main.go` → `internal/router` → `handler` → `service` → `repository` (GORM/Postgres), with `dto` and `model(s)` packages alongside. Other shared conventions:

- `pkg/response` defines the JSON envelope `{success, data, error:{code,message}, meta}`. The frontend reads `response.data.data`.
- `db/postgres.go` runs `AutoMigrate`. There are no migration files.
- `rabbitmq/` contains `constants.go` (exchange, queue and routing-key bindings declared on startup through `InitBindings`) and a `consumer/` package.

Code is duplicated per service, not shared through a common module. Both auth-service and user-service use the Go module name `wetalk`.

Known quirk: `conversation/main/main.go` wires its routes inline. `conversation/internal/router` is unused and has a typo in its path (`/conersation`).

### Registration saga (RabbitMQ, topic exchange `user.exchange`)

1. auth-service `POST /register` creates an inactive `Auth` row and publishes `user.created`.
2. user-service consumes `user.created` (queue `user-service.user-created`), creates the `User` profile, and publishes `user.active` with `{id, is_success}`.
3. auth-service consumes `user.active` (queue `auth-service.auth-active`). It activates the account on success and deletes it on failure.

Auth issues an access token in the response body and a refresh token as an httpOnly `refresh_token` cookie. The web axios client (`web/src/services/base.service.ts`) retries a request once after a 401 by calling `/v1/auth/refresh-token`.

### Message service

`message` stores messages in its own database (`message_db`). Before every read or write it calls the conversation service directly at `CONVERSATION_SERVICE_URL`, not through the gateway, to check that the user is a member. Only the sender can edit or delete a message, and a delete is a soft delete. After each change it publishes `{message, memberIds}` to the topic exchange `message.exchange` with the routing key `message.created`, `message.updated` or `message.deleted`. Publishing is best effort: a broker failure is logged and does not fail the request. Nothing consumes these events yet.

### Socket service

`socket/internal/socketio` is a hand-written Socket.IO v5 / Engine.IO v4 server built on gorilla/websocket. It supports the websocket transport only, with no long-polling and no binary attachments, so clients must pass `transports: ["websocket"]`.

- `middleware.SocketAuth` reads the JWT from the handshake `auth.token`, the `Authorization` header or the `?token=` query parameter. A connection without a token is allowed as a guest.
- `internal/events` joins each authenticated socket to the room `user:<id>` and tracks the user's socket IDs in a Redis set at `socket:user:<id>`.
- The web client is `web/src/lib/socket/index.tsx`. It wraps the workspace layout in a `SocketProvider` and calls `useSocket()`.

### Frontend

The frontend uses the Next.js App Router with React 19, TanStack Query, react-hook-form with zod, and Tailwind v4.

- Code is organized by feature under `src/features/<feature>/` (components, hooks, context) and uses the path alias `@/`.
- API wrappers live in `src/services/*.service.ts`, and shared types live in `src/type/`.
- Authenticated pages are under the `src/app/(workspace)/` route group.
- Some chat and profile UI still reads from `src/features/chat/data/mock-data.ts`.
- Code comments and UI strings are partly in Vietnamese, and the app has an i18n provider in `src/lib/i18n`.
