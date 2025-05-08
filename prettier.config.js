/**
 * @type {import('prettier').Config}
 * @type {import('prettier-plugin-tailwindcss').PluginOptions}
 */
const prettierConfig = {
  plugins: ["prettier-plugin-tailwindcss"],
  bracketSameLine: true,
  bracketSpacing: true,
  printWidth: 145,
  quoteProps: "as-needed",
  useTabs: false,
  arrowParens: "always",
  tabWidth: 2,
  trailingComma: "es5",
};

export default prettierConfig;
