(function () {
  const form = document.getElementById("trip-search-form");
  const departureSelect = document.getElementById("departure-country");
  const arrivalSelect = document.getElementById("arrival-country");
  const departureDateInput = document.getElementById("departure-date");
  const arrivalDateInput = document.getElementById("arrival-date");
  const adultsInput = document.getElementById("adults-count");
  const childrenInput = document.getElementById("children-count");
  const formErrorEl = document.getElementById("trip-form-error");
  const pricePreview = document.getElementById("trip-price-preview");
  const pricePerPersonEl = document.getElementById("price-preview-per-person");
  const priceTotalEl = document.getElementById("price-preview-total");

  const fieldErrorEls = {
    departureCountry: document.getElementById("departure-country-error"),
    arrivalCountry: document.getElementById("arrival-country-error"),
    departureDate: document.getElementById("departure-date-error"),
    arrivalDate: document.getElementById("arrival-date-error"),
    adults: document.getElementById("adults-error"),
    children: document.getElementById("children-error"),
  };

  const MAX_PER_TYPE = 10;
  let trips = [];

  function todayLocal() {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  }

  function clearErrors() {
    formErrorEl.classList.remove("is-visible");
    formErrorEl.textContent = "";
    Object.values(fieldErrorEls).forEach((el) => (el.textContent = ""));
  }

  function setFieldError(field, message) {
    if (fieldErrorEls[field]) fieldErrorEls[field].textContent = message;
  }

  function currentDestination() {
    return trips.find((t) => t.id === arrivalSelect.value);
  }

  function formatMoney(amount, currency) {
    return `${currency} ${amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
  }

  function updatePricePreview() {
    const destination = currentDestination();
    const adults = parseInt(adultsInput.value, 10) || 0;
    const children = parseInt(childrenInput.value, 10) || 0;

    if (!destination || adults + children === 0) {
      pricePreview.classList.add("hidden");
      return;
    }

    const total = destination.pricePerPerson * (adults + children);
    pricePerPersonEl.textContent = formatMoney(destination.pricePerPerson, destination.currency);
    priceTotalEl.textContent = formatMoney(total, destination.currency);
    pricePreview.classList.remove("hidden");
  }

  async function loadTrips() {
    trips = await window.RoamApi.getTrips();
    [departureSelect, arrivalSelect].forEach((select) => {
      trips.forEach((trip) => {
        const option = document.createElement("option");
        option.value = trip.id;
        option.textContent = trip.country;
        option.dataset.testid = `country-option-${trip.id}`;
        select.appendChild(option);
      });
    });
    restoreDraft();
  }

  function restoreDraft() {
    const draft = window.RoamState.getDraft();
    if (!draft) return;
    if (draft.departureCountryId) departureSelect.value = draft.departureCountryId;
    if (draft.destinationId) arrivalSelect.value = draft.destinationId;
    if (draft.departureDate) departureDateInput.value = draft.departureDate;
    if (draft.arrivalDate) arrivalDateInput.value = draft.arrivalDate;
    if (draft.adults) adultsInput.value = draft.adults;
    if (draft.children !== undefined) childrenInput.value = draft.children;
    updatePricePreview();
  }

  function validate() {
    clearErrors();
    let valid = true;
    const errors = [];

    if (!departureSelect.value) {
      setFieldError("departureCountry", "Select a departure country");
      valid = false;
    }
    if (!arrivalSelect.value) {
      setFieldError("arrivalCountry", "Select an arrival country");
      valid = false;
    }
    if (departureSelect.value && arrivalSelect.value && departureSelect.value === arrivalSelect.value) {
      setFieldError("arrivalCountry", "Arrival country must differ from departure country");
      valid = false;
    }
    if (!departureDateInput.value) {
      setFieldError("departureDate", "Select a departure date");
      valid = false;
    } else if (departureDateInput.value < todayLocal()) {
      setFieldError("departureDate", "Departure date cannot be in the past");
      valid = false;
    }
    if (!arrivalDateInput.value) {
      setFieldError("arrivalDate", "Select a return date");
      valid = false;
    }
    if (
      departureDateInput.value &&
      arrivalDateInput.value &&
      new Date(arrivalDateInput.value) < new Date(departureDateInput.value)
    ) {
      setFieldError("arrivalDate", "Return date must be on or after departure date");
      valid = false;
    }
    const adults = parseInt(adultsInput.value, 10);
    if (!Number.isInteger(adults) || adults < 1 || adults > MAX_PER_TYPE) {
      setFieldError("adults", `Adults must be between 1 and ${MAX_PER_TYPE}`);
      valid = false;
    }
    const children = parseInt(childrenInput.value, 10);
    if (!Number.isInteger(children) || children < 0 || children > MAX_PER_TYPE) {
      setFieldError("children", `Children must be between 0 and ${MAX_PER_TYPE}`);
      valid = false;
    }

    if (!valid) {
      formErrorEl.textContent = "Please fix the highlighted fields before continuing.";
      formErrorEl.classList.add("is-visible");
    }

    return valid;
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!validate()) return;

    const destination = currentDestination();
    const departureCountryOption = trips.find((t) => t.id === departureSelect.value);

    window.RoamState.saveDraft({
      departureCountryId: departureSelect.value,
      departureCountry: departureCountryOption.country,
      destinationId: destination.id,
      destinationCountry: destination.country,
      pricePerPerson: destination.pricePerPerson,
      currency: destination.currency,
      departureDate: departureDateInput.value,
      arrivalDate: arrivalDateInput.value,
      adults: parseInt(adultsInput.value, 10),
      children: parseInt(childrenInput.value, 10),
    });

    window.location.href = "/traveler-info.html";
  });

  [arrivalSelect, adultsInput, childrenInput].forEach((el) =>
    el.addEventListener("input", updatePricePreview),
  );
  arrivalSelect.addEventListener("change", updatePricePreview);

  loadTrips();
})();
