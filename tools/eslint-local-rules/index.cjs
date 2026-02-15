module.exports = {
  rules: {
    "strict-imports": require("./rules/strict-imports.cjs"),
    "strict-deps": require("./rules/strict-deps.cjs"),
    "no-comments": require("./rules/no-comments.cjs"),
    "explicit-service-import": require("./rules/explicit-service-import.cjs"),
    "strict-types": require("./rules/strict-types.cjs"),
    "no-empty-structural": require("./rules/no-empty-structural.cjs"),
    "func-style-strict": require("./rules/func-style-strict.cjs"),
    "regex-safety": require("./rules/regex-safety.cjs"),
    "ensure-promise-return": require("./rules/ensure-promise-return.cjs"),
    "expression-expander": require("./rules/expression-expander.cjs"),
    "convert-to-css-modules": require("./rules/convert-to-css-modules.cjs"),
  },
};
