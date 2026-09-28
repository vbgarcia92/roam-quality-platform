import { Link, Route, Routes } from "react-router";
import { TripList } from "./pages/TripList";
import { TripDetail } from "./pages/TripDetail";
import { BookingForm } from "./pages/BookingForm";

function NotFound() {
  return (
    <section className="card" data-testid="page-not-found">
      <h2>Page not found</h2>
      <Link to="/" className="btn btn-secondary" data-testid="back-to-trips-btn">
        Back to trips
      </Link>
    </section>
  );
}

export function App() {
  return (
    <>
      <header className="app-header">
        <Link to="/" data-testid="home-link">
          <h1>Roam Trip Booking</h1>
        </Link>
      </header>
      <main className="app-main">
        <Routes>
          <Route path="/" element={<TripList />} />
          <Route path="/trips/:tripId" element={<TripDetail />} />
          <Route path="/trips/:tripId/book" element={<BookingForm />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </>
  );
}
