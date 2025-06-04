// postcss.config.js
// Use the dedicated Tailwind CSS PostCSS plugin that ships separately in
// Tailwind v4+. This avoids the build error where `tailwindcss` is used as a
// plugin directly.
import tailwindcss from '@tailwindcss/postcss';
import autoprefixer from 'autoprefixer';

export default {
  plugins: [tailwindcss, autoprefixer],
};
