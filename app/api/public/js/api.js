// Thin fetch wrapper shared by every screen. Same-origin, no base URL needed
// because the API and the static UI are served by the same Fastify app.
window.RoamApi = {
  async getTrips() {
    const res = await fetch("/trips");
    if (!res.ok) throw new Error("Failed to load trips");
    const data = await res.json();
    return data.trips;
  },

  async createBooking(payload) {
    const res = await fetch("/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      const err = new Error(data.error || "Booking failed");
      err.details = data.details || [];
      throw err;
    }
    return data.booking;
  },

  async getBooking(id) {
    const res = await fetch(`/bookings/${encodeURIComponent(id)}`);
    if (!res.ok) throw new Error("Booking not found");
    const data = await res.json();
    return data.booking;
  },
};
