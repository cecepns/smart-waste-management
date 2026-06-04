import axios from "axios";

/** Basis URL untuk path statis (upload), tanpa sufiks /api. Jangan pakai .replace("/api","") — itu mengenai /api di dalam hostname (api-inventory → rusak). */
export const apiBase = (
  import.meta.env.VITE_API_URL || "https://api.kingcreativestudio.my.id/smart-waste-management/api"
).replace(/\/api\/?$/, "");

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "https://api.kingcreativestudio.my.id/smart-waste-management/api",
});
