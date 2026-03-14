export default {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  corePlugins: {
    preflight: false, // disable Tailwind reset to avoid breaking MUI styles
  },
}
