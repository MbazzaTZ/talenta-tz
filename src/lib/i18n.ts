// Lightweight bilingual dictionary (English ↔ Swahili) used across the UI.
import * as React from 'react';

export type Lang = 'en' | 'sw';

const dict = {
  tagline: {
    en: "Tanzania's smarter job network",
    sw: 'Mtandao bora wa kazi Tanzania',
  },
  hero_title_1: {
    en: 'Find your next opportunity in',
    sw: 'Pata fursa yako mpya ya kazi',
  },
  hero_title_2: { en: 'Tanzania', sw: 'Tanzania' },
  hero_sub: {
    en: 'Thousands of jobs across Dar, Arusha, Mwanza, Dodoma and beyond — matched to your skills and region.',
    sw: 'Maelfu ya kazi Dar, Arusha, Mwanza, Dodoma na kwingineko — zinazolingana na ujuzi wako.',
  },
  search_title: {
    en: 'Job title, skill, or company',
    sw: 'Cheo, ujuzi, au kampuni',
  },
  search_location: { en: 'Location', sw: 'Mahali' },
  search_btn: { en: 'Search jobs', sw: 'Tafuta kazi' },
  browse_jobs: { en: 'Browse jobs', sw: 'Vinjari kazi' },
  post_job: { en: 'Post a job', sw: 'Weka tangazo' },
  sign_in: { en: 'Sign in', sw: 'Ingia' },
  sign_up: { en: 'Sign up', sw: 'Jisajili' },
  sign_out: { en: 'Sign out', sw: 'Toka' },
  dashboard: { en: 'Dashboard', sw: 'Dashibodi' },
  for_seekers: { en: 'For job seekers', sw: 'Kwa watafuta kazi' },
  for_employers: { en: 'For employers', sw: 'Kwa waajiri' },
  filters: { en: 'Filters', sw: 'Vichujio' },
  industry: { en: 'Industry', sw: 'Sekta' },
  region: { en: 'Region', sw: 'Mkoa' },
  level: { en: 'Position level', sw: 'Ngazi' },
  contract: { en: 'Contract type', sw: 'Aina ya mkataba' },
  qualification: { en: 'Qualification', sw: 'Sifa' },
  salary: { en: 'Salary range', sw: 'Mshahara' },
  clear: { en: 'Clear all', sw: 'Futa zote' },
  apply_now: { en: 'Apply now', sw: 'Omba sasa' },
  save: { en: 'Save', sw: 'Hifadhi' },
  saved: { en: 'Saved', sw: 'Imehifadhiwa' },
  about: { en: 'About', sw: 'Kuhusu' },
  contact: { en: 'Contact', sw: 'Wasiliana' },
};

type Key = keyof typeof dict;

const LangContext = React.createContext<{
  lang: Lang;
  setLang: (l: Lang) => void;
}>({
  lang: 'en',
  setLang: () => {},
});

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = React.useState<Lang>('en');
  React.useEffect(() => {
    const saved =
      typeof window !== 'undefined' ? (localStorage.getItem('kazi.lang') as Lang | null) : null;
    if (saved === 'en' || saved === 'sw') setLangState(saved);
  }, []);
  const setLang = React.useCallback((l: Lang) => {
    setLangState(l);
    if (typeof window !== 'undefined') localStorage.setItem('kazi.lang', l);
  }, []);
  return React.createElement(LangContext.Provider, { value: { lang, setLang } }, children);
}

export function useLang() {
  return React.useContext(LangContext);
}

export function useT() {
  const { lang } = useLang();
  return React.useCallback((k: Key) => dict[k][lang] ?? dict[k].en, [lang]);
}
