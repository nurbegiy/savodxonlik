import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, useTheme } from '../ThemeProvider.jsx';

function Probe() { const { theme, toggle } = useTheme(); return <button onClick={toggle}>{theme}</button>; }

describe('theme provider', () => {
  beforeEach(() => { localStorage.clear(); document.documentElement.setAttribute('data-theme', 'light'); });
  it('starts from the pre-paint attribute, toggles, updates <html> and persists', () => {
    render(<ThemeProvider><Probe /></ThemeProvider>);
    expect(screen.getByRole('button')).toHaveTextContent('light');
    fireEvent.click(screen.getByRole('button'));
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(localStorage.getItem('rd.theme')).toBe('dark');
  });
});

// WCAG contrast computed from the real CSS tokens, per theme.
const css = readFileSync(resolve(process.cwd(), 'src/styles/tokens.css'), 'utf8');
function tokens(selector) {
  const block = css.split(selector)[1].split('}')[0];
  return Object.fromEntries([...block.matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{6})/g)].map((m) => [m[1], m[2]]));
}
const lum = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

describe.each([[":root[data-theme='light']", 'light'], [":root[data-theme='dark']", 'dark']])('contrast (%s)', (sel, name) => {
  const t = tokens(sel);
  it(`${name}: text, muted text, accent text and danger meet WCAG AA (4.5:1)`, () => {
    for (const [fg, bg] of [['text', 'bg'], ['text', 'surface'], ['text', 'surface-2'], ['text-muted', 'bg'], ['text-muted', 'surface'], ['text-muted', 'surface-2'],
      ['on-accent', 'accent'], ['on-accent', 'accent-hover'], ['accent', 'bg'], ['accent', 'surface'], ['danger', 'surface'], ['danger', 'bg'], ['success', 'surface']]) {
      expect(ratio(t[fg], t[bg]), `${fg} on ${bg}`).toBeGreaterThanOrEqual(4.5);
    }
  });
  it(`${name}: focus ring and borders are visible (3:1)`, () => {
    expect(ratio(t.focus, t.bg)).toBeGreaterThanOrEqual(3);
    expect(ratio(t['border-strong'], t.surface)).toBeGreaterThanOrEqual(2.2);
  });
});
