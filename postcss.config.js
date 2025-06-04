// postcss.config.js
// Use the standard Tailwind CSS PostCSS plugin. The experimental
// `@tailwindcss/postcss` package can cause build issues in some setups.
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';

export default {
  plugins: [tailwindcss, autoprefixer],
};
