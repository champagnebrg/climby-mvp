export const normalizeText = (value) => String(value ?? '').trim();

export const normalizeUsername = (value) =>
  normalizeText(value)
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9_.-]/g, '');

export const usernameLower = (value) => normalizeUsername(value).toLowerCase();

export const normalizeNullableText = (value) => {
  const text = normalizeText(value);
  return text || null;
};

export const numberOrNull = (value) => {
  if (value == null || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};
