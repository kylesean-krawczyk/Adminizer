import js from "@eslint/js";
import globals from "globals";
import tseslintPlugin from "@typescript-eslint/eslint-plugin"; // Corrected import
import tseslintParser from "@typescript-eslint/parser";     // Corrected import
import pluginReact from "eslint-plugin-react";
import json from "@eslint/json";
import markdown from "@eslint/markdown";
import css from "@eslint/css";
import { defineConfig } from "eslint";


export default defineConfig([
  { files: ["**/*.{js,mjs,cjs,jsx}"], plugins: { js }, extends: ["js/recommended"] }, // Adjusted files for JS/JSX
  { files: ["**/*.{js,mjs,cjs,jsx}"], languageOptions: { globals: globals.browser } }, // Adjusted files for JS/JSX
  
  // TypeScript specific configuration
  {
    files: ["**/*.{ts,mts,cts,tsx}"], // Target TypeScript files
    languageOptions: {
      parser: tseslintParser, // Use the correct parser
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname, // Ensure this path is correct for your project structure
      },
      globals: globals.browser, // Apply browser globals to TS/TSX files as well
    },
    plugins: {
      "@typescript-eslint": tseslintPlugin, // Use the correct plugin
    },
    rules: {
      ...tseslintPlugin.configs.recommended.rules, // Apply recommended TypeScript rules
      // Add any custom TypeScript rules here
    },
  },

  pluginReact.configs.flat.recommended, // React rules
  
  // JSON files
  { files: ["**/*.json"], plugins: { json }, language: "json/json", extends: ["json/recommended"] },
  { files: ["**/*.jsonc"], plugins: { json }, language: "json/jsonc", extends: ["json/recommended"] },
  { files: ["**/*.json5"], plugins: { json }, language: "json/json5", extends: ["json/recommended"] },
  
  // Markdown files
  { files: ["**/*.md"], plugins: { markdown }, language: "markdown/gfm", extends: ["markdown/recommended"] },
  
  // CSS files
  { files: ["**/*.css"], plugins: { css }, language: "css/css", extends: ["css/recommended"] },
]);
