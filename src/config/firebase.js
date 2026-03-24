import { firebaseConfig as firebaseConfigDev } from "./firebase.dev.js";
import { firebaseConfig as firebaseConfigProd } from "./firebase.prod.js";

const DEV_HOSTS = new Set([
  "localhost",
  "127.0.0.1",
  "climby-dev-1.web.app",
  "climby-dev-1.firebaseapp.com",
  "champagnebrg.github.io"
]);

const PROD_PLACEHOLDER_PREFIX = "__SET_PROD_";

function hasProdPlaceholders(config) {
  return Object.values(config).some((value) =>
    typeof value === "string" && value.startsWith(PROD_PLACEHOLDER_PREFIX)
  );
}

function isDevHost(hostname) {
  return DEV_HOSTS.has(hostname);
}

export function getFirebaseConfigForHost(hostname = window.location.hostname) {
  if (isDevHost(hostname)) {
    return firebaseConfigDev;
  }

  if (hasProdPlaceholders(firebaseConfigProd)) {
    throw new Error("Firebase prod config non impostata: aggiorna src/config/firebase.prod.js");
  }

  return firebaseConfigProd;
}

export const firebaseConfig = getFirebaseConfigForHost();
