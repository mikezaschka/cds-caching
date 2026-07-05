import eslint from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
	eslint.configs.recommended,
	...tseslint.configs.recommended,
	...tseslint.configs.recommendedTypeChecked,
	{
		languageOptions: {
			globals: {
				...globals.browser,
				sap: "readonly",
			},
			ecmaVersion: 2023,
			parserOptions: {
				project: "./tsconfig.json",
				tsconfigRootDir: import.meta.dirname,
			},
		},
	},
	{
		ignores: ["dashboard.eslint.config.mjs"],
	},
);
