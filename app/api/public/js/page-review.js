(function () {
  const draft = window.RoamState.getDraft();
  if (!draft || !draft.destinationId || !draft.traveler) {
    window.location.href = "/index.html";
    return;
  }

  const formErrorEl = document.getElementById("review-form-error");
  const confirmBtn = document.getElementById("confirm-booking-btn");
  const backBtn = document.getElementById("back-to-traveler-btn");

  const totalPrice = draft.pricePerPerson * (draft.adults + draft.children);

  function formatMoney(amount) {
    return `${draft.currency} ${amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
  }

  document.getElementById("summary-destination").textContent = draft.destinationCountry;
  document.getElementById("summary-departure-country").textContent = draft.departureCountry;
  document.getElementById("summary-departure-date").textContent = draft.departureDate;
  document.getElementById("summary-arrival-date").textContent = draft.arrivalDate;
  document.getElementById("summary-adults").textContent = draft.adults;
  document.getElementById("summary-children").textContent = draft.children;
  document.getElementById("summary-traveler-name").textContent =
    `${draft.traveler.firstName} ${draft.traveler.lastName}`;
  document.getElementById("summary-traveler-phone").textContent = draft.traveler.phone;
  document.getElementById("summary-traveler-email").textContent = draft.traveler.email;
  document.getElementById("summary-price-per-person").textContent = formatMoney(draft.pricePerPerson);
  document.getElementById("summary-total-price").textContent = formatMoney(totalPrice);

  backBtn.addEventListener("click", () => {
    window.location.href = "/traveler-info.html";
  });

  confirmBtn.addEventListener("click", async () => {
    formErrorEl.classList.remove("is-visible");
    formErrorEl.textContent = "";
    confirmBtn.disabled = true;
    confirmBtn.textContent = "Booking...";

    try {
      const booking = await window.RoamApi.createBooking({
        destinationId: draft.destinationId,
        departureCountry: draft.departureCountry,
        departureDate: draft.departureDate,
        arrivalDate: draft.arrivalDate,
        adults: draft.adults,
        children: draft.children,
        traveler: draft.traveler,
      });

      window.RoamState.saveResult(booking);
      window.RoamState.clearDraft();
      window.location.href = "/confirmation.html";
    } catch (err) {
      const details = err.details && err.details.length ? ` (${err.details.join(", ")})` : "";
      formErrorEl.textContent = `${err.message}${details}`;
      formErrorEl.classList.add("is-visible");
      confirmBtn.disabled = false;
      confirmBtn.textContent = "Confirm booking";
    }
  });
})();
