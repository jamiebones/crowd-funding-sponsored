import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#3B82F6', // Your main primary color
          dark: '#2563EB',    // Darker shade for hover states
          light: '#60A5FA',   // Lighter shade if needed
        },
        // You can add more custom colors
        secondary: {
          DEFAULT: '#10B981',
          dark: '#059669',
          light: '#34D399',
        },
        // Example of a single color without variations
        accent: '#F59E0B',
      }
    }
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
} satisfies Config;
