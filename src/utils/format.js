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
