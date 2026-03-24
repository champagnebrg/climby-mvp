import { firebaseConfig as firebaseConfigDev } from "./firebase.dev.js";
import { firebaseConfig as firebaseConfigProd } from "./firebase.prod.js";

const DEV_HOSTS = new Set([
  "localhost",
  "127.0.0.1",
  "climby-dev-1.web.app",
  "climby-dev-1.firebaseapp.com",
  "champagnebrg.github.io"
]);

const PROD_HOSTS = new Set([
  "climby-mvp-c61d7.web.app",
  "climby-mvp-c61d7.firebaseapp.com"
]);

const PROD_PLACEHOLDER_PREFIX = "__SET_PROD_";

function normalizeHostname(hostname) {
  return String(hostname ?? "").trim().toLowerCase().replace(/\.$/, "");
}

function hasProdPlaceholders(config) {
  return Object.values(config).some((value) =>
    typeof value === "string" && value.startsWith(PROD_PLACEHOLDER_PREFIX)
  );
}

function isDevHost(hostname) {
  return DEV_HOSTS.has(normalizeHostname(hostname));
}

function isProdHost(hostname) {
  return PROD_HOSTS.has(normalizeHostname(hostname));
}

export function getFirebaseConfigForHost(hostname = window.location.hostname) {
  const normalizedHostname = normalizeHostname(hostname);

  if (isDevHost(normalizedHostname)) {
    return firebaseConfigDev;
  }

  if (isProdHost(normalizedHostname)) {
    if (hasProdPlaceholders(firebaseConfigProd)) {
      throw new Error("Firebase prod config non impostata: aggiorna src/config/firebase.prod.js");
    }

    return firebaseConfigProd;
  }

  throw new Error(
    `Host non riconosciuto (${normalizedHostname}): aggiorna DEV_HOSTS/PROD_HOSTS in src/config/firebase.js`
  );
}

export const firebaseConfig = getFirebaseConfigForHost();
