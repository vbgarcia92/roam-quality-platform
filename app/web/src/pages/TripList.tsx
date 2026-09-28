import { useEffect, useState } from "react";
import { Link } from "react-router";
import { getTrips, Trip } from "../api";
import { formatDate, formatMoney, nightsBetween } from "../format";

type ListState =
  | { status: "loading" }
  | { status: "ready"; trips: Trip[] }
  | { status: "error"; message: string };

export function TripList() {
  const [state, setState] = useState<ListState>({ status: "loading" });

  useEffect(() => {
    document.title = "Trips - Roam Trip Booking";
    let cancelled = false;
    getTrips()
      .then((trips) => {
        if (!cancelled) setState({ status: "ready", trips });
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setState({ status: "error", message: err instanceof Error ? err.message : "Something went wrong" });
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section data-testid="page-trip-list">
      <h2>Upcoming trips</h2>

      {state.status === "loading" && (
        <p className="status-message" data-testid="trips-loading" aria-busy="true">
          Loading trips...
        </p>
      )}

      {state.status === "error" && (
        <div className="form-error-summary" data-testid="trips-error" role="alert">
          Could not load trips: {state.message}
        </div>
      )}

      {state.status === "ready" && state.trips.length === 0 && (
        <p className="status-message" data-testid="trips-empty">
          No upcoming trips right now.
        </p>
      )}

      {state.status === "ready" && state.trips.length > 0 && (
        <ul className="trip-grid" data-testid="trip-list">
          {state.trips.map((trip) => (
            <li key={trip.id} className="card trip-card" data-testid="trip-card" data-trip-id={trip.id}>
              <h3 data-testid="trip-card-country">{trip.country}</h3>
              <p className="trip-card-dates" data-testid="trip-card-dates">
                <time dateTime={trip.departureDate}>{formatDate(trip.departureDate)}</time>
                {" - "}
                <time dateTime={trip.arrivalDate}>{formatDate(trip.arrivalDate)}</time>
                <span className="muted"> ({nightsBetween(trip.departureDate, trip.arrivalDate)} nights)</span>
              </p>
              <p className="trip-card-price" data-testid="trip-card-price">
                {formatMoney(trip.pricePerPerson, trip.currency)} <span className="muted">per traveler</span>
              </p>
              <Link to={`/trips/${trip.id}`} className="btn btn-primary" data-testid="trip-card-view-btn">
                View details
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
