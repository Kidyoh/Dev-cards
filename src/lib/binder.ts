// The binder is a per-browser collection of cards (no database). Wrapped in try/catch because
// storage can be unavailable (private mode, blocked site data).
const KEY = "specsheet:binder";

export function readBinder(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function write(list: string[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* ignore */
  }
}

export function inBinder(login: string) {
  return readBinder().includes(login.toLowerCase());
}

export function addToBinder(login: string) {
  const l = login.toLowerCase();
  const list = readBinder().filter((x) => x !== l);
  write([l, ...list]);
}

export function removeFromBinder(login: string) {
  write(readBinder().filter((x) => x !== login.toLowerCase()));
}
