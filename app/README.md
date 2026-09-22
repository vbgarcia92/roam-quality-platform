# Roam Trip Booking (SUT)

Minimal trip booking system used as the System Under Test for the
roam-quality-platform hands-on project. See [../docs/charter.md](../docs/charter.md)
for the project's purpose and scope.

## Stack

- Node.js + TypeScript + Fastify API
- PostgreSQL (via Docker Compose)
- Server-rendered static UI (plain HTML/CSS/JS), one screen per booking step,
  served by the same Fastify app

## Run with Docker Compose

```bash
cd app
docker compose up --build
```

The app is available at http://localhost:3000

## Run locally without Docker

```bash
cd app/api
npm install
# Start a Postgres instance yourself and set DATABASE_URL, or:
docker compose -f ../docker-compose.yml up -d db
npm run dev
```

## API

| Method | Path            | Description                                   |
| ------ | --------------- | ---------------------------------------------- |
| GET    | `/health`       | Liveness + DB connectivity check               |
| GET    | `/trips`        | List of bookable destinations with fixed price |
| GET    | `/trips/:id`    | Single destination                             |
| POST   | `/bookings`     | Create a booking                               |
| GET    | `/bookings/:id` | Fetch a booking                                |

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
