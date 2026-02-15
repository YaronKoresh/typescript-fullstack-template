module.exports = {
  meta: {
    type: "problem",
    docs: { description: "Expand logical expressions into if statements" },
    fixable: "code",
    messages: {
      expand: "Expand expression to explicit if-statement.",
    },
  },
  create(context) {
    return {
      ExpressionStatement(node) {
        const expr = node.expression;

        if (expr.type === "LogicalExpression" && expr.operator === "&&") {
          context.report({
            node,
            messageId: "expand",
            fix(fixer) {
              const test = context.sourceCode.getText(expr.left);
              const consequent = context.sourceCode.getText(expr.right);
              return fixer.replaceText(node, `if (${test}) { ${consequent}; }`);
            },
          });
        }

        if (expr.type === "ConditionalExpression") {
          context.report({
            node,
            messageId: "expand",
            fix(fixer) {
              const test = context.sourceCode.getText(expr.test);
              const consequent = context.sourceCode.getText(expr.consequent);
              const alternate = context.sourceCode.getText(expr.alternate);
              return fixer.replaceText(
                node,
                `if (${test}) { ${consequent}; } else { ${alternate}; }`,
              );
            },
          });
        }
      },
    };
  },
};
