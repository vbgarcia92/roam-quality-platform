import { ChangeEvent, FormEvent, ReactNode, useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { ApiError, Booking, createBooking, Trip } from "../api";
import { COUNTRIES } from "../countries";
import { formatDate, formatMoney } from "../format";
import { TripFallback, useTrip } from "../useTrip";

// Kept in step with the API's POST /bookings rules.
const MAX_PER_TYPE = 10;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[+\d][\d\s\-()]{6,}$/;

interface FormValues {
  departureCountry: string;
  adults: string;
  children: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
}

type FieldErrors = Partial<Record<keyof FormValues, string>>;

const INITIAL_VALUES: FormValues = {
  departureCountry: "",
  adults: "1",
  children: "0",
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
};

function parseCount(value: string): number | null {
  return /^\d+$/.test(value.trim()) ? Number(value) : null;
}

function validate(values: FormValues): FieldErrors {
  const errors: FieldErrors = {};
  if (!values.departureCountry) errors.departureCountry = "Select a departure country";

  const adults = parseCount(values.adults);
  if (adults === null || adults < 1 || adults > MAX_PER_TYPE) {
    errors.adults = `Adults must be between 1 and ${MAX_PER_TYPE}`;
  }
  const children = parseCount(values.children);
  if (children === null || children > MAX_PER_TYPE) {
    errors.children = `Children must be between 0 and ${MAX_PER_TYPE}`;
  }

  if (!values.firstName.trim()) errors.firstName = "First name is required";
  if (!values.lastName.trim()) errors.lastName = "Last name is required";
  if (!PHONE_RE.test(values.phone.trim())) errors.phone = "Enter a valid phone number";
  if (!EMAIL_RE.test(values.email.trim())) errors.email = "Enter a valid email address";
  return errors;
}

export function BookingForm() {
  const { tripId = "" } = useParams();
  const state = useTrip(tripId);
  const [booking, setBooking] = useState<Booking | null>(null);

  useEffect(() => {
    document.title = booking ? "Booking confirmed - Roam Trip Booking" : "Book trip - Roam Trip Booking";
  }, [booking]);

  return (
    <section data-testid="page-booking-form">
      {state.status !== "ready" ? (
        <TripFallback state={state} />
      ) : booking ? (
        <Confirmation booking={booking} />
      ) : (
        <BookingFormBody trip={state.trip} onBooked={setBooking} />
      )}
    </section>
  );
}

function Field({ id, label, error, children }: { id: string; label: string; error?: string; children: ReactNode }) {
  return (
    <div className="form-field">
      <label htmlFor={id}>{label}</label>
      {children}
      <span className="field-error" id={`${id}-error`} data-testid={`${id}-error`}>
        {error}
      </span>
    </div>
  );
}

function BookingFormBody({ trip, onBooked }: { trip: Trip; onBooked: (booking: Booking) => void }) {
  const [values, setValues] = useState<FormValues>(INITIAL_VALUES);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState<ApiError | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const update = (field: keyof FormValues) => (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setValues((current) => ({ ...current, [field]: event.target.value }));
    // A field's error is stale once the user edits it; full re-validation
    // happens on submit.
    setErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const inputProps = (field: keyof FormValues, id: string) => ({
    id,
    value: values[field],
    onChange: update(field),
    "aria-invalid": errors[field] ? true : undefined,
    "aria-describedby": `${id}-error`,
  });

  const adults = parseCount(values.adults);
  const children = parseCount(values.children);
  const travelers = adults !== null && children !== null ? adults + children : null;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const found = validate(values);
    setErrors(found);
    setServerError(null);
    if (Object.keys(found).length > 0) return;

    setSubmitting(true);
    try {
      const booking = await createBooking({
        tripId: trip.id,
        departureCountry: values.departureCountry,
        adults: adults!,
        children: children!,
        traveler: {
          firstName: values.firstName.trim(),
          lastName: values.lastName.trim(),
          phone: values.phone.trim(),
          email: values.email.trim(),
        },
      });
      onBooked(booking);
    } catch (err) {
      setServerError(err instanceof ApiError ? err : new ApiError(0, "Could not reach the server"));
      setSubmitting(false);
    }
  }

  return (
    <div className="card">
      <h2>Book your trip</h2>

      <div className="trip-summary" data-testid="booking-trip-summary">
        <strong data-testid="booking-trip-country">{trip.country}</strong>
        <span data-testid="booking-trip-dates">
          <time dateTime={trip.departureDate}>{formatDate(trip.departureDate)}</time>
          {" - "}
          <time dateTime={trip.arrivalDate}>{formatDate(trip.arrivalDate)}</time>
        </span>
        <span data-testid="booking-trip-price">
          {formatMoney(trip.pricePerPerson, trip.currency)} per traveler
        </span>
      </div>

      {Object.keys(errors).length > 0 && (
        <div className="form-error-summary" data-testid="booking-form-error" role="alert">
          Please fix the highlighted fields before booking.
        </div>
      )}

      {serverError && (
        <div className="form-error-summary" data-testid="booking-server-error" role="alert">
          <p>{serverError.message}</p>
          {serverError.details.length > 0 && (
            <ul>
              {serverError.details.map((detail) => (
                <li key={detail}>{detail}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} data-testid="booking-form" noValidate>
        <Field id="departure-country" label="Departure country" error={errors.departureCountry}>
          <select {...inputProps("departureCountry", "departure-country")} data-testid="departure-country-select">
            <option value="" disabled>
              Select a country
            </option>
            {COUNTRIES.filter((country) => country !== trip.country).map((country) => (
              <option key={country} value={country}>
                {country}
              </option>
            ))}
          </select>
        </Field>

        <div className="form-row">
          <Field id="adults" label="Adults" error={errors.adults}>
            <input type="number" min={1} max={MAX_PER_TYPE} {...inputProps("adults", "adults")} data-testid="adults-input" />
          </Field>
          <Field id="children" label="Children" error={errors.children}>
            <input
              type="number"
              min={0}
              max={MAX_PER_TYPE}
              {...inputProps("children", "children")}
              data-testid="children-input"
            />
          </Field>
        </div>

        <div className="form-row">
          <Field id="first-name" label="First name" error={errors.firstName}>
            <input type="text" autoComplete="given-name" {...inputProps("firstName", "first-name")} data-testid="first-name-input" />
          </Field>
          <Field id="last-name" label="Last name" error={errors.lastName}>
            <input type="text" autoComplete="family-name" {...inputProps("lastName", "last-name")} data-testid="last-name-input" />
          </Field>
        </div>

        <Field id="phone" label="Phone" error={errors.phone}>
          <input type="tel" autoComplete="tel" {...inputProps("phone", "phone")} data-testid="phone-input" />
        </Field>

        <Field id="email" label="Email" error={errors.email}>
          <input type="email" autoComplete="email" {...inputProps("email", "email")} data-testid="email-input" />
        </Field>

        <div className="price-preview">
          Total for {travelers ?? "-"} traveler(s):{" "}
          <span className="price-preview-total" data-testid="booking-total-price">
            {travelers === null ? "-" : formatMoney(trip.pricePerPerson * travelers, trip.currency)}
          </span>
        </div>

        <div className="button-row">
          <Link to={`/trips/${trip.id}`} className="btn btn-secondary" data-testid="back-to-trip-btn">
            Back
          </Link>
          <button type="submit" className="btn btn-primary" disabled={submitting} data-testid="submit-booking-btn">
            {submitting ? "Booking..." : "Confirm booking"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Confirmation({ booking }: { booking: Booking }) {
  return (
    <div className="card confirmation-panel" data-testid="booking-confirmation">
      <div className="confirmation-icon" aria-hidden="true">
        ✓
      </div>
      <h2 className="confirmation-title" role="status" data-testid="booking-success-message">
        Booking confirmed!
      </h2>
      <p>
        Booking reference:{" "}
        <span className="booking-id" data-testid="confirmation-booking-id">
          {booking.id}
        </span>
      </p>

      <dl className="summary-list">
        <dt>Destination</dt>
        <dd data-testid="confirmation-destination">{booking.destinationCountry}</dd>

        <dt>Departing from</dt>
        <dd data-testid="confirmation-departure-country">{booking.departureCountry}</dd>

        <dt>Dates</dt>
        <dd data-testid="confirmation-dates">
          <time dateTime={booking.departureDate}>{formatDate(booking.departureDate)}</time>
          {" - "}
          <time dateTime={booking.arrivalDate}>{formatDate(booking.arrivalDate)}</time>
        </dd>

        <dt>Travelers</dt>
        <dd data-testid="confirmation-travelers">
          {booking.adults} adult(s), {booking.children} child(ren)
        </dd>

        <dt>Traveler name</dt>
        <dd data-testid="confirmation-traveler-name">
          {booking.travelerFirstName} {booking.travelerLastName}
        </dd>

        <dt className="summary-total-row">Total</dt>
        <dd className="summary-total-row" data-testid="confirmation-total-price">
          {formatMoney(booking.totalPrice, booking.currency)}
        </dd>
      </dl>

      <div className="button-row">
        <span />
        <Link to="/" className="btn btn-primary" data-testid="browse-more-trips-btn">
          Browse more trips
        </Link>
      </div>
    </div>
  );
}
