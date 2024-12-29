
/**
 * @type {import('prettier').Config}
 * @type {import('prettier-plugin-tailwindcss').PluginOptions} 
 */
const prettierConfig = {
	plugins: ["prettier-plugin-tailwindcss"],
	bracketSameLine: true,
	printWidth: 145,
	useTabs: false,
};

export default prettierConfig;
