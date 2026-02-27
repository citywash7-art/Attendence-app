module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    screens: {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
      '3xl': '1792px',
      '4xl': '2048px',
      '5xl': '2560px'
    },
    extend: {
      colors: {
        ink: '#111827',
        teak: '#0f766e',
        sand: '#f6efe6',
        sunrise: '#f59e0b'
      }
    }
  },
  plugins: []
};
