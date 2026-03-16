export const formatDate = (value, locale = 'en-US') =>
  new Date(value).toLocaleDateString(locale);

export const formatDateTime = (value, locale = 'en-US') =>
  new Date(value).toLocaleString(locale);

export const formatNumber = (value, locale = 'en-US') =>
  new Intl.NumberFormat(locale).format(value);


export const toYYYYMMDD = (value, toSafeDate) => {
  const safe = toSafeDate(value);
  if (!safe) return '';
  const y = safe.getFullYear();
  const m = String(safe.getMonth() + 1).padStart(2, '0');
  const day = String(safe.getDate()).padStart(2, '0');
  return y + '-' + m + '-' + day;
};
