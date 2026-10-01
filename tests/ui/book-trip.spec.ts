import { randomUUID } from "crypto";
import { expect, test } from "@playwright/test";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

const usd = (amount: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);

// The main journey: trip list -> trip detail -> booking form -> confirmation.
test("traveler books a trip end to end", async ({ page, request }) => {
  const email = `ui-${randomUUID()}@example.com`;

  await page.goto("/");
  const firstCard = page.getByTestId("trip-card").first();
  await expect(firstCard).toBeVisible();
  const tripId = (await firstCard.getAttribute("data-trip-id"))!;
  const country = await firstCard.getByTestId("trip-card-country").innerText();

  // The API (through the same /api proxy the UI uses) is the source of truth
  // for the expected price.
  const tripResponse = await request.get(`/api/trips/${tripId}`);
  expect(tripResponse.status()).toBe(200);
  const { trip } = await tripResponse.json();

  await test.step("open trip detail", async () => {
    await firstCard.getByTestId("trip-card-view-btn").click();
    await expect(page).toHaveURL(new RegExp(`/trips/${tripId}$`));
    await expect(page.getByTestId("trip-detail-country")).toHaveText(country);
    await expect(page.getByTestId("trip-detail-price")).toHaveText(usd(trip.pricePerPerson));
  });

  let departureCountry = "";
  await test.step("fill in the booking form", async () => {
    await page.getByTestId("book-trip-btn").click();
    await expect(page).toHaveURL(new RegExp(`/trips/${tripId}/book$`));

    // Index 0 is the placeholder; the list never includes the trip's country.
    const departure = page.getByLabel("Departure country");
    await departure.selectOption({ index: 1 });
    departureCountry = await departure.inputValue();

    await page.getByLabel("Adults").fill("2");
    await page.getByLabel("Children").fill("1");
    await page.getByLabel("First name").fill("Playwright");
    await page.getByLabel("Last name").fill("Tester");
    await page.getByLabel("Phone").fill("+1 415 555 0100");
    await page.getByLabel("Email").fill(email);

    await expect(page.getByTestId("booking-total-price")).toHaveText(usd(trip.pricePerPerson * 3));
  });

  await test.step("submit and see the confirmation", async () => {
    await page.getByTestId("submit-booking-btn").click();

    await expect(page.getByTestId("booking-success-message")).toHaveText("Booking confirmed!");
    await expect(page.getByTestId("confirmation-booking-id")).toHaveText(UUID);
    await expect(page.getByTestId("confirmation-destination")).toHaveText(country);
    await expect(page.getByTestId("confirmation-departure-country")).toHaveText(departureCountry);
    await expect(page.getByTestId("confirmation-travelers")).toHaveText("2 adult(s), 1 child(ren)");
    await expect(page.getByTestId("confirmation-traveler-name")).toHaveText("Playwright Tester");
    await expect(page.getByTestId("confirmation-total-price")).toHaveText(usd(trip.pricePerPerson * 3));
  });

  await test.step("booking was persisted", async () => {
    const bookingId = await page.getByTestId("confirmation-booking-id").innerText();
    const bookingResponse = await request.get(`/api/bookings/${bookingId}`);
    expect(bookingResponse.status()).toBe(200);
    const { booking } = await bookingResponse.json();
    expect(booking).toMatchObject({
      tripId,
      departureCountry,
      adults: 2,
      children: 1,
      travelerEmail: email,
      totalPrice: trip.pricePerPerson * 3,
    });
  });
});
