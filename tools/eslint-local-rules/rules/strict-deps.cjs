module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "Enforce explicit npm: aliasing and $ overrides",
    },
    fixable: "code",
    schema: [],
  },
  create(context) {
    return {
      "Program > ExportDefaultDeclaration > ObjectExpression": () => {
        void 0;
      },

      Property(node) {
        if (node.key.type !== "Literal") return;

        const parent = node.parent;
        const grandParent = parent && parent.parent;

        if (
          grandParent &&
          grandParent.type === "Property" &&
          (grandParent.key.value === "dependencies" ||
            grandParent.key.value === "devDependencies")
        ) {
          const value = node.value.value;
          const depName = node.key.value;
          const expectedPrefix = `npm:${depName}@`;

          if (!value.startsWith(expectedPrefix)) {
            context.report({
              node: node.value,
              message: `Dependency ${depName} must use explicit alias format: "${expectedPrefix}<version>"`,
              fix(fixer) {
                if (
                  /^\d/.test(value) ||
                  value.startsWith("^") ||
                  value.startsWith("~")
                ) {
                  return fixer.replaceText(
                    node.value,
                    `"npm:${depName}@${value}"`,
                  );
                }
                return null;
              },
            });
          }
        }

        const greatGrandParent = grandParent && grandParent.parent;
        if (
          greatGrandParent &&
          greatGrandParent.type === "Property" &&
          greatGrandParent.key.value === "overrides"
        ) {
          const subDepName = node.key.value;
          const overrideValue = node.value.value;
          const expectedValue = `$${subDepName}`;

          if (overrideValue !== expectedValue) {
            context.report({
              node: node.value,
              message: `Override for ${subDepName} must reference the root dependency via "$${subDepName}"`,
              fix(fixer) {
                return fixer.replaceText(node.value, `"${expectedValue}"`);
              },
            });
          }
        }
      },
    };
  },
};
