/** Brand colors come from docs/styles.css (Sano theme, light only). */
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        brand: '#2f7a3b',
        sun: '#f5b731',
        ink: '#163d22',
        accent: '#2f7a3b',
        bg: '#f8f3e9',
        card: '#ffffff',
        'card-2': '#efe9dc',
        text: '#163d22',
        'text-2': '#56665a',
        muted: '#95a092',
        grid: '#e6e0d2',
        protein: '#2a78d6',
        carbs: '#eb6834',
        fat: '#1baf7a',
      },
    },
  },
  plugins: [],
};
