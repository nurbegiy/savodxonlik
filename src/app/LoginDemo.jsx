import { useTranslation } from 'react-i18next';

// Decorative, CSS-only miniature of what the app does: a cursor glides to a folder,
// a ring appears, a tip explains, the step is checked off. Static under reduced motion.
export default function LoginDemo() {
  const { t } = useTranslation();
  return (
    <div className="demo" aria-hidden="true">
      <div className="demo__bar"><i /><i /><i /></div>
      <div className="demo__screen">
        <div className="demo__icon demo__icon--a"><b /><span>Hujjatlar</span></div>
        <div className="demo__icon demo__icon--b"><b /><span>Savat</span></div>
        <div className="demo__ring" />
        <div className="demo__tip">{t('login.demoTip')}</div>
        <svg className="demo__cursor" width="26" height="26" viewBox="0 0 32 32">
          <path d="M10 6.2v18.4l4.7-4.2 3 7 3.2-1.4-3-6.9 6.4-.1L10 6.2z" fill="#ff8a3d" stroke="#1c1b1a" strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
        <div className="demo__task"><span className="demo__check" /><span>{t('login.demoStep')}</span></div>
      </div>
    </div>
  );
}
