export default {
  plugins: {
    ...(process.env.NODE_ENV === 'production' 
      ? {
          'tailwindcss/nesting': {},
          tailwindcss: {},
          autoprefixer: {}
        } 
      : {
          tailwindcss: {},
          autoprefixer: {}
        })
  }
} 