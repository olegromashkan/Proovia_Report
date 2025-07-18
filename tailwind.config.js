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
                sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
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
            },
            animation: {
                'fade-in': 'fadeIn 0.5s ease-in-out',
                'slide-up': 'slideUp 0.3s ease-out',
                'scale-in': 'scaleIn 0.2s ease-out',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { transform: 'translateY(10px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
                scaleIn: {
                    '0%': { transform: 'scale(0.95)', opacity: '0' },
                    '100%': { transform: 'scale(1)', opacity: '1' },
                },
            },
        },
    },
    plugins: [require('daisyui')],
    daisyui: {
        themes: [
            {
                light: {
                    "primary": "#b53133",
                    "primary-focus": "#962a2c",
                    "primary-content": "#ffffff",

                    "secondary": "#059669",
                    "secondary-focus": "#047857",
                    "secondary-content": "#ffffff",

                    "accent": "#7c3aed",
                    "accent-focus": "#6d28d9",
                    "accent-content": "#ffffff",

                    "neutral": "#374151",
                    "neutral-focus": "#1f2937",
                    "neutral-content": "#ffffff",

                    "base-100": "#ffffff",
                    "base-200": "#f9fafb",
                    "base-300": "#f3f4f6",
                    "base-content": "#1f2937",

                    "info": "#3b82f6",
                    "info-content": "#ffffff",

                    "success": "#10b981",
                    "success-content": "#ffffff",

                    "warning": "#f59e0b",
                    "warning-content": "#ffffff",

                    "error": "#ef4444",
                    "error-content": "#ffffff",
                },
            },
            {
                dark: {
                    "primary": "#e74c4c",
                    "primary-focus": "#d43f3f",
                    "primary-content": "#ffffff",

                    "secondary": "#10b981",
                    "secondary-focus": "#059669",
                    "secondary-content": "#ffffff",

                    "accent": "#8b5cf6",
                    "accent-focus": "#7c3aed",
                    "accent-content": "#ffffff",

                    "neutral": "#404040",
                    "neutral-focus": "#2a2a2a",
                    "neutral-content": "#e5e5e5",

                    "base-100": "#0a0a0a",
                    "base-200": "#1a1a1a",
                    "base-300": "#2d2d2d",
                    "base-content": "#e5e5e5",

                    "info": "#60a5fa",
                    "info-content": "#ffffff",

                    "success": "#34d399",
                    "success-content": "#ffffff",

                    "warning": "#fbbf24",
                    "warning-content": "#1a1a1a",

                    "error": "#f87171",
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