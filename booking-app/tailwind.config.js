/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        // Standard Tailwind-compatible colors
        // Professional Enterprise Colors
        clio: {
          blue: "#0056D2",
          "blue-hover": "#0046B0",
          navy: "#002D72",
          gray: {
            50: "#F9FAFB",
            100: "#F3F4F6",
            200: "#E5E7EB",
            300: "#D1D5DB",
            400: "#9CA3AF",
            500: "#6B7280",
            600: "#4B5563",
            700: "#374151",
            800: "#1F2937",
            900: "#111827",
            950: "#030712",
          },
        },
        border: "rgb(229 231 235)", // gray-200
        input: "rgb(229 231 235)", // gray-200
        ring: "#0056D2", // clio-blue
        background: "rgb(255 255 255)", // white
        foreground: "#111827", // gray-900

        primary: {
          DEFAULT: "#0056D2", // clio-blue
          foreground: "rgb(255 255 255)", // white
        },
        secondary: {
          DEFAULT: "rgb(156 163 175)", // gray-400
          foreground: "rgb(17 24 39)", // gray-900
        },
        destructive: {
          DEFAULT: "rgb(239 68 68)", // red-500
          foreground: "rgb(255 255 255)", // white
        },
        muted: {
          DEFAULT: "rgb(249 250 251)", // gray-50
          foreground: "rgb(107 114 128)", // gray-500
        },
        accent: {
          DEFAULT: "rgb(249 250 251)", // gray-50
          foreground: "rgb(17 24 39)", // gray-900
        },
        popover: {
          DEFAULT: "rgb(255 255 255)", // white
          foreground: "rgb(17 24 39)", // gray-900
        },
        card: {
          DEFAULT: "rgb(255 255 255)", // white
          foreground: "rgb(17 24 39)", // gray-900
        },
      },
      borderRadius: {
        lg: "0.5rem", // 8px
        md: "0.375rem", // 6px
        sm: "0.25rem", // 4px
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        marquee: {
          from: { transform: "translateX(0%)" },
          to: { transform: "translateX(-100%)" },
        },
        "marquee-vertical": {
          from: { transform: "translateY(0%)" },
          to: { transform: "translateY(-100%)" },
        },
        "shimmer-slide": {
          to: {
            transform: "translate(calc(100cqw - 100%), -100%)",
          },
        },
        "spin-around": {
          "0%": {
            transform: "translateZ(0) rotate(0)",
          },
          "15%, 35%": {
            transform: "translateZ(0) rotate(90deg)",
          },
          "65%, 85%": {
            transform: "translateZ(0) rotate(270deg)",
          },
          "100%": {
            transform: "translateZ(0) rotate(360deg)",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        marquee: "marquee var(--duration) linear infinite",
        "marquee-vertical": "marquee-vertical var(--duration) linear infinite",
        "shimmer-slide":
          "shimmer-slide var(--speed) ease-in-out infinite alternate",
        "spin-around": "spin-around calc(var(--speed) * 2) infinite linear",
      },
    },
  },
  plugins: [],
};