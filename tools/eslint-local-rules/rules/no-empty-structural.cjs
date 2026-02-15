module.exports = {
  meta: {
    type: "problem",
    docs: { description: "Structurally resolve empty blocks" },
    fixable: "code",
    messages: {
      removeEmpty: "Remove empty block.",
      invertIf: "Invert if statement to remove empty block.",
      fillBlock: "Fill required empty block.",
    },
  },
  create(context) {
    return {
      IfStatement(node) {
        if (
          node.consequent.type === "BlockStatement" &&
          node.consequent.body.length === 0
        ) {
          if (node.alternate) {
            context.report({
              node: node,
              messageId: "invertIf",
              fix(fixer) {
                const sourceCode = context.sourceCode;
                const testText = sourceCode.getText(node.test);
                const altText = sourceCode.getText(node.alternate);
                let newBody = altText;
                if (node.alternate.type !== "BlockStatement") {
                  newBody = `{ ${altText} }`;
                }
                return fixer.replaceText(
                  node,
                  `if (!(${testText})) ${newBody}`,
                );
              },
            });
          } else {
            context.report({
              node: node,
              messageId: "removeEmpty",
              fix(fixer) {
                return fixer.remove(node);
              },
            });
          }
        }
      },
      BlockStatement(node) {
        if (node.body.length === 0) {
          const parent = node.parent;

          if (parent.type === "CatchClause") {
            context.report({
              node: node,
              messageId: "fillBlock",
              fix(fixer) {
                if (parent.param) {
                  return fixer.replaceText(
                    node,
                    `{ console.error(${parent.param.name}); }`,
                  );
                } else {
                  return [
                    fixer.insertTextBefore(node, "(err) "),
                    fixer.replaceText(node, "{ console.error(err); }"),
                  ];
                }
              },
            });
            return;
          }

          const fillParents = [
            "DoWhileStatement",
            "WhileStatement",
            "ForStatement",
            "ForInStatement",
            "ForOfStatement",
            "FunctionDeclaration",
            "FunctionExpression",
            "ArrowFunctionExpression",
            "MethodDefinition",
            "Property",
            "TryStatement",
          ];

          if (fillParents.includes(parent.type)) {
            context.report({
              node: node,
              messageId: "fillBlock",
              fix(fixer) {
                return fixer.replaceText(node, "{ void 0; }");
              },
            });
            return;
          }

          if (
            parent.type === "BlockStatement" ||
            parent.type === "Program" ||
            parent.type === "SwitchCase"
          ) {
            context.report({
              node: node,
              messageId: "removeEmpty",
              fix(fixer) {
                return fixer.remove(node);
              },
            });
          }
        }
      },
    };
  },
};
