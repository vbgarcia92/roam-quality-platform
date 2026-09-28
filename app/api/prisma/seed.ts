import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/auth/password";

const prisma = new PrismaClient();

// Shared, documented password for the seeded test accounts (see app/README.md).
const SEED_USER_PASSWORD = "Roam@Test123";

// 20 scheduled trips across the 12 supported countries, with extra date
// options for the more popular destinations. Dates are offsets from the day
// the seed runs, so re-seeding always yields a fully bookable catalogue
// (departed trips drop out of GET /trips and can't be booked).
const TRIPS = [
  { country: "Vietnam", startsInDays: 42, nights: 13, pricePerPerson: 1200 },
  { country: "Vietnam", startsInDays: 139, nights: 14, pricePerPerson: 1250 },
  { country: "Japan", startsInDays: 26, nights: 10, pricePerPerson: 1800 },
  { country: "Japan", startsInDays: 189, nights: 11, pricePerPerson: 1950 },
  { country: "Korea", startsInDays: 52, nights: 10, pricePerPerson: 1600 },
  { country: "New Zealand", startsInDays: 77, nights: 14, pricePerPerson: 2200 },
  { country: "New Zealand", startsInDays: 113, nights: 14, pricePerPerson: 2300 },
  { country: "Australia", startsInDays: 72, nights: 14, pricePerPerson: 2000 },
  { country: "Australia", startsInDays: 158, nights: 13, pricePerPerson: 2050 },
  { country: "Brazil", startsInDays: 16, nights: 10, pricePerPerson: 900 },
  { country: "Brazil", startsInDays: 130, nights: 11, pricePerPerson: 1100 },
  { country: "Argentina", startsInDays: 38, nights: 13, pricePerPerson: 950 },
  { country: "USA", startsInDays: 21, nights: 10, pricePerPerson: 1500 },
  { country: "USA", startsInDays: 250, nights: 13, pricePerPerson: 1600 },
  { country: "Netherlands", startsInDays: 203, nights: 10, pricePerPerson: 1300 },
  { country: "France", startsInDays: 11, nights: 10, pricePerPerson: 1400 },
  { country: "France", startsInDays: 219, nights: 11, pricePerPerson: 1450 },
  { country: "Italy", startsInDays: 31, nights: 11, pricePerPerson: 1350 },
  { country: "Italy", startsInDays: 238, nights: 12, pricePerPerson: 1400 },
  { country: "Indonesia", startsInDays: 57, nights: 12, pricePerPerson: 1100 },
] as const;

function daysFromToday(days: number): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + days));
}

const USERS = [
  { firstName: "Ana", lastName: "Silva", email: "ana.silva@example.com", phone: "+55 11 91234-5678" },
  { firstName: "John", lastName: "Doe", email: "john.doe@example.com", phone: "+1 415 555-0134" },
  { firstName: "Mei", lastName: "Tanaka", email: "mei.tanaka@example.com", phone: "+81 90 1234 5678" },
  { firstName: "Liam", lastName: "O'Brien", email: "liam.obrien@example.com", phone: "+64 21 555 0192" },
  { firstName: "Sofia", lastName: "Rossi", email: "sofia.rossi@example.com", phone: "+39 345 678 9012" },
] as const;

async function main() {
  // Trips are a full catalogue reset on every run: there is no natural
  // unique key per trip, and this is reference/fixture data, not
  // user-generated content.
  await prisma.trip.deleteMany();
  await prisma.trip.createMany({
    data: TRIPS.map((trip) => ({
      country: trip.country,
      departureDate: daysFromToday(trip.startsInDays),
      arrivalDate: daysFromToday(trip.startsInDays + trip.nights),
      pricePerPerson: trip.pricePerPerson,
      currency: "USD",
    })),
  });

  for (const user of USERS) {
    const data = { ...user, passwordHash: await hashPassword(SEED_USER_PASSWORD) };
    await prisma.user.upsert({
      where: { email: user.email },
      update: data,
      create: data,
    });
  }

  const [tripCount, userCount] = await Promise.all([prisma.trip.count(), prisma.user.count()]);
  console.log(`Seeded ${tripCount} trips and ${userCount} users.`);
}

main()
  .catch((err) => {
    console.error("Seed failed", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
