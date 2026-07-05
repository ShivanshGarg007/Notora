export default {
  plugins: {
    '@tailwindcss/postcss': {},
    autoprefixer: {},
  },
};


// // ✅ CORRECT (postcss.config.js)
// export default {
//   plugins: {
//     tailwindcss: {},
//     autoprefixer: {},
//   },
// };

// // postcss.config.js
// import tailwindcss from '@tailwindcss/postcss';
// import autoprefixer from 'autoprefixer';

// export default {
//   plugins: {
//     tailwindcss,
//     autoprefixer,
//   },
// };
