# Roam Trip Booking (SUT)

Minimal trip booking system used as the System Under Test for the
roam-quality-platform hands-on project. See [../docs/charter.md](../docs/charter.md)
for the project's purpose and scope.

## Architecture

```
browser ──> web (nginx :8080) ──/api/*──> api (Fastify :3000) ──> db (Postgres :5432)
```

- **web/** - Vite + React + TypeScript single-page app, served by nginx.
  nginx proxies `/api/*` to the API, stripping the prefix
  (`/api/trips` -> `/trips`).
- **api/** - Node.js + TypeScript + Fastify JSON API. Its routes live at the
  root (`/health`, `/trips`, ...) and it can be called directly on `:3000`.
- **db** - PostgreSQL, with the schema managed by Prisma Migrate.

## Run with Docker Compose

```bash
cd app
docker compose up --build
```

- UI: http://localhost:8080
- API: http://localhost:3000

The API container runs `prisma migrate deploy` before starting, so the
tables are created automatically. Seed 20 trips and 5 users:

```bash
cd app/api
npm run db:seed
```

## Run locally without Docker

API (needs Postgres; the compose `db` service is the easiest option):

```bash
cd app/api
npm install
docker compose -f ../docker-compose.yml up -d db

# create app/api/.env with:
#   DATABASE_URL="postgres://roam:roam@localhost:5432/roam_trip_booking"

npm run db:migrate   # applies prisma/migrations, prompts for a new one if the schema changed
npm run db:seed      # populates 20 trips + 5 users
npm run dev          # http://localhost:3000
```

UI (requires Node >= 22.22, for React Router 8):

```bash
cd app/web
npm install
npm run dev          # http://localhost:5173, proxies /api to localhost:3000
```

## UI flow

Three screens. Each is a real URL, so any of them can be deep-linked or
reloaded:

1. `/` - **trip list**: upcoming trips, soonest first
2. `/trips/:tripId` - **trip detail**: dates, duration, price per traveler
3. `/trips/:tripId/book` - **booking form**: departure country, adults,
   children and traveler details, with a live total. A successful booking
   replaces the form with a "Booking confirmed!" message and the booking
   reference.

Every interactive element and key piece of content has a stable
`data-testid` (e.g. `trip-card`, `book-trip-btn`, `submit-booking-btn`,
`booking-success-message`). Form inputs also have an `id` with a matching
`<label>`, so Playwright's `getByLabel` works as well. Loading and error
states have their own test ids (`trips-loading`, `trip-not-found`,
`booking-server-error`, ...).

## Database schema (Prisma)

`api/prisma/schema.prisma` defines three models:

- **Trip** - a scheduled itinerary (country, departure/return dates, fixed
  price per traveler)
- **User** - a traveler profile (name, email, phone, password hash)
- **Booking** - a reservation for a trip. Destination, dates and price are
  copied from the trip at booking time. `userId` is null for guest bookings.

`api/prisma/seed.ts` resets and repopulates the `trips` table and upserts 5
`users` by email, so it's safe to re-run. Trip dates are offsets from the
day the seed runs (the first departs in 11 days), so re-seeding always gives
a fully bookable catalogue.

## API

| Method | Path            | Description                                        |
| ------ | --------------- | -------------------------------------------------- |
| GET    | `/health`       | Liveness + DB connectivity check                   |
| GET    | `/trips`        | Upcoming trips, soonest first                      |
| GET    | `/trips/:id`    | Single trip (including departed ones)              |
| POST   | `/auth/token`   | Exchange email + password for a Bearer token (JWT) |
| POST   | `/bookings`     | Book a trip (guest, or linked to a user)           |
| GET    | `/bookings/:id` | Fetch a booking                                    |

Validation failures return `400` with
`{ "error": "Validation failed", "details": ["field message", ...] }`.

### Booking a trip

```bash
curl -X POST http://localhost:3000/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "tripId": "<id from GET /trips>",
    "departureCountry": "Brazil",
    "adults": 2,
    "children": 1,
    "traveler": {"firstName":"Ana","lastName":"Silva","phone":"+55 11 91234-5678","email":"ana@example.com"}
  }'
```

`totalPrice` = the trip's `pricePerPerson` x (adults + children).

### Booking validation rules

- `tripId` must reference an existing trip that hasn't departed yet
- `departureCountry` can't be blank and must differ from the trip's country
- `adults` 1-10 and `children` 0-10, JSON integers (types are not coerced,
  so `"2"` or `true` are rejected)
- traveler names can't be blank; `phone` and `email` must be well-formed
- unknown fields are stripped rather than rejected

### Authentication

```bash
curl -X POST http://localhost:3000/auth/token \
  -H "Content-Type: application/json" \
  -d '{"email":"ana.silva@example.com","password":"Roam@Test123"}'
# => { "accessToken": "...", "tokenType": "Bearer", "expiresIn": 3600 }
```

All 5 seeded users share the test password `Roam@Test123`. Wrong password
and unknown email both return the same `401`.

Auth on `POST /bookings` is optional. The UI books as a guest:

- no `Authorization` header: guest booking, `userId: null`
- valid `Authorization: Bearer <token>`: booking is linked to that user
- invalid, expired, or non-Bearer token, or a token for a user that no longer
  exists: `401`

## Chaos: deliberate latency defect

Setting `CHAOS_LATENCY=true` adds **4000ms** to every `GET /trips` (trip
search), so the trip list screen stays on its loading state for about 4
seconds. Every other endpoint is unaffected. This defect is injected on
purpose for the testing phase. The API logs a warning at startup when it's
on.

```bash
cd app
CHAOS_LATENCY=true docker compose up -d api   # enable
docker compose up -d api                      # disable (default: false)
```
