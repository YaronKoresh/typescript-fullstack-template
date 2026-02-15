import { createRequire } from "node:module";

import { RuleTester } from "eslint";
import { describe, test } from "vitest";

const require = createRequire(import.meta.url);
const rule = require("../../tools/eslint-local-rules/rules/no-comments.cjs");

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2020,
    sourceType: "module",
  },
});

describe("no-comments rule", () => {
  test("should disallow comments in code", () => {
    ruleTester.run("no-comments", rule, {
      valid: [
        {
          code: "const a = 1;",
        },
        {
          code: "const b = 2;\nconst c = 3;",
        },
        {
          code: "#!/usr/bin/env node\nconst a = 1;",
        },
        {
          code: '#!/usr/bin/env node\nimport foo from "bar";',
        },
      ],
      invalid: [
        {
          code: "// single line comment\nconst a = 1;",
          output: "\nconst a = 1;",
          errors: [{ messageId: "noComments" }],
        },
        {
          code: "/* block comment */\nconst b = 2;",
          output: "\nconst b = 2;",
          errors: [{ messageId: "noComments" }],
        },
        {
          code: "/**\n * multiline comment\n */\nconst c = 3;",
          output: "\nconst c = 3;",
          errors: [{ messageId: "noComments" }],
        },
        {
          code: "const d = 4; // inline comment",
          output: "const d = 4; ",
          errors: [{ messageId: "noComments" }],
        },
        {
          code: "// comment 1\n// comment 2\nconst e = 5;",
          output: "\n\nconst e = 5;",
          errors: [{ messageId: "noComments" }, { messageId: "noComments" }],
        },
      ],
    });
  });
});
