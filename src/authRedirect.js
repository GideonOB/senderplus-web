// Only operational routes may be destinations after authentication. Keeping auth
// pages out of this list also prevents returning to login or confirmation loops.
const DESTINATIONS = new Set([
  "/home",
  "/submit",
  "/submit-success",
  "/track",
  "/profile",
  "/support",
]);

export const getSafeNextPath = (next) => {
  if (typeof next !== "string" || !next.startsWith("/") || next.startsWith("//")) {
    return "/home";
  }

  // Reject browser URL normalization tricks before examining the pathname.
  if (next.includes("\\") || [...next].some((char) => char.charCodeAt(0) <= 32 || char.charCodeAt(0) === 127)) {
    return "/home";
  }

  const pathname = next.split(/[?#]/, 1)[0];
  return DESTINATIONS.has(pathname) ? next : "/home";
};
