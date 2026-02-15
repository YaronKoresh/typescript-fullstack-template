import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import prettierConfig from "eslint-config-prettier";
import promise from "eslint-plugin-promise";
import security from "eslint-plugin-security";
import n from "eslint-plugin-n";
import { createRequire } from "module";
import jsoncParser from "jsonc-eslint-parser";

const require = createRequire(import.meta.url);
const localRules = require("./tools/eslint-local-rules/index.cjs");

export default tseslint.config(
    js.configs.recommended,
    ...tseslint.configs.recommended,
    {
        files: ["src/**/*.ts", "test/**/*.ts", "scripts/**/*.ts"],
        languageOptions: {
            ecmaVersion: "latest",
            sourceType: "module",
            parser: tseslint.parser,
            parserOptions: {
                project: [
                    "./tsconfig/tsconfig.json",
                    "./tsconfig/client.json",
                    "./tsconfig/server.json",
                    "./tsconfig/balancer.json",
                    "./tsconfig/test.json",
                ],
                tsconfigRootDir: import.meta.dirname,
            },
            globals: {
                ...globals.node,
                ...globals.browser,
                ...globals.es2021,
            },
        },
        rules: {
            "@typescript-eslint/no-explicit-any": "off",
            "@typescript-eslint/no-unused-vars": ["error", { 
                "argsIgnorePattern": "^_",
                "varsIgnorePattern": "^_",
                "caughtErrorsIgnorePattern": "^_"
            }],
            "no-console": "off",
            "no-useless-assignment": "error",
            "prefer-const": "error",
            "eqeqeq": ["error", "always"],
            "func-style": "off",
            "prefer-arrow-callback": ["error"],
            "spaced-comment": ["error", "always", { "block": { "balanced": true }, "exceptions": ["-", "+", "*"] }],
            "complexity": ["error", 30],
            "max-lines-per-function": ["error", { "max": 200, "skipBlankLines": true, "skipComments": true }],
            "no-empty": "off"
        },
    },
    {
        files: ["src/**/*.ts", "test/**/*.ts", "tools/**/*.js", "tools/**/*.ts", "tools/**/*.cjs", "package.json"],
        plugins: {
            'local-rules': localRules,
            'promise': promise,
            'security': security,
            'n': n,
        },
        rules: {
            'local-rules/explicit-service-import': 'error',
            'local-rules/strict-deps': 'error',
            'local-rules/no-comments': 'error',
            'local-rules/strict-types': 'error',
            'local-rules/strict-imports': 'error',
            'local-rules/no-empty-structural': 'error',
            'local-rules/func-style-strict': 'error',
            'local-rules/regex-safety': 'error',
            'local-rules/ensure-promise-return': 'error',
            'local-rules/expression-expander': 'error',
            'security/detect-object-injection': 'off',
            'security/detect-non-literal-regexp': 'off',
            'security/detect-unsafe-regex': 'off',
            'promise/always-return': 'error',
            'promise/catch-or-return': 'error',
            'promise/no-nesting': 'error',
            'n/no-missing-import': 'off',
            'n/no-unsupported-features/es-syntax': 'off',
            'no-control-regex': 'off',
            'promise/always-return': 'off',
            'no-unused-expressions': 'off',
        },
    },
    {
      files: ["src/client/**/*.ts", "src/client/**/*.tsx"],
      plugins: {
        "local-rules": localRules,
      },
      rules: {
        "local-rules/convert-to-css-modules": "error",
      },
    },
    {
        files: ["test/**/*"],
        rules: {
            "@typescript-eslint/no-non-null-assertion": "off",
        }
    },
    {
        files: ["scripts/**/*"],
        rules: {
            "max-lines-per-function": "off",
            "complexity": "off",
        }
    },
    {
        files: ["**/*.cjs"],
        languageOptions: {
            sourceType: "commonjs",
            globals: {
                ...globals.node,
            },
        },
        rules: {
            "@typescript-eslint/no-var-requires": "off",
            "@typescript-eslint/no-require-imports": "off",
        }
    },
    {
        files: ["**/*.js"],
        languageOptions: {
            sourceType: "module",
            globals: {
                ...globals.node,
            },
        },
    },
    {
        ignores: ["dist/", "coverage/", "node_modules/", ".husky/"]
    },
    prettierConfig,
);