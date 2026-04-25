const { hairlineWidth } = require('nativewind/theme');

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        cream: {
          50:  "#FDFDFC",
          100: "#FAF8F3",
          200: "#F3F0E6",
          300: "#EEEBDA",   // ← primary cream
          400: "#E1DDC3",
          500: "#D0CAAA",
          600: "#BCB48E",
        },
        blue: {
          50:  "#EAEBF0",
          100: "#CED0DE",
          200: "#ADB1C9",
          300: "#898FB2",
          400: "#686F9A",
          500: "#484F81",
          600: "#282B4A",   // ← primary blue
        },
        border: '#383B5C',
        input: '#383B5C',
        ring: '#EEEBDA',
        background: '#282B4A',
        foreground: '#EEEBDA',
        primary: {
          DEFAULT: '#EEEBDA',
          foreground: '#282B4A',
        },
        secondary: {
          DEFAULT: '#383B5C',
          foreground: '#EEEBDA',
        },
        destructive: {
          DEFAULT: '#ef4444',
          foreground: '#ffffff',
        },
        muted: {
          DEFAULT: '#383B5C',
          foreground: '#B8B4A2',
        },
        accent: {
          DEFAULT: '#383B5C',
          foreground: '#EEEBDA',
        },
        popover: {
          DEFAULT: '#383B5C',
          foreground: '#EEEBDA',
        },
        card: {
          DEFAULT: '#383B5C',
          foreground: '#EEEBDA',
        },
      },
      fontFamily: {
        sans: ["Outfit_400Regular"],
        outfit: ["Outfit_400Regular"],
        "outfit-medium": ["Outfit_500Medium"],
        "outfit-semibold": ["Outfit_600SemiBold"],
        "outfit-bold": ["Outfit_700Bold"],
        "outfit-extrabold": ["Outfit_800ExtraBold"],
        fancy: ["PlayfairDisplay_700Bold_Italic"],
      },
      borderRadius: {
        "2xl": "16px",
        "3xl": "24px",
        "4xl": "32px",
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      borderWidth: {
        hairline: hairlineWidth(),
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  future: {
    hoverOnlyWhenSupported: true,
  },
  plugins: [require('tailwindcss-animate')],
};
