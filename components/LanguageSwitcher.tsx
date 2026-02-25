import React from 'react';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES } from '../i18n';

interface LanguageSwitcherProps {
  /** When set, the chosen language is persisted to the user profile (for emails). */
  currentUserId?: string | null;
  onLanguageChange?: (lang: string) => void | Promise<void>;
}

/** Normalize to a supported code (e.g. "en-US" -> "en"). */
function toSupportedCode(lng: string): string {
  const code = lng.toLowerCase().substring(0, 2);
  return SUPPORTED_LANGUAGES.includes(code) ? code : SUPPORTED_LANGUAGES[0];
}

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ currentUserId, onLanguageChange }) => {
  const { i18n } = useTranslation();
  const currentCode = toSupportedCode(i18n.language || 'en');
  const currentIndex = SUPPORTED_LANGUAGES.indexOf(currentCode);
  const nextCode = SUPPORTED_LANGUAGES[(currentIndex + 1) % SUPPORTED_LANGUAGES.length];

  const toggleLanguage = async () => {
    if (currentUserId && onLanguageChange) {
      await Promise.resolve(onLanguageChange(nextCode));
    }
    i18n.changeLanguage(nextCode);
  };

  const displayLabel = currentCode.toUpperCase();

  return (
    <button
      onClick={toggleLanguage}
      className="px-2 py-1 text-sm font-medium rounded-md text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
      aria-label="Switch language"
      title={`Switch language / ${nextCode.toUpperCase()}`}
    >
      {displayLabel}
    </button>
  );
};

export default LanguageSwitcher;
