"use client";

import { useEffect, useState } from "react";
import { I18nextProvider } from "react-i18next";
import i18n from "./i18n";

export function I18nProvider({ children }: { children: React.ReactNode }) {
  // Children wait for the saved language, so they never flash the default one.
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const savedLang = localStorage.getItem("app_lang") || "it";
    document.documentElement.lang = savedLang;

    const applied = i18n.language === savedLang ? Promise.resolve() : i18n.changeLanguage(savedLang);
    applied.finally(() => {
      if (!cancelled) setReady(true);
    });

    const handleLanguageChange = (lng: string) => {
      localStorage.setItem("app_lang", lng);
      document.documentElement.lang = lng;
    };

    i18n.on("languageChanged", handleLanguageChange);
    return () => {
      cancelled = true;
      i18n.off("languageChanged", handleLanguageChange);
    };
  }, []);

  if (!ready) {
    return null;
  }

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
