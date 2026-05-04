export const apiErr = (err) =>
  err.response?.data?.message || err.response?.data?.error || err.message || "Terjadi kesalahan";
