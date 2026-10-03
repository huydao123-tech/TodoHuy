"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { AppLanguage, Translations, translations } from "./translations";

const LOCALE_STORAGE_KEY = "user_selected_locale";

interface LanguageContextType {
  lang: AppLanguage;
  setLang: (lang: AppLanguage) => void;
  toggleLang: () => void;
  t: Translations;
  isVietnamese: boolean;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: "vi",
  setLang: () => {},
  toggleLang: () => {},
  t: translations.vi,
  isVietnamese: true,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<AppLanguage>("vi");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCALE_STORAGE_KEY);
      if (saved === "vi" || saved === "en") {
        setLangState(saved);
      }
    } catch {}
  }, []);

  const setLang = (newLang: AppLanguage) => {
    setLangState(newLang);
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, newLang);
    } catch {}
  };

  const toggleLang = () => {
    const next = lang === "vi" ? "en" : "vi";
    setLang(next);
  };

  const value: LanguageContextType = {
    lang,
    setLang,
    toggleLang,
    t: translations[lang],
    isVietnamese: lang === "vi",
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  return context;
}
