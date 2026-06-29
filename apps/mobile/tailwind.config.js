/**
 * Diydor dizayn tizimi — "Issiq editorial" (Hinge uslubi).
 * Yagona manba: dizayn <-> kod birligi.
 *
 * Falsafa: issiq krem yuzalar, boyitilgan terracotta, serif sarlavhalar
 * (Fraunces) + toza sans (Manrope). Tinch, ishonchli, premium his.
 * Token NOMLARI saqlangan (M3) — faqat qiymatlar issiq palitraga ko'chdi.
 */
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // ── Yuzalar (issiq krem qog'oz) ──
        background: '#FBF6F0',
        surface: '#FBF6F0',
        'surface-warm': '#FFFFFF',
        'surface-bright': '#FFFFFF',
        'surface-subtle': '#F1E9DF',
        'surface-dim': '#EDE3D7',
        'surface-variant': '#E7DCCE',
        'surface-tint': '#BE4A2E',
        'surface-container-lowest': '#FFFFFF',
        'surface-container-low': '#F8F1E9',
        'surface-container': '#F3EBE0',
        'surface-container-high': '#EDE4D8',
        'surface-container-highest': '#E7DCCE',
        // ── Matn / kontur ──
        'on-surface': '#2B2421',
        'on-background': '#2B2421',
        'on-surface-variant': '#786A60',
        outline: '#A4948A',
        'outline-variant': '#E0D3C5',
        'inverse-surface': '#393029',
        'inverse-on-surface': '#F6EDE3',
        'inverse-primary': '#F2B49B',
        // ── Primary (terracotta) ──
        primary: '#BE4A2E',
        'on-primary': '#FFFFFF',
        'primary-container': '#F7DAC9',
        'on-primary-container': '#5A1A0B',
        'primary-fixed': '#FBE4D7',
        'primary-fixed-dim': '#F2B49B',
        'on-primary-fixed': '#3D0E03',
        'on-primary-fixed-variant': '#8C2E18',
        'coral-deep': '#D6604A',
        // ── Secondary (issiq taupe) ──
        secondary: '#6F6056',
        'on-secondary': '#FFFFFF',
        'secondary-container': '#EEE1D5',
        'on-secondary-container': '#564A41',
        'secondary-fixed': '#ECE0D4',
        'secondary-fixed-dim': '#CFC0B2',
        'on-secondary-fixed': '#271C14',
        'on-secondary-fixed-variant': '#4E4239',
        // ── Tertiary (asal-oltin: super like / tasdiq) ──
        tertiary: '#B07A2B',
        'on-tertiary': '#FFFFFF',
        'tertiary-container': '#F5E2BE',
        'on-tertiary-container': '#3A2600',
        'tertiary-fixed': '#F5E2BE',
        'tertiary-fixed-dim': '#DCC089',
        'on-tertiary-fixed': '#261800',
        'on-tertiary-fixed-variant': '#6B5318',
        // ── Holat (status) ──
        success: '#4C9A6A',
        'success-container': '#E0F0E3',
        error: '#BA1A1A',
        'on-error': '#FFFFFF',
        'error-container': '#F7D9D4',
        'on-error-container': '#410002',
        // ── Maxsus ──
        'platinum-dark': '#121212',
      },
      borderRadius: {
        DEFAULT: '0.25rem',
        lg: '0.5rem',
        xl: '0.75rem',
        button: '16px',
        card: '24px',
        sheet: '28px',
        full: '9999px',
      },
      spacing: {
        gutter: '12px',
        'stack-sm': '8px',
        'stack-md': '16px',
        'stack-lg': '24px',
        'safe-bottom': '34px',
        'margin-main': '16px',
      },
      fontFamily: {
        // Serif sarlavhalar (his) vs toza sans (UI) — editorial ierarxiya
        sans: ['Manrope', 'system-ui', 'sans-serif'],
        display: ['Fraunces', 'Georgia', 'serif'],
        serif: ['Fraunces', 'Georgia', 'serif'],
        // Sarlavhalar -> serif
        'display-lg': ['Fraunces', 'Georgia', 'serif'],
        'headline-lg': ['Fraunces', 'Georgia', 'serif'],
        'headline-lg-mobile': ['Fraunces', 'Georgia', 'serif'],
        'headline-md': ['Fraunces', 'Georgia', 'serif'],
        // UI matni -> sans
        'title-md': ['Manrope'],
        'title-lg': ['Manrope'],
        'label-sm': ['Manrope'],
        'label-md': ['Manrope'],
        'label-lg': ['Manrope'],
        'label-caps': ['Manrope'],
        'body-lg': ['Manrope'],
        'body-md': ['Manrope'],
      },
      fontSize: {
        'label-sm': ['13px', { lineHeight: '18px', fontWeight: '500' }],
        'label-md': ['12px', { lineHeight: '16px', fontWeight: '500' }],
        'label-lg': ['14px', { lineHeight: '20px', fontWeight: '500' }],
        'label-caps': ['12px', { lineHeight: '16px', letterSpacing: '0.05em', fontWeight: '600' }],
        'title-md': ['16px', { lineHeight: '22px', fontWeight: '600' }],
        'title-lg': ['20px', { lineHeight: '26px', fontWeight: '600' }],
        // Serif sarlavhalar — yumshoqroq tracking, 600 vazn (Fraunces eng chiroyli)
        'display-lg': ['42px', { lineHeight: '46px', letterSpacing: '-0.015em', fontWeight: '600' }],
        'headline-lg': ['34px', { lineHeight: '40px', letterSpacing: '-0.01em', fontWeight: '600' }],
        'headline-lg-mobile': ['28px', { lineHeight: '34px', letterSpacing: '-0.005em', fontWeight: '600' }],
        'headline-md': ['22px', { lineHeight: '28px', fontWeight: '600' }],
        'body-lg': ['17px', { lineHeight: '22px', fontWeight: '400' }],
        'body-md': ['15px', { lineHeight: '20px', fontWeight: '400' }],
      },
      boxShadow: {
        ambient: '0 10px 30px rgba(90,45,25,0.10)',
        lift: '0 18px 44px rgba(90,45,25,0.16)',
        card: '0 4px 24px rgba(120,72,40,0.10)',
        warm: '0 10px 24px rgba(190,74,46,0.28)',
        glow: '0 0 40px rgba(76,154,106,0.40)',
      },
    },
  },
  plugins: [],
};
