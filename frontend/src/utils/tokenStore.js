export const tokenStore = {
  get: () => localStorage.getItem("swm_token"),
  set: (value) => localStorage.setItem("swm_token", value),
  remove: () => localStorage.removeItem("swm_token"),
};
