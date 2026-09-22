// Booking-flow state is passed between screens (real page navigations) via
// sessionStorage, keeping each step's server contract limited to plain data.
const DRAFT_KEY = "roam:bookingDraft";
const RESULT_KEY = "roam:bookingResult";

window.RoamState = {
  getDraft() {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
  },

  saveDraft(partial) {
    const current = this.getDraft() || {};
    const next = { ...current, ...partial };
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(next));
    return next;
  },

  clearDraft() {
    sessionStorage.removeItem(DRAFT_KEY);
  },

  getResult() {
    const raw = sessionStorage.getItem(RESULT_KEY);
    return raw ? JSON.parse(raw) : null;
  },

  saveResult(booking) {
    sessionStorage.setItem(RESULT_KEY, JSON.stringify(booking));
  },

  clearResult() {
    sessionStorage.removeItem(RESULT_KEY);
  },

  clearAll() {
    this.clearDraft();
    this.clearResult();
  },
};
