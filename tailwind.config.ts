import type { Config } from 'tailwindcss';
import tailwindcssAnimate from 'tailwindcss-animate';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Calm academic teal + champagne gold on warm ink. Token names are
        // preserved so every screen inherits the refreshed identity — values moved.
        royal: {
          black: '#0a0c07',
          coal: '#10130a',
          ash: '#1a1e10',
          border: '#262c15',
          gold: '#c8a24b',
          amber: '#b8892f',
          honey: '#d4ad58',
          crimson: '#c84a5a',
          blood: '#8f2d3a',
          cream: '#f7f4e8',
          ivory: '#fbf9f1',
          muted: '#98a383',
        },
        brand: {
          DEFAULT: '#2c8f84',
          50: '#f1faf8',
          100: '#dff3f0',
          200: '#bfe7e2',
          300: '#8fd6cf',
          400: '#4db8ae',
          500: '#2c8f84',
          600: '#22736c',
          700: '#1d5f5a',
          800: '#194e4a',
          900: '#14403d',
        },
        gold: {
          DEFAULT: '#c8a24b',
          50: '#fdf9ee',
          100: '#f8f0d6',
          200: '#f0e0a9',
          300: '#e6cb78',
          400: '#d8b45a',
          500: '#c8a24b',
          600: '#aa8137',
          700: '#88632c',
          800: '#6d4f28',
          900: '#5a4223',
        },
        ink: {
          DEFAULT: '#131808',
          50: '#f6f9ef',
          100: '#e9f1dc',
          200: '#cfe0b8',
          300: '#a9c48a',
          400: '#7aa15c',
          500: '#577d3f',
          600: '#43632f',
          700: '#385429',
          800: '#2e4524',
          850: '#253a1e',
          900: '#1c2c18',
          950: '#101608',
        },
        mint: {
          50: '#f1faf8',
          100: '#dff3f0',
          200: '#bfe7e2',
          300: '#8fd6cf',
          400: '#4db8ae',
          500: '#2c8f84',
          600: '#22736c',
          700: '#1d5f5a',
          800: '#194e4a',
          900: '#14403d',
        },
        sapphire: {
          DEFAULT: '#4c6397',
          50: '#f4f6fb',
          100: '#e7ebf5',
          200: '#cdd7ec',
          300: '#a3b3d9',
          400: '#6d81ae',
          500: '#4c6397',
          600: '#3c4f7a',
          700: '#30405f',
          800: '#28344c',
          900: '#202a3e',
        },
        ember: {
          300: '#e58a98',
          400: '#d96576',
          500: '#c84a5a',
          600: '#a63748',
          700: '#832b39',
          800: '#64232e',
        },
        sand: '#131808',
        cream: '#fbfdf6',
      },
      fontFamily: {
        sans: ['var(--font-cairo)', 'system-ui', 'sans-serif'],
        display: ['var(--font-cairo)', 'system-ui', 'sans-serif'],
        latin: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        gold: '0 18px 45px -18px rgba(200, 162, 75, 0.5)',
        'gold-soft': '0 16px 42px -20px rgba(200, 162, 75, 0.42)',
        emerald: '0 22px 55px -26px rgba(44, 143, 132, 0.35)',
        'emerald-soft': '0 18px 45px -24px rgba(44, 143, 132, 0.26)',
        glass: '0 24px 70px -34px rgba(28, 44, 10, 0.32)',
        lift: '0 30px 80px -38px rgba(28, 44, 10, 0.38)',
        ember: '0 0 24px rgba(200, 74, 90, 0.3)',
        'ember-deep': '0 18px 50px -18px rgba(200, 74, 90, 0.42)',
        inset: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.72)',
      },
      backgroundImage: {
        'gold-sheen':
          'linear-gradient(110deg, #b8892f 0%, #d8b45a 26%, #f4e3af 50%, #d8b45a 72%, #b8892f 100%)',
        'mint-sheen':
          'linear-gradient(110deg, #365314 0%, #65a30d 26%, #a3e635 52%, #d9f99d 78%, #f7fee7 100%)',
        'mesh-gold':
          'radial-gradient(at 12% 16%, rgba(44,143,132,0.16) 0px, transparent 48%), radial-gradient(at 86% 8%, rgba(200,162,75,0.22) 0px, transparent 44%), radial-gradient(at 78% 82%, rgba(143,214,207,0.12) 0px, transparent 50%), radial-gradient(at 18% 88%, rgba(200,162,75,0.12) 0px, transparent 46%)',
      },
      keyframes: {
        glowPulse: {
          '0%, 100%': {
            filter: 'drop-shadow(0 0 12px rgba(163, 230, 53, 0.3))',
          },
          '50%': {
            filter: 'drop-shadow(0 0 34px rgba(190, 242, 100, 0.6))',
          },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-14px)' },
        },
        aurora: {
          '0%': { transform: 'translate3d(-4%, -2%, 0) scale(1) rotate(0deg)' },
          '50%': {
            transform: 'translate3d(3%, 4%, 0) scale(1.12) rotate(8deg)',
          },
          '100%': {
            transform: 'translate3d(5%, -3%, 0) scale(1.04) rotate(-6deg)',
          },
        },
        drift: {
          '0%': { transform: 'translate3d(0,0,0)', opacity: '0.15' },
          '35%': { opacity: '0.9' },
          '100%': {
            transform: 'translate3d(24px,-90px,0)',
            opacity: '0',
          },
        },
        shimmer: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
        scan: {
          '0%': { transform: 'translateY(-120%)', opacity: '0' },
          '12%': { opacity: '1' },
          '88%': { opacity: '1' },
          '100%': { transform: 'translateY(520%)', opacity: '0' },
        },
        'spin-slow': {
          to: { transform: 'rotate(360deg)' },
        },
        'spin-reverse': {
          to: { transform: 'rotate(-360deg)' },
        },
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        rise: {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(0.85)', opacity: '0.7' },
          '70%': { transform: 'scale(1.55)', opacity: '0' },
          '100%': { transform: 'scale(1.55)', opacity: '0' },
        },
        'gradient-x': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        barShine: {
          '0%': { transform: 'translateX(-120%)' },
          '100%': { transform: 'translateX(220%)' },
        },
        spinConic: {
          to: { transform: 'rotate(360deg)' },
        },
        pingSoft: {
          '0%': { transform: 'scale(1)', opacity: '0.55' },
          '75%, 100%': { transform: 'scale(2.4)', opacity: '0' },
        },
        auroraA: {
          '0%, 100%': { transform: 'translate3d(-6%, -10%, 0) scale(1) skewX(-6deg)' },
          '50%': { transform: 'translate3d(10%, 8%, 0) scale(1.25) skewX(8deg)' },
        },
        auroraB: {
          '0%, 100%': { transform: 'translate3d(8%, 12%, 0) scale(1.15) skewX(10deg)' },
          '50%': { transform: 'translate3d(-8%, -6%, 0) scale(0.95) skewX(-8deg)' },
        },
        dust: {
          '0%': { transform: 'translate3d(0, 12px, 0)', opacity: '0' },
          '12%': { opacity: '0.9' },
          '88%': { opacity: '0.6' },
          '100%': { transform: 'translate3d(-16px, -140px, 0)', opacity: '0' },
        },
        luxeDraw: {
          '0%': { strokeDashoffset: '1' },
          '55%': { strokeDashoffset: '0' },
          '100%': { strokeDashoffset: '0' },
        },
        orbitSpin: {
          to: { transform: 'rotate(360deg)' },
        },
        counterGlow: {
          '0%, 100%': { textShadow: '0 0 18px rgba(200, 162, 75, 0.18)' },
          '50%': { textShadow: '0 0 34px rgba(200, 162, 75, 0.42)' },
        },
      },
      animation: {
        'glow-pulse': 'glowPulse 2.8s ease-in-out infinite',
        float: 'float 6s ease-in-out infinite',
        'float-slow': 'float 10s ease-in-out infinite',
        aurora: 'aurora 20s ease-in-out infinite alternate',
        drift: 'drift 9s linear infinite',
        shimmer: 'shimmer 2.6s linear infinite',
        scan: 'scan 4.2s ease-in-out infinite',
        'spin-slow': 'spin-slow 26s linear infinite',
        'spin-reverse': 'spin-reverse 34s linear infinite',
        marquee: 'marquee 34s linear infinite',
        rise: 'rise 0.8s cubic-bezier(0.22, 1, 0.36, 1) both',
        'pulse-ring': 'pulse-ring 2.6s ease-out infinite',
        'gradient-x': 'gradient-x 8s ease infinite',
        'name-cycle': 'gradient-x 10s ease infinite',
        'bar-shine': 'barShine 4.2s ease-in-out infinite',
        'spin-conic': 'spinConic 5.5s linear infinite',
        'ping-soft': 'pingSoft 2.2s cubic-bezier(0, 0, 0.2, 1) infinite',
        'aurora-a': 'auroraA 22s ease-in-out infinite alternate',
        'aurora-b': 'auroraB 27s ease-in-out infinite alternate',
        dust: 'dust 7s linear infinite',
        'luxe-draw': 'luxeDraw 2.4s ease-out 0.3s both',
        'orbit-spin': 'orbitSpin 7s linear infinite',
        'counter-glow': 'counterGlow 2.4s ease-in-out infinite',
      },
    },
  },
  plugins: [tailwindcssAnimate],
};

export default config;
