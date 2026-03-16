export const normalizeText = (value) => String(value ?? '').trim();

export const normalizeUsername = (value) =>
  normalizeText(value).toLowerCase().replace(/\s+/g, '');

export const numberOrNull = (value) => {
  const number = Number(value);
  return Number.isNaN(number) ? null : number;
};
