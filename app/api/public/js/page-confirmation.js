(function () {
  const booking = window.RoamState.getResult();
  if (!booking) {
    window.location.href = "/index.html";
    return;
  }

  function formatMoney(amount, currency) {
    return `${currency} ${Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
  }

  document.getElementById("confirmation-booking-id").textContent = booking.id;
  document.getElementById("confirmation-destination").textContent = booking.destinationCountry;
  document.getElementById("confirmation-departure-country").textContent = booking.departureCountry;
  document.getElementById("confirmation-departure-date").textContent = booking.departureDate;
  document.getElementById("confirmation-arrival-date").textContent = booking.arrivalDate;
  document.getElementById("confirmation-travelers").textContent =
    `${booking.adults} adult(s), ${booking.children} child(ren)`;
  document.getElementById("confirmation-traveler-name").textContent =
    `${booking.travelerFirstName} ${booking.travelerLastName}`;
  document.getElementById("confirmation-total-price").textContent = formatMoney(
    booking.totalPrice,
    booking.currency,
  );

  document.getElementById("new-booking-btn").addEventListener("click", () => {
    window.RoamState.clearAll();
    window.location.href = "/index.html";
  });
})();
