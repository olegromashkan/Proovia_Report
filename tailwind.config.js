/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './pages/**/*.{js,ts,jsx,tsx}',
        './components/**/*.{js,ts,jsx,tsx}',
    ],
    theme: {
        extend: {},
    },
    plugins: [require('daisyui')],
    daisyui: {
        themes: [
            {
                light: {
                    "primary": "#b53133",
                    "primary-content": "oklch(100% 0 0)",

                    "secondary": "#31b567",
                    "secondary-content": "oklch(97% 0.021 166.113)",

                    "accent": "#b53133",
                    "accent-content": "oklch(98% 0.019 200.873)",

                    "neutral": "#212121",
                    "neutral-content": "oklch(98% 0 0)",

                    "base-100": "#ffffff",
                    "base-200": "#f4f4f4",
                    "base-300": "#e5e5e5",
                    "base-content": "oklch(0% 0 0)",

                    "info": "#3b82f6",
                    "info-content": "oklch(100% 0 0)",

                    "success": "#a3e635",
                    "success-content": "oklch(27% 0.072 132.109)",

                    "warning": "#f97316",
                    "warning-content": "oklch(100% 0 0)",

                    "error": "#f87171",
                    "error-content": "oklch(100% 0 0)",
                },
            },
            {
                dark: {
                    "primary": "#ff4e4e",
                    "primary-content": "oklch(100% 0 0)",

                    "secondary": "#31b567",
                    "secondary-content": "oklch(97% 0.021 166.113)",

                    "accent": "#ff4e4e",
                    "accent-content": "oklch(100% 0 0)",

                    "neutral": "#191919",
                    "neutral-content": "oklch(100% 0 0)", // Изменено на белый

                    "base-100": "#0d0d0d",
                    "base-200": "#1a1a1a",
                    "base-300": "#2b2b2b",
                    "base-content": "oklch(100% 0 0)", // Изменено на белый

                    "info": "#3b82f6",
                    "info-content": "oklch(100% 0 0)",

                    "success": "#a3e635",
                    "success-content": "oklch(27% 0.072 132.109)",

                    "warning": "#f97316",
                    "warning-content": "oklch(100% 0 0)",

                    "error": "#f87171",
                    "error-content": "oklch(100% 0 0)",
                }
            }
        ],
    },
};
