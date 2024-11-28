import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      fontFamily: {
        spacegroteskbold: "Space Grotesk Bold",
        spacegrotesklight: "Space Grotesk Light",
        spacegroteskmedium: "Space Grotesk Medium",
        spacegroteskregular: "Space Grotesk Regular",
        spacegrotesksemibold: "Space Grotesk Semibold",
      },
    },
  },
  plugins: [],
};
export default config;
