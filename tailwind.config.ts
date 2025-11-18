import type { Config } from 'tailwindcss';

export default {
  content: ['./src/ui/**/*.{vue,js,ts}'],
  theme: {
    extend: {
      colors: {
        primary: '#0d6efd',
        secondary: '#6c757d',
        success: '#198754',
        warning: '#ffc107',
        danger: '#dc3545',
        info: '#0dcaf0',
      },
    },
  },
  plugins: [],
} satisfies Config;
