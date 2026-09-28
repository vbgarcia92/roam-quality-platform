# Roam Quality Tests

Playwright suite that runs against a live Roam Trip Booking SUT (see
[../app/README.md](../app/README.md)).

| Project | Folder | Target |
| --- | --- | --- |
| `api` | `api/` | API directly, `http://localhost:3000` |
| `ui` | `ui/` | React app in Chromium, `http://localhost:8080` |

## Setup

```bash
cd tests
npm install
npx playwright install chromium
```

## Run

The SUT must be running and seeded first:

```bash
cd app && docker compose up -d
cd app/api && npm run db:seed
```

Then, from `tests/`:

```bash
npm test             # both projects
npm run test:api     # API only
npm run test:ui      # UI only
npm run report       # open the HTML report from the last run
```

To point at another environment, set `API_URL` and/or `WEB_URL`. If the SUT
isn't reachable, the run stops before any test with a message saying how to
start it.

## Conventions

- **No hard-coded seed data.** Trip ids and dates change on every re-seed,
  so tests read them from the SUT.
- **UI selectors:** `getByTestId` (`data-testid`) or `getByLabel` for form
  inputs.
- **Traces and screenshots** are kept only for failed tests (open them from
  the HTML report).
- **Test data is not cleaned up yet.** Bookings created by tests use
  `api-<uuid>@example.com` / `ui-<uuid>@example.com` emails, so they can be
  found and removed.
