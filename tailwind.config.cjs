/** @type {import('tailwindcss').Config} */
export default {
  corePlugins: {
    preflight: false,
  },
  content: ["./src/dev/**/*.{html,css,js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // From https://gist.github.com/martin-mael/4b50fa8e55da846f3f73399d84fa1848
        base: {
          black: "#100F0F",
          950: "#1C1B1A",
          900: "#282726",
          850: "#343331",
          800: "#403E3C",
          700: "#575653",
          600: "#6F6E69",
          500: "#878580",
          300: "#B7B5AC",
          200: "#CECDC3",
          150: "#DAD8CE",
          100: "#E6E4D9",
          50: "#F2F0E5",
          paper: "#FFFCF0",
        },
        red: {
          DEFAULT: "#AF3029",
          light: "#D14D41",
        },
        green: {
          DEFAULT: "#66800B",
          light: "#879A39",
        },
        blue: {
          DEFAULT: "#205EA6",
          light: "#4385BE",
        },
      },
    },
  },
  plugins: [],
};
