import { useI18n } from '../contexts/I18nContext';
import { Locale } from '../common/i18n';

export default function LanguageSelector() {
  const { locale, setLocale } = useI18n();

  const languages: { code: Locale; label: string }[] = [
    { code: 'ja', label: '日本語' },
    { code: 'en', label: 'EN' },
  ];

  return (
    <div className="relative inline-flex items-center">
      <svg className="w-4 h-4 text-content-muted mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
      </svg>
      <select
        value={locale}
        onChange={(e) => setLocale(e.target.value as Locale)}
        className="appearance-none bg-transparent text-sm text-content-secondary cursor-pointer hover:text-content-primary focus:outline-none focus:text-accent pr-5 py-1"
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code} className="text-content-primary bg-surface-primary">
            {lang.label}
          </option>
        ))}
      </select>
      <svg className="w-3.5 h-3.5 text-content-muted absolute right-0 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  );
}
