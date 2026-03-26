export const formatDate = (value, locale = 'en-US') =>
  new Date(value).toLocaleDateString(locale);

export const formatDateTime = (value, locale = 'en-US') =>
  new Date(value).toLocaleString(locale);

export const formatNumber = (value, locale = 'en-US') =>
  new Intl.NumberFormat(locale).format(value);

export const toSafeDate = (value) => {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value?.toDate === 'function') {
    const d = value.toDate();
    return d instanceof Date && !Number.isNaN(d.getTime()) ? d : null;
  }
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

export const toYYYYMMDD = (value) => {
  const safe = toSafeDate(value);
  if (!safe) return '';
  const y = safe.getFullYear();
  const m = String(safe.getMonth() + 1).padStart(2, '0');
  const day = String(safe.getDate()).padStart(2, '0');
  return y + '-' + m + '-' + day;
};

export const formatRelativeTime = (value, currentLang) => {
  const dt = value?.toDate ? value.toDate() : (value ? new Date(value) : null);
  if (!dt || Number.isNaN(dt.getTime())) return '-';
  const diffSec = Math.max(0, Math.floor((Date.now() - dt.getTime()) / 1000));
  if (diffSec < 60) return currentLang === 'it' ? 'ora' : 'now';
  const mins = Math.floor(diffSec / 60);
  if (mins < 60) return currentLang === 'it' ? `${mins}m fa` : `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return currentLang === 'it' ? `${hours}h fa` : `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return currentLang === 'it' ? `${days}g fa` : `${days}d ago`;
};


export const formatPersonName = (value) => {
  const raw = String(value || '').trim().replace(/\s+/g, ' ');
  if (!raw) return '';
  return raw
    .split(' ')
    .map(part => part ? (part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()) : '')
    .join(' ')
    .trim();
};

export const formatKpiNumber = (v, suffix = '') => {
  const n = Number(v);
  if (!Number.isFinite(n)) return `0${suffix}`;
  return `${n.toLocaleString('it-IT', { maximumFractionDigits: 2 })}${suffix}`;
};

export const sanitizeSocialCount = (value) => {
  return Math.max(0, Number(value || 0));
};

export const getMillisFromAny = (value) => {
  if (!value) return 0;
  if (typeof value?.toMillis === 'function') return value.toMillis();
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const t = Date.parse(value);
    return Number.isFinite(t) ? t : 0;
  }
  return 0;
};

export const getMonthKeyFromDateValue = (value) => {
  const d = toSafeDate(value);
  if (!d) return '';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};
