import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// 20 scheduled trips across the 12 countries the booking UI supports, with
// a couple of extra date options for the more popular destinations.
const TRIPS = [
  { country: "Vietnam", departureDate: "2026-11-05", arrivalDate: "2026-11-18", pricePerPerson: 1200 },
  { country: "Vietnam", departureDate: "2027-02-10", arrivalDate: "2027-02-24", pricePerPerson: 1250 },
  { country: "Japan", departureDate: "2026-10-20", arrivalDate: "2026-10-30", pricePerPerson: 1800 },
  { country: "Japan", departureDate: "2027-04-01", arrivalDate: "2027-04-12", pricePerPerson: 1950 },
  { country: "Korea", departureDate: "2026-11-15", arrivalDate: "2026-11-25", pricePerPerson: 1600 },
  { country: "New Zealand", departureDate: "2026-12-10", arrivalDate: "2026-12-24", pricePerPerson: 2200 },
  { country: "New Zealand", departureDate: "2027-01-15", arrivalDate: "2027-01-29", pricePerPerson: 2300 },
  { country: "Australia", departureDate: "2026-12-05", arrivalDate: "2026-12-19", pricePerPerson: 2000 },
  { country: "Australia", departureDate: "2027-03-01", arrivalDate: "2027-03-14", pricePerPerson: 2050 },
  { country: "Brazil", departureDate: "2026-10-10", arrivalDate: "2026-10-20", pricePerPerson: 900 },
  { country: "Brazil", departureDate: "2027-02-01", arrivalDate: "2027-02-12", pricePerPerson: 1100 },
  { country: "Argentina", departureDate: "2026-11-01", arrivalDate: "2026-11-14", pricePerPerson: 950 },
  { country: "USA", departureDate: "2026-10-15", arrivalDate: "2026-10-25", pricePerPerson: 1500 },
  { country: "USA", departureDate: "2027-06-01", arrivalDate: "2027-06-14", pricePerPerson: 1600 },
  { country: "Netherlands", departureDate: "2027-04-15", arrivalDate: "2027-04-25", pricePerPerson: 1300 },
  { country: "France", departureDate: "2026-10-05", arrivalDate: "2026-10-15", pricePerPerson: 1400 },
  { country: "France", departureDate: "2027-05-01", arrivalDate: "2027-05-12", pricePerPerson: 1450 },
  { country: "Italy", departureDate: "2026-10-25", arrivalDate: "2026-11-05", pricePerPerson: 1350 },
  { country: "Italy", departureDate: "2027-05-20", arrivalDate: "2027-06-01", pricePerPerson: 1400 },
  { country: "Indonesia", departureDate: "2026-11-20", arrivalDate: "2026-12-02", pricePerPerson: 1100 },
] as const;

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
      departureDate: new Date(trip.departureDate),
      arrivalDate: new Date(trip.arrivalDate),
      pricePerPerson: trip.pricePerPerson,
      currency: "USD",
    })),
  });

  for (const user of USERS) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: user,
      create: user,
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
