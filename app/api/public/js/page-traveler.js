(function () {
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const PHONE_RE = /^[+\d][\d\s\-()]{6,}$/;

  const draft = window.RoamState.getDraft();
  if (!draft || !draft.destinationId) {
    window.location.href = "/index.html";
    return;
  }

  const form = document.getElementById("traveler-info-form");
  const firstNameInput = document.getElementById("first-name");
  const lastNameInput = document.getElementById("last-name");
  const phoneInput = document.getElementById("phone");
  const emailInput = document.getElementById("email");
  const formErrorEl = document.getElementById("traveler-form-error");
  const backBtn = document.getElementById("back-to-trip-btn");

  const fieldErrorEls = {
    firstName: document.getElementById("first-name-error"),
    lastName: document.getElementById("last-name-error"),
    phone: document.getElementById("phone-error"),
    email: document.getElementById("email-error"),
  };

  if (draft.traveler) {
    firstNameInput.value = draft.traveler.firstName || "";
    lastNameInput.value = draft.traveler.lastName || "";
    phoneInput.value = draft.traveler.phone || "";
    emailInput.value = draft.traveler.email || "";
  }

  function clearErrors() {
    formErrorEl.classList.remove("is-visible");
    formErrorEl.textContent = "";
    Object.values(fieldErrorEls).forEach((el) => (el.textContent = ""));
  }

  function setFieldError(field, message) {
    if (fieldErrorEls[field]) fieldErrorEls[field].textContent = message;
  }

  function validate() {
    clearErrors();
    let valid = true;

    if (!firstNameInput.value.trim()) {
      setFieldError("firstName", "First name is required");
      valid = false;
    }
    if (!lastNameInput.value.trim()) {
      setFieldError("lastName", "Last name is required");
      valid = false;
    }
    if (!phoneInput.value.trim() || !PHONE_RE.test(phoneInput.value.trim())) {
      setFieldError("phone", "Enter a valid phone number");
      valid = false;
    }
    if (!emailInput.value.trim() || !EMAIL_RE.test(emailInput.value.trim())) {
      setFieldError("email", "Enter a valid email address");
      valid = false;
    }

    if (!valid) {
      formErrorEl.textContent = "Please fix the highlighted fields before continuing.";
      formErrorEl.classList.add("is-visible");
    }

    return valid;
  }

  backBtn.addEventListener("click", () => {
    window.location.href = "/index.html";
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!validate()) return;

    window.RoamState.saveDraft({
      traveler: {
        firstName: firstNameInput.value.trim(),
        lastName: lastNameInput.value.trim(),
        phone: phoneInput.value.trim(),
        email: emailInput.value.trim(),
      },
    });

    window.location.href = "/review.html";
  });
})();
