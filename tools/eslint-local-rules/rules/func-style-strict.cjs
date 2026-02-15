module.exports = {
  meta: {
    type: "problem",
    docs: { description: "Enforce const arrow functions over declarations" },
    fixable: "code",
    messages: {
      convert: "Convert function declaration to const arrow function.",
    },
  },
  create(context) {
    return {
      FunctionDeclaration(node) {
        if (!node.id || !node.body) return;
        if (node.generator) return;
        context.report({
          node: node,
          messageId: "convert",
          fix(fixer) {
            const sourceCode = context.sourceCode;
            const name = node.id.name;
            const params = node.params
              .map((p) => sourceCode.getText(p))
              .join(", ");
            const body = sourceCode.getText(node.body);
            const asyncPart = node.async ? "async " : "";
            const returnType = node.returnType
              ? sourceCode.getText(node.returnType)
              : "";
            const newCode = `const ${name} = ${asyncPart}(${params})${returnType} => ${body};`;
            return fixer.replaceText(node, newCode);
          },
        });
      },
    };
  },
};
