import { useEffect, useState } from "react";
import { Link } from "react-router";
import { ApiError, getTrip, Trip } from "./api";

export type TripState =
  | { status: "loading" }
  | { status: "ready"; trip: Trip }
  | { status: "not-found" }
  | { status: "error"; message: string };

export function useTrip(tripId: string): TripState {
  const [state, setState] = useState<TripState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    setState({ status: "loading" });
    getTrip(tripId)
      .then((trip) => {
        if (!cancelled) setState({ status: "ready", trip });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        // 400 means a malformed id, which is just as "not found" to a visitor.
        if (err instanceof ApiError && (err.status === 404 || err.status === 400)) {
          setState({ status: "not-found" });
        } else {
          setState({ status: "error", message: err instanceof Error ? err.message : "Something went wrong" });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [tripId]);

  return state;
}

export function TripFallback({ state }: { state: Exclude<TripState, { status: "ready" }> }) {
  if (state.status === "loading") {
    return (
      <p className="status-message" data-testid="trip-loading" aria-busy="true">
        Loading trip...
      </p>
    );
  }
  if (state.status === "not-found") {
    return (
      <div className="card" data-testid="trip-not-found">
        <h2>Trip not found</h2>
        <p>This trip doesn't exist or is no longer available.</p>
        <Link to="/" className="btn btn-secondary" data-testid="back-to-trips-btn">
          Back to trips
        </Link>
      </div>
    );
  }
  return (
    <div className="form-error-summary" data-testid="trip-error" role="alert">
      Could not load the trip: {state.message}
    </div>
  );
}
