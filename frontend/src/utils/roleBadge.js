export const roleBadge = (role) => {
  if (role === "admin") {
    return "rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700";
  }
  if (role === "pengawas") {
    return "rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-700";
  }
  if (role === "armada") {
    return "rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-700";
  }
  return "rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700";
};
