/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './pages/**/*.{js,ts,jsx,tsx}',
        './components/**/*.{js,ts,jsx,tsx}',
        './src/**/*.{js,ts,jsx,tsx}',
        './app/**/*.{js,ts,jsx,tsx}',
    ],
    darkMode: 'class',
    theme: {
        extend: {
            fontFamily: {
                sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
            },
            colors: {
                brand: {
                    50: '#fef2f2',
                    100: '#fde6e6',
                    200: '#fbd1d1',
                    300: '#f7abab',
                    400: '#f17a7a',
                    500: '#e74c4c',
                    600: '#d43f3f',
                    700: '#b53133', // Ваш базовый акцент
                    800: '#962a2c',
                    900: '#7c2629',
                    950: '#441214',
                },
                glass: {
                    bg: 'rgba(28, 28, 30, 0.65)', // iOS-like dark glass background
                    border: 'rgba(255, 255, 255, 0.15)',
                    text: '#ffffff',
                    accent: '#007aff', // iOS system blue
                },
            },
            animation: {
                'fade-in': 'fadeIn 0.3s ease-out',
                'slide-up': 'slideUp 0.3s ease-out',
                'scale-in': 'scaleIn 0.3s ease-out',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { transform: 'translateY(8px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
                scaleIn: {
                    '0%': { transform: 'scale(0.98)', opacity: '0' },
                    '100%': { transform: 'scale(1)', opacity: '1' },
                },
            },
            backdropBlur: {
                xs: '2px',
                sm: '4px',
                md: '8px',
                lg: '16px',
                xl: '24px',
            },
        },
    },
    plugins: [
        require('daisyui'),
        function ({ addUtilities }) {
            const newUtilities = {
                '.glass': {
                    'backdrop-filter': 'blur(20px)', // Enhanced blur for liquid glass effect
                    '-webkit-backdrop-filter': 'blur(20px)', // Safari support
                    'background-color': 'rgba(28, 28, 30, 0.65)', // Semi-transparent dark glass
                    'border': '1px solid rgba(255, 255, 255, 0.15)',
                    'border-radius': '1.5rem',
                    'transition': 'all 0.3s ease-out',
                },
                '.glass-hover:hover': {
                    'background-color': 'rgba(28, 28, 30, 0.75)',
                    'box-shadow': '0 4px 12px rgba(0, 0, 0, 0.1)',
                },
                '.glass-light': {
                    'backdrop-filter': 'blur(20px)',
                    '-webkit-backdrop-filter': 'blur(20px)',
                    'background-color': 'rgba(242, 242, 247, 0.65)', // Light mode glass
                    'border': '1px solid rgba(0, 0, 0, 0.1)',
                    'border-radius': '1.5rem',
                },
                '.glass-text': {
                    color: '#ffffff',
                    'text-shadow': '0 1px 2px rgba(0, 0, 0, 0.05)',
                },
            };
            addUtilities(newUtilities, ['responsive', 'hover']);
        },
    ],
    daisyui: {
        themes: [
            {
                light: {
                    "primary": "#007aff", // iOS system blue for primary
                    "primary-focus": "#005bb5",
                    "primary-content": "#ffffff",

                    "secondary": "#34c759",
                    "secondary-focus": "#248a3d",
                    "secondary-content": "#ffffff",

                    "accent": "#5856d6",
                    "accent-focus": "#4c4ab7",
                    "accent-content": "#ffffff",

                    "neutral": "#3c3c3e",
                    "neutral-focus": "#2c2c2e",
                    "neutral-content": "#ffffff",

                    "base-100": "#ffffff",
                    "base-200": "#f2f2f7",
                    "base-300": "#e5e5ea",
                    "base-content": "#1c1c1e",

                    "info": "#007aff",
                    "info-content": "#ffffff",

                    "success": "#34c759",
                    "success-content": "#ffffff",

                    "warning": "#ffcc00",
                    "warning-content": "#1c1c1e",

                    "error": "#ff3b30",
                    "error-content": "#ffffff",
                },
            },
            {
                dark: {
                    "primary": "#0a84ff", // iOS dark system blue
                    "primary-focus": "#006bd6",
                    "primary-content": "#ffffff",

                    "secondary": "#32d74b",
                    "secondary-focus": "#26a53a",
                    "secondary-content": "#ffffff",

                    "accent": "#5e5ce6",
                    "accent-focus": "#4d4ac7",
                    "accent-content": "#ffffff",

                    "neutral": "#3a3a3c",
                    "neutral-focus": "#2a2a2c",
                    "neutral-content": "#ebebf0",

                    "base-100": "#1c1c1e",
                    "base-200": "#2c2c2e",
                    "base-300": "#3a3a3c",
                    "base-content": "#ebebf0",

                    "info": "#0a84ff",
                    "info-content": "#ffffff",

                    "success": "#32d74b",
                    "success-content": "#ffffff",

                    "warning": "#ffd60a",
                    "warning-content": "#1c1c1e",

                    "error": "#ff453a",
                    "error-content": "#ffffff",
                }
            }
        ],
        darkTheme: "dark",
        base: true,
        styled: true,
        utils: true,
        prefix: "",
        logs: true,
        themeRoot: ":root",
    },
};