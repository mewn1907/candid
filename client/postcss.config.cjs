// ©️ Mewn — enables Tailwind processing in Vite (was missing: the app
// shipped uncompiled @tailwind/@apply directives, i.e. no styling at all).
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
