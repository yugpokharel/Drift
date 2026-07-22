/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Stitch Palette
        "background": "#0e141a",
        "surface": "#0e141a",
        "surface-dim": "#0e141a",
        "surface-bright": "#333a40",
        "surface-container-lowest": "#080f14",
        "surface-container-low": "#161c22",
        "surface-container": "#1c232b",
        "surface-container-high": "#283038",
        "surface-container-highest": "#333a40",
        
        "primary": "#ffffff",
        "on-primary": "#000000",
        
        // Stitch Accents
        "secondary": "#a7ff83", // Neon Green
        "on-secondary": "#000000",
        "tertiary": "#cdbff0", // Soft Lavender
        
        "outline": "#475569",
        "outline-variant": "#1e293b",
        "on-surface": "#f8fafc",
        "on-surface-variant": "#94a3b8",
        
        // Stitch Secondary Theme Colors
        "tertiary-fixed": "#6bff8f",
        "surface-variant": "#2f353c",
        "primary-container": "#8b82f6",
        "secondary-container": "#04b4a2",
        
        "error": "#ffb4ab",
      },
      borderRadius: {
        "DEFAULT": "0.25rem",
        "lg": "0.5rem",
        "xl": "0.75rem",
        "full": "9999px"
      },
      spacing: {
        "container-max": "1200px",
        "margin-desktop": "64px",
        "unit": "8px",
        "gutter": "24px",
        "margin-mobile": "20px",
        "section-gap": "4rem",
        "grid-margin": "2rem",
        "element-gap": "1.5rem",
        "hairline": "1px",
        "grid-gutter": "1rem"
      },
      fontFamily: {
        "body-md": ["Inter", "sans-serif"],
        "body-lg": ["Inter", "sans-serif"],
        "label-caps": ["Inter", "sans-serif"],
        "label-sm": ["Inter", "sans-serif"],
        "display-lg": ["Playfair Display", "serif"],
        "display-lg-mobile": ["Playfair Display", "serif"],
        "headline-md": ["Playfair Display", "serif"],
        "headline-sm": ["Playfair Display", "serif"],
        "meta-technical": ["JetBrains Mono", "monospace"]
      },
      fontSize: {
        "body-md": ["16px", { lineHeight: "1.6", fontWeight: "400" }],
        "body-lg": ["18px", { lineHeight: "1.6", fontWeight: "400" }],
        "label-caps": ["11px", { lineHeight: "1.0", letterSpacing: "0.15em", fontWeight: "600" }],
        "label-sm": ["12px", { lineHeight: "1.0", letterSpacing: "0.02em", fontWeight: "600" }],
        "display-lg": ["72px", { lineHeight: "1.05", letterSpacing: "-0.03em", fontWeight: "600" }],
        "display-lg-mobile": ["48px", { lineHeight: "1.1", letterSpacing: "-0.02em", fontWeight: "600" }],
        "headline-md": ["36px", { lineHeight: "1.2", fontWeight: "600" }],
        "headline-sm": ["28px", { lineHeight: "1.3", fontWeight: "500" }],
        "meta-technical": ["13px", { lineHeight: "1.0", letterSpacing: "0.05em", fontWeight: "500" }]
      }
    },
  },
  plugins: [],
}

