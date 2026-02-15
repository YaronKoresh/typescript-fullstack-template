const { ESLintUtils } = require("@typescript-eslint/utils");
const ts = require("typescript");

const createRule = ESLintUtils.RuleCreator((name) => name);

module.exports = createRule({
  name: "strict-types",
  meta: {
    type: "problem",
    docs: { description: "Replace explicit 'any' with the inferred type" },
    fixable: "code",
    schema: [],
    messages: {
      replaceAny: "Replace 'any' with explicit inferred type '{{type}}'.",
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      VariableDeclarator(node) {
        if (
          !node.id.typeAnnotation ||
          node.id.typeAnnotation.typeAnnotation.type !== "TSAnyKeyword"
        ) {
          return;
        }
        if (!node.init) return;

        const services = ESLintUtils.getParserServices(context);
        const typeChecker = services.program.getTypeChecker();
        const tsNode = services.esTreeNodeToTSNodeMap.get(node.init);
        const type = typeChecker.getTypeAtLocation(tsNode);

        let typeString = typeChecker.typeToString(
          type,
          tsNode,
          ts.TypeFormatFlags.NoTruncation,
        );

        if (typeString === "any" || typeString.includes("import(")) return;

        context.report({
          node: node.id.typeAnnotation,
          messageId: "replaceAny",
          data: { type: typeString },
          fix(fixer) {
            return fixer.replaceText(node.id.typeAnnotation, `: ${typeString}`);
          },
        });
      },
    };
  },
});
