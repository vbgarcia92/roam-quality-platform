# Test Management + Hands On Automation & Performance

## Purpose

A self-built SUT used to evidence performance testing, test automation, and test management.

---

## Why self-built

Due the challenges of performance test a system not owned, I took the opportunity to create a small trip booking system to test some automation skills and performance test activities hands on as well as test management combined to put in practice years of experience mixed with new exposure to technologies I did not have the opportunity to work with.

---

## Scope

A trip-booking domain system with some features in scope:

- API
- Minimal UI
- Postgres

What's out of scope:

- Auth
- providers
- Payments
- Mobile

---

## The three pillars

## The three pillars

| Pillar                  | What it proves                                                                                                                                                                     | Primary evidence                                                                                                                      |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| **Performance testing** | I can derive NFRs where none exist, model realistic workload, find the breaking point, and explain a regression from data with evidence.                                           | `perf/` (k6 smoke/load/stress/spike/soak), `docs/07-nfr-catalogue.md`, `docs/08-k6-vs-jmeter.md`, `docs/10-rca-latency-regression.md` |
| **Test automation**     | I can build an automation suite that survives contact with CI — isolated, parallel, and debuggable by someone who isn't me.                                                        | `tests/` (Playwright UI + API + a11y + BDD slice), `docs/03-flakiness-policy.md`, green pipeline badge                                |
| **Test management**     | I can own the quality gate keeper position, not just the tests — strategy, risk-based scope, traceability, defect process, and a report a stakeholder can make a go/no-go call on. | `docs/12-test-strategy.md`, `docs/13-master-test-plan.md`, `docs/14-risk-register.md`, RTM export, `docs/17-release-test-report.md`   |

Each pillar is demonstrated against a system I built myself, so the numbers are real and the trade-offs are mine to defend.

---

## Constraints

- 90 days in total of this engagement
- Assistance from AI for the main challenges
- Logged days for progress review
- 1 hour per day of project dedicated

---

## Success Criteria

This project is delivered when the following tasks are achieved:

- A small system under test as built and functional
- An automation suite is built and run by itself and automatic through a CI/CD pipeline
- A performance test project is set and executed
- A test plan is put in practice for functional and performance test
- A observability framework is set for the performance test execution
