# Roam Trip Booking (SUT)

Minimal trip booking system used as the System Under Test for the
roam-quality-platform hands-on project. See [../docs/charter.md](../docs/charter.md)
for the project's purpose and scope.

## Stack

- Node.js + TypeScript + Fastify API
- PostgreSQL (via Docker Compose), schema managed by Prisma Migrate
- Server-rendered static UI (plain HTML/CSS/JS), one screen per booking step,
  served by the same Fastify app

## Run with Docker Compose

```bash
cd app
docker compose up --build
```

The API container runs `prisma migrate deploy` before starting the server,
so the `trips`, `users` and `bookings` tables are created automatically.
The app is available at http://localhost:3000

Seed the database with 20 sample trips and 5 sample users:

```bash
cd app/api
npm run db:seed
```

## Run locally without Docker

```bash
cd app/api
npm install
docker compose -f ../docker-compose.yml up -d db

# create app/api/.env with:
#   DATABASE_URL="postgres://roam:roam@localhost:5432/roam_trip_booking"

npm run db:migrate   # applies prisma/migrations, prompts for a new one if the schema changed
npm run db:seed      # populates 20 trips + 5 users
npm run dev
```

## Database schema (Prisma)

`prisma/schema.prisma` defines three models:

- **Trip** - a scheduled itinerary (country, departure/return dates, fixed price)
- **User** - a traveler profile (name, email, phone)
- **Booking** - a reservation; mirrors the columns the API already reads/writes
  by hand via `pg`, plus optional `tripId`/`userId` foreign keys reserved for
  future work wiring the live booking flow to real Trip/User records

`prisma/seed.ts` resets and repopulates the `trips` table (20 rows across the
12 supported countries) and upserts 5 `users` by email, so it's safe to
re-run with `npm run db:seed`.

## API

| Method | Path            | Description                                        |
| ------ | --------------- | -------------------------------------------------- |
| GET    | `/health`       | Liveness + DB connectivity check                   |
| GET    | `/trips`        | List of bookable destinations with fixed price     |
| GET    | `/trips/:id`    | Single destination                                 |
| POST   | `/auth/token`   | Exchange email + password for a Bearer token (JWT) |
| POST   | `/bookings`     | Create a booking (guest, or linked to a user)      |
| GET    | `/bookings/:id` | Fetch a booking                                    |

Validation failures return `400` with
`{ "error": "Validation failed", "details": ["field message", ...] }`.

### Authentication

```bash
curl -X POST http://localhost:3000/auth/token \
  -H "Content-Type: application/json" \
  -d '{"email":"ana.silva@example.com","password":"Roam@Test123"}'
# => { "accessToken": "...", "tokenType": "Bearer", "expiresIn": 3600 }
```

All 5 seeded users share the test password `Roam@Test123`. Wrong password
and unknown email both return the same `401`.

Auth on `POST /bookings` is optional so the guest UI flow keeps working:

- no `Authorization` header: guest booking, `userId: null`
- valid `Authorization: Bearer <token>`: booking is linked to that user
- invalid, expired, or non-Bearer token, or a token for a user that no longer
  exists: `401`

### Booking validation rules

- `destinationId` must be one of the 12 destinations
- `departureDate` / `arrivalDate` are `YYYY-MM-DD`; departure can't be in
  the past; arrival must be on or after departure
- `adults` 1-10 and `children` 0-10, JSON integers (types are not coerced,
  so `"2"` or `true` are rejected)
- traveler names can't be blank; `phone` and `email` must be well-formed
- unknown fields are stripped rather than rejected

## Chaos: deliberate latency defect

Setting `CHAOS_LATENCY=true` adds **4000ms** to every `GET /trips` (trip
search). Every other endpoint is unaffected. This defect is injected on
purpose for the testing phase. The API logs a warning at startup when
it's on.

```bash
cd app
CHAOS_LATENCY=true docker compose up -d api   # enable
docker compose up -d api                      # disable (default: false)
```

## UI flow

Each booking step is its own page (real navigation, no SPA routing), with
booking-draft state passed between pages via `sessionStorage`:

1. `/index.html` - select departure/arrival country, dates, adults/children
2. `/traveler-info.html` - traveler's first name, last name, phone, email
3. `/review.html` - review summary + price, submits the booking to the API
4. `/confirmation.html` - success message and booking reference

Every interactive element carries a stable `id` and a matching
`data-testid` attribute for Playwright selectors (e.g.
`[data-testid="confirm-booking-btn"]`).
