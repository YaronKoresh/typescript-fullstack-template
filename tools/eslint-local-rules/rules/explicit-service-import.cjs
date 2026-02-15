module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow namespace imports from src/server/config/engines/",
      category: "Best Practices",
      recommended: true,
    },
    fixable: "code",
    schema: [],
    messages: {
      noNamespaceImport:
        'Namespace imports (import * as ...) are not allowed from "{{source}}". Use explicit named imports instead.',
    },
  },

  create(context) {
    return {
      ImportDeclaration(node) {
        const importSource = node.source.value;
        const isEngineImport =
          typeof importSource === "string" &&
          (importSource.includes("src/server/config/engines/") ||
            importSource.includes("/server/config/engines/") ||
            importSource.includes("/config/engines/") ||
            importSource.match(/^\.\.?\/.*\/server\/config\/engines\//) ||
            importSource.match(/^\.\.?\/config\/engines\//));

        if (isEngineImport) {
          const namespaceSpecifier = node.specifiers.find(
            (specifier) => specifier.type === "ImportNamespaceSpecifier",
          );

          if (namespaceSpecifier) {
            context.report({
              node,
              messageId: "noNamespaceImport",
              data: {
                source: importSource,
              },
              fix(fixer) {
                const sourceCode = context.sourceCode;
                const variable = sourceCode
                  .getDeclaredVariables(node)
                  .find((v) => v.name === namespaceSpecifier.local.name);

                if (!variable) return null;

                const references = variable.references;
                const properties = new Set();
                const invalidUsage = references.some((ref) => {
                  const parent = ref.identifier.parent;
                  if (
                    parent.type === "MemberExpression" &&
                    parent.object === ref.identifier
                  ) {
                    properties.add(parent.property.name);
                    return false;
                  }
                  return true;
                });

                if (invalidUsage) return null;

                const sortedProps = Array.from(properties).sort();
                if (sortedProps.length === 0) return null;

                const fixes = [];

                const newImport = `import { ${sortedProps.join(", ")} } from "${importSource}";`;
                fixes.push(fixer.replaceText(node, newImport));

                references.forEach((ref) => {
                  const memberExpr = ref.identifier.parent;
                  fixes.push(
                    fixer.replaceText(memberExpr, memberExpr.property.name),
                  );
                });

                return fixes;
              },
            });
          }
        }
      },
    };
  },
};
