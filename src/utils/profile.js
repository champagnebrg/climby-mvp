import { formatDate } from "./format.js";

export function formatProfileDate(v, toSafeDate, currentLang) {
    if (!v) return '';
    const d = toSafeDate(v);
    if (!d) return String(v || '');
    return formatDate(d, currentLang === 'it' ? 'it-IT' : 'en-US');
}
