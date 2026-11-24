/** Palette: "Electric Sunset" + logo (saffron orange, Krishna blue). */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: '#00457F', // deep blue
        sky: { DEFAULT: '#2F8EE0', soft: '#EDF5FA' },
        sun: '#FFA723',  // sunny yellow-orange
        saffron: '#EC6206',
        cream: '#FFF8EE',
        ink: '#0B2238',
        mint: '#2BB88F',
        // public website palette: peacock
        peacock: { DEFAULT: '#1565C0', deep: '#0A2540', soft: '#E1EDFB', mist: '#F0F6FD' }, // Krishna blue (from logo)
        marigold: { DEFAULT: '#FFB020', soft: '#FFF2D4' },
        rose: { DEFAULT: '#E8590C', soft: '#FFE8D9' }, // saffron CTA (from logo)
        ivory: '#F7FAFE',
        plum: '#0E2038',
      },
      fontFamily: { display: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'], body: ['Inter', 'system-ui', 'sans-serif'] },
      borderRadius: { chunk: '20px' },
      boxShadow: {
        soft: '0 10px 30px -12px rgba(0,69,127,.25)',
        pop: '0 18px 40px -14px rgba(236,98,6,.45)',
      },
    },
  },
  plugins: [],
};
