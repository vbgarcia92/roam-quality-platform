import { FastifySchemaValidationError } from "fastify";

// Turns ajv errors into readable "field message" strings, e.g.
// "traveler.email must match format \"email\"".
export function formatValidationErrors(errors: FastifySchemaValidationError[]): string[] {
  return errors.map((err) => {
    const path = err.instancePath.replace(/^\//, "").replace(/\//g, ".");
    if (err.keyword === "required") {
      const missing = (err.params as { missingProperty: string }).missingProperty;
      return `${path ? `${path}.` : ""}${missing} is required`;
    }
    return `${path || "body"} ${err.message}`;
  });
}
