# Quality Strategy (Draft)

| | |
| --- | --- |
| **Status** | Draft v0.1, for review |
| **Date** | 28/09/2026 |
| **Owner** | Vinicius Garcia |
| **Related** | [charter.md](charter.md) |

This draft defines what "quality" means for Roam Trip Booking and names the
five risks that should shape testing first. It feeds the later test strategy
(`docs/12`), risk register (`docs/14`) and NFR catalogue (`docs/07`) named in
the charter.

---

## 1. The product in one paragraph

Roam Trip Booking lets a traveler browse upcoming trips, open a trip's
details, and book it for a group of adults and children. There is no payment:
a booking is confirmed as soon as it is stored. The product has three layers:

- **UI:** a React app with three screens (trip list, trip detail, booking
  form)
- **API:** a Fastify API with optional token authentication
- **Database:** Postgres

The main user journey is **find a trip, then book it**. Everything else
supports that journey.

---

## 2. What quality means for this product

> **A traveler can find a trip and book it correctly, quickly and safely,
> and the team can prove that with evidence.**

The last part matters because of what this product is for. Roam exists to
be tested, so being testable and observable is part of its quality, not an
extra.

### Quality attributes, in priority order

The "how we'll know" signals below are proposals. Numeric targets are
placeholders until they are properly derived in the NFR catalogue.

| # | Attribute | What it means for Roam | How we'll know (draft signal) |
| --- | --- | --- | --- |
| 1 | **Booking correctness** | The total is always the trip's price × travelers. The booking stores exactly the trip that was shown. One submission creates one booking. "Booking confirmed!" appears only when the booking was actually stored. | Automated API and E2E checks on price, stored snapshot and confirmation, with zero known defects open in this area at release |
| 2 | **Input integrity** | Invalid input is rejected with the same rule and a clear message in the UI and the API. Bad input never causes a 500. | Any 5xx caused by client input is a defect. UI and API rules for each field are covered by the same test cases. |
| 3 | **Performance** | Trip search feels instant, and booking completes without noticeable waiting under expected load. | Placeholders: `GET /trips` p95 < 300 ms and `POST /bookings` p95 < 500 ms at a target load still to be defined, with < 1% errors |
| 4 | **Security & privacy** | Traveler personal data (name, email, phone) is visible only to people who should see it. Authentication resists guessing and does not reveal which accounts exist. | Security test cases per risk R2, plus no high or critical findings open at release |
| 5 | **Reliability** | Failures are handled gracefully. The UI shows a clear loading, error or not-found state and never a blank screen. The system recovers once the database is back. | E2E checks on every error state, and a database-restart recovery test |
| 6 | **Usability & accessibility** | Every input has a label, errors are announced to screen readers, and the flow works at phone width and with a keyboard only. | Automated accessibility scan at the WCAG 2.2 AA level with zero serious violations, plus one manual keyboard-only pass |
| 7 | **Testability & observability** | Selectors are stable, test data is deterministic, and a latency regression can be explained from the evidence. | The deliberate `CHAOS_LATENCY` defect is caught by the tests and explained from logs and metrics, not by already knowing it's there |

### What quality does *not* mean here

Payments, external providers and mobile apps are out of scope, as stated in
the charter. Currency is fixed to USD. Trips have no seat limits, so
overbooking is not modeled (see open question 2).

### The deliberate defect as a quality gate

`CHAOS_LATENCY=true` adds 4000 ms to trip search. This defect was planted on
purpose, and it gives us a definition of done for the test setup itself:
**performance tests, E2E tests and dashboards that cannot detect the planted
defect are not finished.**

---

## 3. Top 5 risks

Each risk is scored as **likelihood × impact**, each on a scale of 1 to 5,
based on what the system does today. Every risk points to the code behind it.
File paths are relative to this document.

| ID | Risk | L | I | Score |
| --- | --- | :-: | :-: | :-: |
| R1 | A booking is incorrect or duplicated | 3 | 5 | **15** |
| R2 | Traveler personal data is exposed, or authentication is weak | 3 | 5 | **15** |
| R3 | Date boundaries decide availability wrongly | 4 | 3 | **12** |
| R4 | UI, API and database rules drift apart | 4 | 3 | **12** |
| R5 | Performance degrades without anyone noticing | 3 | 4 | **12** |

### R1 - A booking is incorrect or duplicated (15)

**Why it matters:** the booking is the product. Charging a traveler the
wrong amount, or holding two bookings for one intent, is the most direct way
to lose their trust.

**Evidence today:**

- `POST /bookings` has no idempotency key and no uniqueness guard. The UI
  disables the button while the request is in flight, but a network retry,
  a replayed request or a second browser tab still creates a second booking.
  See [bookings.ts](../app/api/src/routes/bookings.ts).
- The total is computed on the server as `pricePerPerson × (adults +
  children)`. Children pay the full adult price. No requirement says whether
  that is intended (open question 1).
- Destination, dates and price are copied from the trip at booking time.
  That is correct, but only if the copy is taken from the same trip the user
  saw.

**Test response:**

- API tests for price math at the boundaries: 1 adult; 10 adults with 10
  children; every trip price.
- A replay test: send the same request twice and assert the expected
  behavior once it is decided.
- An E2E check that the total on the confirmation equals the total in the
  form, which equals the total stored in the database.
- A database-level check that every booking's price matches its trip.

### R2 - Traveler personal data is exposed, or authentication is weak (15)

**Why it matters:** bookings hold names, emails and phone numbers. Even in
a system under test, handling them as if they were real is part of showing
quality leadership.

**Evidence today:**

- `GET /bookings/:id` requires no authentication and returns the traveler's
  email and phone to anyone who has the booking id. The ids are unguessable
  UUIDs, but ids leak through logs, screenshots and shared links.
- `/auth/token` gives the same error for an unknown email and for a wrong
  password, but not in the same time: about **4 ms** vs **47 ms** (median of
  7 requests each). Unknown emails skip the password hash check, so response
  time reveals which accounts exist. See
  [auth.ts](../app/api/src/routes/auth.ts).
- There is no rate limit on `/auth/token`, so passwords can be guessed
  without limit.
- The JWT secret falls back to a dev default (`dev-only-insecure-jwt-secret`)
  when it isn't set, so tokens can be forged in any environment that forgot
  to set it. See [config.ts](../app/api/src/config.ts).
- CORS accepts requests from any origin (`origin: true` in
  [app.ts](../app/api/src/app.ts)).
- The charter lists Auth as out of scope, but the product now has it
  (open question 3).

**Test response:**

- Negative authentication and authorization tests: missing, expired, forged
  and other-user tokens.
- A timing-difference check on `/auth/token`.
- A brute-force check once rate limiting exists.
- A check that no personal data appears in responses or logs where it
  shouldn't.
- A config test that fails if the default secret is used outside local
  development.

### R3 - Date boundaries decide availability wrongly (12)

**Why it matters:** date and time boundaries are where booking systems
classically fail. A trip that has already departed must not be bookable, and
a valid one must not be hidden.

**Evidence today:**

- Trip dates are calendar dates with no time zone. "Today" is defined as the
  earliest date currently in effect anywhere on earth (UTC-12). As a result,
  a trip stays listed and bookable until its departure day has ended
  everywhere, which is almost a day after it has ended in Japan. See
  [dates.ts](../app/api/src/dates.ts).
- The API filters departed trips out of the list. The trip detail page still
  shows them, and only the final booking submit rejects them. The UI has no
  "departed" state.
- Seed dates are offsets from the day the seed runs, and trip ids are
  regenerated on every seed. Tests therefore cannot hard-code dates or ids.
  Re-seeding also cuts the link between existing bookings and their trips:
  the database sets `trip_id` to null. See
  [seed.ts](../app/api/prisma/seed.ts).

**Test response:**

- Boundary tests with the clock controlled: a trip departing yesterday,
  today and tomorrow, run at 23:59 and 00:01 in UTC-12, UTC and UTC+14.
- UI date display checked in different browser time zones.
- Test data created per test through the API or the database, never assumed
  from the seed.

### R4 - UI, API and database rules drift apart (12)

**Why it matters:** the same rule lives in several places. When they
disagree, users see confusing late errors, and a schema change can break
the running system even though the code still compiles.

**Evidence today:**

- **Email:** the form accepts `ana@my_domain.com`, but the API rejects it
  (verified). The user only finds out after pressing "Confirm booking". See
  [BookingForm.tsx](../app/web/src/pages/BookingForm.tsx).
- **Other duplicated rules:** the traveler limit (`10`), the phone pattern
  and the country list are each defined separately in the UI and in the API
  or seed.
- **Schema drift:** Prisma owns the database schema, but the API queries the
  database with hand-written SQL. Renaming a column in a migration would
  still compile and pass the typecheck, then fail at runtime.

**Test response:**

- A shared table of valid and invalid values, run against both the UI form
  and the API, so any mismatch is visible.
- API contract tests on every endpoint's request and response shape.
- The full API test suite runs after every migration.
- Longer term: generate the UI rules from the API schema.

### R5 - Performance degrades without anyone noticing (12)

**Why it matters:** trip search is the first thing every traveler does. The
charter's performance pillar depends on finding degradations *and
explaining them*.

**Evidence today:**

- No performance requirements (NFRs) exist yet, so "slow" is undefined.
- `GET /trips` returns every upcoming trip with no pagination, and the
  `trips` table has no index on `departure_date`. That is fine at 20 rows,
  but it is untested at realistic volumes.
- The database connection pool uses the library default of 10 connections.
  Authenticated bookings make one extra query to check that the user exists.
- Observability is limited to request logs. There are no metrics or traces
  yet, so a regression can be detected but not explained.
- `CHAOS_LATENCY` is controlled by an environment variable. If it is left
  set in a shell, the slow behavior silently carries into later runs.

**Test response:**

- Derive NFRs from a workload model.
- k6 smoke and load tests on `/trips` and `/bookings` against a scaled-up
  seed.
- Add metrics (latency percentiles per route, database pool usage) before
  any performance test is signed off.
- Prove that the whole setup catches and explains `CHAOS_LATENCY`.

### Also on the watch list

These are real risks, but lower priority than the five above:

- **Test isolation and flakiness:** all tests share one database, and
  re-seeding replaces every trip.
- **Dependency currency:**
  - the API runs on Node 20, which reached end of life in April 2026
  - the frontend uses very new major versions (React Router 8, Vite 8,
    TypeScript 7)
  - a known Prisma CLI advisory remains (build time only)
- **Accessibility:** not audited yet.

---

## 4. Open questions

1. **Child pricing:** should children pay the same as adults? Today they do.
2. **Capacity:** should trips have a limited number of seats? Without
   limits, overbooking cannot happen, so it can't be tested either.
3. **Auth scope:** the charter excludes Auth, but the product has token
   authentication. Update the charter, or keep auth API-only and out of
   the UI?
4. **Performance targets:** what load should the system handle? The targets
   in section 2 are placeholders until this is answered.
5. **"Departed" rule:** should a trip count as departed based on the trip's
   local time zone, on UTC, or on the earliest date on earth (current
   behavior)?
6. **Booking access:** should `GET /bookings/:id` require the booking's
   owner, or at least hide contact details?

---

## 5. Next steps

- Review this draft. Answer the open questions, or record them as
  assumptions.
- Carry R1-R5 into the risk register (`docs/14`) and map each risk to test
  cases for traceability.
- Derive the NFR catalogue (`docs/07`) to replace the placeholder
  performance targets.
- Write the test strategy (`docs/12`), with test levels and tools chosen by
  risk: API tests for R1, R2 and R4; Playwright E2E and accessibility tests
  for the user journey; k6 for R5; clock-controlled tests for R3.
