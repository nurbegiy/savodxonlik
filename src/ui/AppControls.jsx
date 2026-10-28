import { useTranslation } from 'react-i18next';
import { Sun, Moon, Languages } from 'lucide-react';
import { SUPPORTED, LANG_LABELS, setLanguage } from '../i18n/index.js';
import { useTheme } from '../theme/ThemeProvider.jsx';

export function LanguageSelect() {
  const { t, i18n } = useTranslation();
  return (
    <label className="ctl ctl--lang">
      <Languages size={16} aria-hidden="true" />
      <span className="visually-hidden">{t('common.language')}</span>
      <select value={i18n.language} onChange={(e) => setLanguage(e.target.value)} aria-label={t('common.language')}>
        {SUPPORTED.map((l) => <option key={l} value={l}>{LANG_LABELS[l]}</option>)}
      </select>
    </label>
  );
}

export function ThemeToggle() {
  const { t } = useTranslation();
  const { theme, toggle } = useTheme();
  const next = theme === 'dark' ? t('common.themeLight') : t('common.themeDark');
  return (
    <button type="button" className="btn btn--ghost btn--sm ctl-icon" onClick={toggle} aria-label={next} title={next}>
      {theme === 'dark' ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
    </button>
  );
}
