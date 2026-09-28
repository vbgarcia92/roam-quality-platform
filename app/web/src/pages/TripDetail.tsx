import { useEffect } from "react";
import { Link, useParams } from "react-router";
import { formatDate, formatMoney, nightsBetween } from "../format";
import { TripFallback, useTrip } from "../useTrip";

export function TripDetail() {
  const { tripId = "" } = useParams();
  const state = useTrip(tripId);

  useEffect(() => {
    document.title =
      state.status === "ready" ? `${state.trip.country} - Roam Trip Booking` : "Trip - Roam Trip Booking";
  }, [state]);

  return (
    <section data-testid="page-trip-detail">
      {state.status !== "ready" ? (
        <TripFallback state={state} />
      ) : (
        <div className="card">
          <h2 data-testid="trip-detail-country">{state.trip.country}</h2>

          <dl className="summary-list" data-testid="trip-detail">
            <dt>Departure</dt>
            <dd data-testid="trip-detail-departure-date">
              <time dateTime={state.trip.departureDate}>{formatDate(state.trip.departureDate)}</time>
            </dd>

            <dt>Return</dt>
            <dd data-testid="trip-detail-return-date">
              <time dateTime={state.trip.arrivalDate}>{formatDate(state.trip.arrivalDate)}</time>
            </dd>

            <dt>Duration</dt>
            <dd data-testid="trip-detail-duration">
              {nightsBetween(state.trip.departureDate, state.trip.arrivalDate)} nights
            </dd>

            <dt className="summary-total-row">Price per traveler</dt>
            <dd className="summary-total-row" data-testid="trip-detail-price">
              {formatMoney(state.trip.pricePerPerson, state.trip.currency)}
            </dd>
          </dl>

          <div className="button-row">
            <Link to="/" className="btn btn-secondary" data-testid="back-to-trips-btn">
              Back to trips
            </Link>
            <Link to={`/trips/${state.trip.id}/book`} className="btn btn-primary" data-testid="book-trip-btn">
              Book this trip
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}
