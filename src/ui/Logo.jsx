// KursorApp mark: an orange mouse cursor on charcoal — the same pointer the guide uses to teach.
export function Logo({ size = 28, className }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <rect width="32" height="32" rx="8" fill="#1c1b1a" />
      <path d="M10 6.2v18.4l4.7-4.2 3 7 3.2-1.4-3-6.9 6.4-.1L10 6.2z" fill="#ff8a3d" stroke="#ff8a3d" strokeWidth="1" strokeLinejoin="round" />
    </svg>
  );
}

export function Wordmark({ className = '' }) {
  return <span className={`wordmark ${className}`}>Kursor<span>App</span></span>;
}
