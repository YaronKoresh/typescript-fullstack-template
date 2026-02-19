const DEFAULTS = {
  styleObjectName: "styles",
  camelCase: true,
  targetAttributes: [
    "className",
    "activeClassName",
    "containerClassName",
    "wrapperClassName",
    "innerClassName",
    "rootClassName",
    "iconClassName",
    "overlayClassName",
    "modalClassName",
    "inputClassName",
    "labelClassName",
  ],
  ignorePattern:
    "^(fa-|fas-|far-|fab-|mdi-|material-|global-|is-|has-|js-|btn-|text-|bg-|row|col|container|flex|grid|d-|ui-|navbar|sidebar|header|footer)",
};

const StringUtils = {
  toCamelCase: (str) =>
    str.replace(/[-_]+(.)?/g, (_, c) => (c ? c.toUpperCase() : "")),
  isValidIdentifier: (key) => /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key),
  shouldIgnore: (str, pattern) => pattern && new RegExp(pattern).test(str),
  smartSplit: (str) => {
    const parts = [];
    let current = "";
    let depth = 0;

    for (let i = 0; i < str.length; i++) {
      const char = str[i];
      const isStartOfDynamic = char === "$" && str[i + 1] === "{";

      if (isStartOfDynamic) {
        if (depth === 0 && current.length > 0) {
          parts.push(current);
          current = "";
        }
        depth++;
        current += "${";
        i++;
        continue;
      }

      if (char === "}") {
        if (depth > 0) {
          depth--;
          current += "}";
          if (depth === 0) {
            parts.push(current);
            current = "";
          }
          continue;
        }
      }

      if (/\s/.test(char) && depth === 0) {
        if (current.length > 0) {
          parts.push(current);
          current = "";
        }
        continue;
      }

      current += char;
    }

    if (current) parts.push(current);

    return parts;
  },
};

const StyleBuilder = {
  createAccessor: (className, options) => {
    if (className.startsWith("${") || className.includes("${")) {
      return { code: className, isDynamic: false };
    }

    if (StringUtils.shouldIgnore(className, options.ignorePattern)) {
      return { code: `'${className}'`, isDynamic: false };
    }

    const identifier = options.camelCase
      ? StringUtils.toCamelCase(className)
      : className;

    if (StringUtils.isValidIdentifier(identifier)) {
      return {
        code: `${options.styleObjectName}.${identifier}`,
        isDynamic: true,
      };
    }
    return {
      code: `${options.styleObjectName}['${identifier}']`,
      isDynamic: true,
    };
  },

  processDynamicBlock: (block, options) => {
    const innerCode = block.slice(2, -1);
    return innerCode.replace(
      /(["'])([\s]*)([\w-]+)([\s]*)\1/g,
      (match, quote, spacePre, clsName, spaceSuf) => {
        if (StringUtils.shouldIgnore(clsName, options.ignorePattern)) {
          return match;
        }
        const accessor = StyleBuilder.createAccessor(clsName, options);
        return `\`${spacePre}\${${accessor.code}}${spaceSuf}\``;
      },
    );
  },

  buildTemplateInsideString: (classes, options) => {
    if (classes.length === 0) return null;

    const parts = classes.map((cls) => {
      if (cls.startsWith("${") && cls.endsWith("}")) {
        const processedLogic = StyleBuilder.processDynamicBlock(cls, options);
        return `\${${processedLogic}}`;
      }

      const accessor = StyleBuilder.createAccessor(cls, options);
      return accessor.isDynamic ? `\${${accessor.code}}` : cls;
    });

    return parts.join(" ");
  },

  buildJsxExpression: (parts) => {
    if (parts.length === 0) return null;

    if (parts.length === 1 && parts[0].isDynamic) {
      return parts[0].code;
    }

    const templateContent = parts
      .map((p) =>
        p.isDynamic ? `\${${p.code}}` : p.code.replace(/^'|'$/g, ""),
      )
      .join(" ");

    return `\`${templateContent}\``;
  },
};

const HTMLProcessor = {
  regex: /class=(["'])(.*?)\1/g,

  getReplacements: (rawText, options) => {
    const matches = [...rawText.matchAll(HTMLProcessor.regex)];
    const replacements = [];

    for (const match of matches) {
      const [fullMatch, quoteType, classContent] = match;
      const classes = StringUtils.smartSplit(classContent).filter(Boolean);

      if (classes.length === 0) continue;

      const newClassContent = StyleBuilder.buildTemplateInsideString(
        classes,
        options,
      );

      if (newClassContent && newClassContent !== classContent) {
        replacements.push({
          start: match.index,
          end: match.index + fullMatch.length,
          text: `class=${quoteType}${newClassContent}${quoteType}`,
        });
      }
    }

    return replacements.reverse();
  },

  processTemplateLiteral: (node, sourceCode, options) => {
    const rawText = sourceCode.getText(node);
    const replacements = HTMLProcessor.getReplacements(rawText, options);

    if (replacements.length === 0) return null;

    let modifiedText = rawText;
    for (const { start, end, text } of replacements) {
      modifiedText =
        modifiedText.slice(0, start) + text + modifiedText.slice(end);
    }

    return modifiedText;
  },
};

const ExpressionHandler = {
  process: (node, sourceCode, options) => {
    if (!node) return null;

    if (node.type === "Literal" && typeof node.value === "string") {
      const parts = node.value.split(/\s+/).filter(Boolean);
      if (parts.length === 0) return null;

      const accessors = parts.map((cls) =>
        StyleBuilder.createAccessor(cls, options),
      );
      return StyleBuilder.buildJsxExpression(accessors);
    }

    if (node.type === "LogicalExpression" || node.type === "BinaryExpression") {
      const leftResult = ExpressionHandler.process(
        node.left,
        sourceCode,
        options,
      );
      const rightResult = ExpressionHandler.process(
        node.right,
        sourceCode,
        options,
      );

      if (leftResult || rightResult) {
        const leftCode = leftResult || sourceCode.getText(node.left);
        const rightCode = rightResult || sourceCode.getText(node.right);
        return `${leftCode} ${node.operator} ${rightCode}`;
      }
    }

    if (node.type === "ConditionalExpression") {
      const consequentResult = ExpressionHandler.process(
        node.consequent,
        sourceCode,
        options,
      );
      const alternateResult = ExpressionHandler.process(
        node.alternate,
        sourceCode,
        options,
      );

      if (consequentResult || alternateResult) {
        const testCode = sourceCode.getText(node.test);
        const consCode =
          consequentResult || sourceCode.getText(node.consequent);
        const altCode = alternateResult || sourceCode.getText(node.alternate);
        return `${testCode} ? ${consCode} : ${altCode}`;
      }
    }

    if (node.type === "TemplateLiteral") {
      return HTMLProcessor.processTemplateLiteral(node, sourceCode, options);
    }

    return null;
  },
};

const JSXProcessor = {
  getFixedAttribute: (node, sourceCode, options) => {
    if (!node.value) return null;

    if (node.value.type === "Literal") {
      const result = ExpressionHandler.process(node.value, sourceCode, options);
      return result ? `{${result}}` : null;
    }

    if (node.value.type === "JSXExpressionContainer") {
      return ExpressionHandler.process(
        node.value.expression,
        sourceCode,
        options,
      );
    }

    return null;
  },
};

const ScopeHelper = {
  isDefined: (context, variableName) => {
    let scope = context.getScope();
    while (scope) {
      const variable = scope.variables.find((v) => v.name === variableName);
      if (variable) {
        return true;
      }
      scope = scope.upper;
    }
    return false;
  },
};

module.exports = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Convert strings and JSX attributes to CSS Modules syntax",
      category: "Styling",
      recommended: true,
    },
    fixable: "code",
    schema: [
      {
        type: "object",
        properties: {
          styleObjectName: { type: "string" },
          camelCase: { type: "boolean" },
          targetAttributes: { type: "array", items: { type: "string" } },
          ignorePattern: { type: "string" },
        },
        additionalProperties: false,
      },
    ],
  },
  create(context) {
    const options = { ...DEFAULTS, ...(context.options[0] || {}) };
    const sourceCode = context.sourceCode;

    return {
      JSXAttribute(node) {
        if (!options.targetAttributes.includes(node.name.name)) return;

        const newCode = JSXProcessor.getFixedAttribute(
          node,
          sourceCode,
          options,
        );

        if (newCode) {
          const isStylesDefined = ScopeHelper.isDefined(
            context,
            options.styleObjectName,
          );
          if (isStylesDefined) {
            context.report({
              node,
              message: "Migrate to CSS Modules",
              fix(fixer) {
                return node.value.type === "Literal"
                  ? fixer.replaceText(node.value, newCode)
                  : fixer.replaceText(node.value.expression, newCode);
              },
            });
          } else {
            context.report({
              node,
              message: `Cannot migrate to CSS Modules: '${options.styleObjectName}' is not defined. Import it to enable auto-fix.`,
            });
          }
        }
      },

      TemplateLiteral(node) {
        if (node.parent && node.parent.type === "JSXExpressionContainer")
          return;

        const newCode = HTMLProcessor.processTemplateLiteral(
          node,
          sourceCode,
          options,
        );
        if (newCode) {
          context.report({
            node,
            message: "Migrate HTML string classes to CSS Modules",
            fix(fixer) {
              return fixer.replaceText(node, newCode);
            },
          });
        }
      },

      Literal(node) {
        if (typeof node.value !== "string") return;
        if (!node.value.includes("class=")) return;
        if (node.parent && node.parent.type === "JSXAttribute") return;

        const newCode = HTMLProcessor.processTemplateLiteral(
          node,
          sourceCode,
          options,
        );

        if (newCode) {
          const fixedCode = newCode.startsWith("`")
            ? newCode
            : `\`${newCode.slice(1, -1)}\``;

          context.report({
            node,
            message: "Migrate HTML string classes to CSS Modules",
            fix(fixer) {
              return fixer.replaceText(node, fixedCode);
            },
          });
        }
      },
    };
  },
};
