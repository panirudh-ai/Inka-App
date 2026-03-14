const { heroui } = require("@heroui/react");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Helvetica", "sans-serif"],
      },
      colors: {
        // Stripe-inspired brand tokens
        indigo: {
          DEFAULT: "#635BFF",
          dark: "#4F46E5",
          light: "#7C74FF",
          ghost: "#EEF2FF",
        },
        navy: "#0A2540",
        ink: "#1A1F36",
        slate: "#425466",
        muted: "#697386",
        "border-light": "#E3E8EF",
        "surface-bg": "#F6F9FC",
        "surface-hover": "#F0F4F9",
        // Dark
        "dark-bg": "#0D1B2E",
        "dark-surface": "#0F2240",
        "dark-surface2": "#162B47",
        "dark-border": "#1E3A5F",
        "dark-text": "#C9D7E8",
        "dark-muted": "#7B93AE",
        // Status
        "status-green": "#1A9E5D",
        "status-green-bg": "#ECFDF5",
        "status-red": "#DF1B41",
        "status-red-bg": "#FFF1F3",
        "status-amber": "#B7791F",
        "status-amber-bg": "#FFFBEB",
        "status-blue": "#0073E6",
        "status-blue-bg": "#EFF6FF",
      },
      boxShadow: {
        xs: "0 1px 2px rgba(10,37,64,0.06)",
        sm: "0 1px 4px rgba(10,37,64,0.07), 0 1px 2px rgba(10,37,64,0.04)",
        md: "0 4px 12px rgba(10,37,64,0.09), 0 1px 3px rgba(10,37,64,0.05)",
        lg: "0 8px 24px rgba(10,37,64,0.10), 0 2px 6px rgba(10,37,64,0.05)",
        xl: "0 16px 40px rgba(10,37,64,0.12), 0 4px 12px rgba(10,37,64,0.06)",
        "indigo-sm": "0 4px 14px rgba(99,91,255,0.25)",
      },
    },
  },
  plugins: [
    heroui({
      prefix: "heroui",
      addCommonColors: true,
      defaultTheme: "light",
      defaultExtendTheme: "light",
      themes: {
        light: {
          colors: {
            primary: {
              DEFAULT: "#635BFF",
              foreground: "#FFFFFF",
            },
            secondary: {
              DEFAULT: "#0073E6",
              foreground: "#FFFFFF",
            },
            success: {
              DEFAULT: "#1A9E5D",
              foreground: "#FFFFFF",
            },
            danger: {
              DEFAULT: "#DF1B41",
              foreground: "#FFFFFF",
            },
            warning: {
              DEFAULT: "#B7791F",
              foreground: "#FFFFFF",
            },
          },
        },
        dark: {
          colors: {
            primary: {
              DEFAULT: "#7C74FF",
              foreground: "#FFFFFF",
            },
            secondary: {
              DEFAULT: "#38BDF8",
              foreground: "#FFFFFF",
            },
            success: {
              DEFAULT: "#1A9E5D",
              foreground: "#FFFFFF",
            },
            danger: {
              DEFAULT: "#DF1B41",
              foreground: "#FFFFFF",
            },
            warning: {
              DEFAULT: "#B7791F",
              foreground: "#FFFFFF",
            },
          },
        },
      },
    }),
  ],
};
