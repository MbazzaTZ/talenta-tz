// Talentra domain constants — Tanzania-specific options used across filters & forms.

export const REGIONS = [
  // Mainland Tanzania — all 26 regions
  'Dar es Salaam',
  'Arusha',
  'Dodoma',
  'Geita',
  'Iringa',
  'Kagera',
  'Katavi',
  'Kigoma',
  'Kilimanjaro',
  'Lindi',
  'Manyara',
  'Mara',
  'Mbeya',
  'Morogoro',
  'Mtwara',
  'Mwanza',
  'Njombe',
  'Pwani',
  'Rukwa',
  'Ruvuma',
  'Shinyanga',
  'Simiyu',
  'Singida',
  'Songwe',
  'Tabora',
  'Tanga',
  // Zanzibar — 5 regions
  'Kaskazini Unguja',
  'Kusini Unguja',
  'Mjini Magharibi',
  'Kaskazini Pemba',
  'Kusini Pemba',
  // Other
  'Remote',
] as const;

export const INDUSTRIES: { en: string; sw: string; value: string }[] = [
  { value: 'hospitality', en: 'Tourism & Hospitality', sw: 'Hoteli na Utalii' },
  { value: 'agriculture', en: 'Agriculture', sw: 'Kilimo' },
  { value: 'healthcare', en: 'Healthcare', sw: 'Afya' },
  { value: 'education', en: 'Education', sw: 'Elimu' },
  { value: 'finance', en: 'Banking & Finance', sw: 'Fedha na Benki' },
  { value: 'telecom', en: 'Telecommunications', sw: 'Mawasiliano' },
  { value: 'construction', en: 'Construction', sw: 'Ujenzi' },
  { value: 'ict', en: 'Technology / ICT', sw: 'Teknolojia' },
  { value: 'mining', en: 'Mining', sw: 'Madini' },
  {
    value: 'ngo',
    en: 'NGO & Development',
    sw: 'Mashirika Yasiyo ya Kiserikali',
  },
  { value: 'government', en: 'Government', sw: 'Serikali' },
  { value: 'logistics', en: 'Transport & Logistics', sw: 'Usafirishaji' },
  { value: 'manufacturing', en: 'Manufacturing', sw: 'Viwanda' },
];

export const POSITION_LEVELS = [
  { value: 'intern', label: 'Intern' },
  { value: 'graduate_trainee', label: 'Graduate Trainee' },
  { value: 'entry', label: 'Entry Level' },
  { value: 'mid', label: 'Mid-Level' },
  { value: 'senior', label: 'Senior' },
  { value: 'manager', label: 'Manager' },
  { value: 'director', label: 'Director' },
  { value: 'executive', label: 'Executive' },
] as const;

export const CONTRACT_TYPES = [
  { value: 'permanent', label: 'Permanent' },
  { value: 'contract', label: 'Contract' },
  { value: 'temporary', label: 'Temporary' },
  { value: 'freelance', label: 'Freelance' },
  { value: 'internship', label: 'Internship' },
  { value: 'volunteer', label: 'Volunteer' },
  { value: 'consultancy', label: 'Consultancy' },
] as const;

export const QUALIFICATIONS = [
  { value: 'certificate', label: 'Certificate' },
  { value: 'diploma', label: 'Diploma' },
  { value: 'bachelors', label: "Bachelor's Degree" },
  { value: 'masters', label: "Master's" },
  { value: 'phd', label: 'PhD' },
  { value: 'professional', label: 'Professional Certification' },
] as const;

export const SALARY_BANDS = [
  { value: 'any', label: 'Any salary', min: 0, max: null },
  { value: 'neg', label: 'Negotiable', min: 0, max: null },
  { value: 'u500', label: 'Below TZS 500K', min: 0, max: 500_000 },
  { value: '500_1m', label: 'TZS 500K – 1M', min: 500_000, max: 1_000_000 },
  { value: '1m_3m', label: 'TZS 1M – 3M', min: 1_000_000, max: 3_000_000 },
  { value: '3m_5m', label: 'TZS 3M – 5M', min: 3_000_000, max: 5_000_000 },
  { value: '5m_10m', label: 'TZS 5M – 10M', min: 5_000_000, max: 10_000_000 },
  { value: '10m_plus', label: 'Above TZS 10M', min: 10_000_000, max: null },
] as const;

export function industryLabel(value: string | null | undefined, lang: 'en' | 'sw' = 'en') {
  const m = INDUSTRIES.find((i) => i.value === value);
  return m ? m[lang] : (value ?? '');
}

export function formatSalary(
  min?: number | null,
  max?: number | null,
  currency = 'TZS',
  negotiable?: boolean,
) {
  if (negotiable) return 'Negotiable';
  if (!min && !max) return 'Not disclosed';
  const fmt = (n: number) =>
    n >= 1_000_000
      ? `${(n / 1_000_000).toFixed(n % 1_000_000 ? 1 : 0)}M`
      : `${Math.round(n / 1000)}K`;
  if (min && max) return `${currency} ${fmt(min)} – ${fmt(max)}`;
  if (min) return `${currency} from ${fmt(min)}`;
  if (max) return `${currency} up to ${fmt(max)}`;
  return '';
}

export function timeAgo(date: string | Date) {
  const d = typeof date === 'string' ? new Date(date) : date;
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}
