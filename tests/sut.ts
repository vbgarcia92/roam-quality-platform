// Where the System Under Test is running. Defaults match `docker compose up`
// in app/; override with env vars to point at another environment.
export const WEB_URL = process.env.WEB_URL ?? "http://localhost:8080";
export const API_URL = process.env.API_URL ?? "http://localhost:3000";
