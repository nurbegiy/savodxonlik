import { Send, ArrowUpRight } from 'lucide-react';
import { CONTACT } from '../config/contact.js';

function InstagramGlyph({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

// Two outbound buttons. Links open in a new tab and never leak the opener.
export default function ContactLinks({ className = '' }) {
  return (
    <div className={`contact ${className}`}>
      <a className="contact__btn" href={CONTACT.telegram.url} target="_blank" rel="noopener noreferrer">
        <Send size={20} aria-hidden="true" />
        <span className="contact__txt"><b>Telegram</b><small>{CONTACT.telegram.handle}</small></span>
        <ArrowUpRight size={16} aria-hidden="true" className="contact__go" />
      </a>
      <a className="contact__btn" href={CONTACT.instagram.url} target="_blank" rel="noopener noreferrer">
        <InstagramGlyph />
        <span className="contact__txt"><b>Instagram</b><small>{CONTACT.instagram.handle}</small></span>
        <ArrowUpRight size={16} aria-hidden="true" className="contact__go" />
      </a>
    </div>
  );
}
