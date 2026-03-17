import { LANG_KEY, translations } from "./translations.js";

let currentLang = localStorage.getItem(LANG_KEY) || 'it';

export const getCurrentLang = () => currentLang;
export const setCurrentLang = (lang) => {
    currentLang = lang;
};

export const t = (key) => {
    const parts = key.split('.');
    let v = translations[currentLang];
    for (const p of parts) v = v?.[p];
    return v != null ? v : key;
};
