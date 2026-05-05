import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

const colorVar = (name: string) =>
  `rgb(from var(${name}) r g b / <alpha-value>)`;

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        thai: [
          "var(--font-thai)",
          "var(--font-sans)",
          "system-ui",
          "sans-serif",
        ],
      },
      colors: {
        primary: {
          DEFAULT: colorVar("--color-primary"),
          dark: colorVar("--color-primary-dark"),
          light: colorVar("--color-primary-light"),
          bg: colorVar("--color-primary-bg"),
          subtle: colorVar("--color-primary-subtle"),
        },
        text: {
          primary: colorVar("--color-text-primary"),
          secondary: colorVar("--color-text-secondary"),
          muted: colorVar("--color-text-muted"),
          link: colorVar("--color-text-link"),
        },
        bg: {
          page: colorVar("--color-bg-page"),
          canvas: colorVar("--color-bg-canvas"),
          sidebar: colorVar("--color-bg-sidebar"),
          secondary: colorVar("--color-bg-secondary"),
          tag: colorVar("--color-bg-tag"),
        },
        border: {
          DEFAULT: colorVar("--color-border"),
          light: colorVar("--color-border-light"),
        },
        badge: {
          "positive-bg": colorVar("--color-badge-positive-bg"),
          "positive-text": colorVar("--color-badge-positive-text"),
          "neutral-bg": colorVar("--color-badge-neutral-bg"),
          "neutral-text": colorVar("--color-badge-neutral-text"),
        },
        tag: {
          "remote-bg": colorVar("--color-tag-remote-bg"),
          "remote-text": colorVar("--color-tag-remote-text"),
          "onsite-bg": colorVar("--color-tag-onsite-bg"),
          "onsite-text": colorVar("--color-tag-onsite-text"),
          "hybrid-bg": colorVar("--color-tag-hybrid-bg"),
          "hybrid-text": colorVar("--color-tag-hybrid-text"),
        },
        status: {
          "pending-bg": colorVar("--color-status-pending-bg"),
          "pending-text": colorVar("--color-status-pending-text"),
          "approved-bg": colorVar("--color-status-approved-bg"),
          "approved-text": colorVar("--color-status-approved-text"),
          "rejected-bg": colorVar("--color-status-rejected-bg"),
          "rejected-text": colorVar("--color-status-rejected-text"),
          "disbursed-bg": colorVar("--color-status-disbursed-bg"),
          "disbursed-text": colorVar("--color-status-disbursed-text"),
        },
      },
      borderRadius: {
        sm: "6px",
        md: "8px",
        lg: "12px",
        xl: "16px",
        full: "9999px",
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
        hover: "0 4px 12px rgba(0,0,0,0.08)",
        modal: "0 8px 32px rgba(0,0,0,0.12)",
      },
      spacing: {
        "1": "4px",
        "2": "8px",
        "3": "12px",
        "4": "16px",
        "5": "20px",
        "6": "24px",
        "8": "32px",
        "10": "40px",
      },
      fontSize: {
        "page-title": ["22px", { lineHeight: "1.3", fontWeight: "600" }],
        "section-title": ["14px", { lineHeight: "1.4", fontWeight: "600" }],
        "stat-hero": ["36px", { lineHeight: "1.1", fontWeight: "700" }],
        "stat-value": ["24px", { lineHeight: "1.2", fontWeight: "600" }],
        body: ["14px", { lineHeight: "1.6" }],
        label: ["12px", { lineHeight: "1.4", fontWeight: "500" }],
        caption: ["12px", { lineHeight: "1.5" }],
        badge: ["11px", { lineHeight: "1", fontWeight: "500" }],
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
        "slide-in-right": {
          from: { transform: "translateX(100%)" },
          to: { transform: "translateX(0)" },
        },
        "slide-out-right": {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(100%)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "page-fade-in": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "backdrop-fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.95)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        pulse: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
        "toast-in": {
          from: { transform: "translateX(100%)", opacity: "0" },
          to: { transform: "translateX(0)", opacity: "1" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "slide-in-right": "slide-in-right 0.25s ease-out",
        "slide-out-right": "slide-out-right 0.25s ease-out",
        "fade-in": "fade-in 0.2s ease-out",
        "page-fade-in": "page-fade-in 0.25s ease-out",
        "backdrop-fade-in": "backdrop-fade-in 0.2s ease-out",
        "scale-in": "scale-in 0.2s ease-out",
        "pulse-badge": "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "toast-in": "toast-in 0.3s ease-out",
      },
    },
  },
  plugins: [tailwindcssAnimate],
};

export default config;
