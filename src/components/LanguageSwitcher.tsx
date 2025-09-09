'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';

const languages = [
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'zh', name: '中文', flag: '🇨🇳' }
];

export default function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();

  const switchLanguage = (newLocale: string) => {
    // Remove the current locale from the pathname
    const pathWithoutLocale = pathname.replace(`/${locale}`, '') || '/';
    // Navigate to the new locale
    router.push(`/${newLocale}${pathWithoutLocale}`);
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-600 mr-2">Language:</span>
      {languages.map((lang) => (
        <button
          key={lang.code}
          onClick={() => switchLanguage(lang.code)}
          className={`px-3 py-1 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
            locale === lang.code
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          aria-pressed={locale === lang.code}
          aria-label={`Switch to ${lang.name}`}
        >
          <span className="mr-1">{lang.flag}</span>
          {lang.name}
        </button>
      ))}
    </div>
  );
}
