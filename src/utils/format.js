export const formatDate = (value, locale = 'en-US') =>
  new Date(value).toLocaleDateString(locale);

export const formatDateTime = (value, locale = 'en-US') =>
  new Date(value).toLocaleString(locale);

export const formatNumber = (value, locale = 'en-US') =>
  new Intl.NumberFormat(locale).format(value);
