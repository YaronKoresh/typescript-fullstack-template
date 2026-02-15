const { builtinModules } = require("node:module");

const normalize = (str) => {
  return str.replace(/\r\n/g, "\n").trim();
};

const isRequire = (node) => {
  if (node.type === "VariableDeclaration") {
    if (node.declarations.length === 1) {
      const decl = node.declarations[0];
      if (
        decl.init &&
        decl.init.type === "CallExpression" &&
        decl.init.callee.name === "require"
      ) {
        return true;
      }
    }
  }
  if (node.type === "ExpressionStatement") {
    if (
      node.expression.type === "CallExpression" &&
      node.expression.callee.name === "require"
    ) {
      return true;
    }
  }
  return false;
};

const generateStatement = (data, maxNamed, newline, indent, quote) => {
  const parts = [];
  const {
    defaultImport,
    namespaceImport,
    namedImports,
    source,
    attributes,
    importKind,
  } = data;

  const allNamedAreTypes =
    namedImports.size > 0 &&
    Array.from(namedImports.values()).every((n) => n.isType);

  const defaultIsType = defaultImport ? defaultImport.isType : true;
  const nsIsType = namespaceImport ? namespaceImport.isType : true;

  const canPromoteToTopLevelType =
    importKind === "type" ||
    ((namedImports.size > 0 || defaultImport || namespaceImport) &&
      allNamedAreTypes &&
      defaultIsType &&
      nsIsType);

  const topLevelTypePrefix = canPromoteToTopLevelType ? "type " : "";

  if (defaultImport) {
    const prefix =
      !canPromoteToTopLevelType && defaultImport.isType ? "type " : "";
    parts.push(`${prefix}${defaultImport.name}`);
  }

  if (namespaceImport) {
    const prefix =
      !canPromoteToTopLevelType && namespaceImport.isType ? "type " : "";
    parts.push(`${prefix}* as ${namespaceImport.name}`);
  }

  if (namedImports.size > 0) {
    const sortedNames = Array.from(namedImports.values()).sort((a, b) =>
      a.imported.localeCompare(b.imported, "en", { sensitivity: "base" }),
    );

    const specifiers = sortedNames.map((spec) => {
      const typePrefix =
        !canPromoteToTopLevelType && spec.isType ? "type " : "";
      const alias = spec.imported !== spec.local ? ` as ${spec.local}` : "";
      return `${typePrefix}${spec.imported}${alias}`;
    });

    if (specifiers.length > maxNamed) {
      parts.push(
        `{${newline}${indent}${specifiers.join(`,${newline}${indent}`)},${newline}}`,
      );
    } else {
      parts.push(`{ ${specifiers.join(", ")} }`);
    }
  }

  if (parts.length === 0) {
    return `import ${quote}${source}${quote}${attributes || ""};`;
  }

  return `import ${topLevelTypePrefix}${parts.join(", ")} from ${quote}${source}${quote}${attributes || ""};`;
};

const generateCJSStatement = (data, maxNamed, newline, indent, quote) => {
  const { defaultImport, namespaceImport, namedImports, source } = data;
  let output = "";

  const varName = defaultImport?.name || namespaceImport?.name;

  if (varName) {
    output += `const ${varName} = require(${quote}${source}${quote});`;
  }

  if (namedImports.size > 0) {
    if (output.length > 0) output += newline;

    const sortedNames = Array.from(namedImports.values()).sort((a, b) =>
      a.imported.localeCompare(b.imported, "en", { sensitivity: "base" }),
    );

    const specifiers = sortedNames.map((spec) => {
      return spec.imported !== spec.local
        ? `${spec.imported}: ${spec.local}`
        : spec.imported;
    });

    const destructuring =
      specifiers.length > maxNamed
        ? `{${newline}${indent}${specifiers.join(`,${newline}${indent}`)},${newline}}`
        : `{ ${specifiers.join(", ")} }`;
    output += `const ${destructuring} = require(${quote}${source}${quote});`;
  }

  return output;
};

const getImportType = (source, aliases) => {
  if (!source || typeof source !== "string") return "external";
  if (source.startsWith("node:")) return "builtin";
  if (builtinModules.includes(source.split("/")[0])) return "builtin";
  if (aliases && aliases.some((a) => source.startsWith(a))) return "internal";
  if (source === "." || source === "./") return "index";
  if (source.startsWith("../")) return "parent";
  if (source.startsWith("./")) return "sibling";
  return "external";
};

const detectModuleMode = (body, filename) => {
  if (filename.endsWith(".cjs")) return "cjs";
  if (filename.endsWith(".mjs")) return "esm";

  const firstRelevant = body.find(
    (n) => n.type === "ImportDeclaration" || isRequire(n),
  );

  if (firstRelevant && isRequire(firstRelevant)) return "cjs";

  return "esm";
};

const extractImportNodes = (body) => {
  const firstIndex = body.findIndex(
    (n) => n.type === "ImportDeclaration" || isRequire(n),
  );

  if (firstIndex === -1) return [];

  const importNodes = [];

  for (let i = firstIndex; i < body.length; i++) {
    const n = body[i];
    if (n.type === "ImportDeclaration" || isRequire(n)) {
      importNodes.push(n);
    } else {
      break;
    }
  }
  return importNodes;
};

const extractFormattingInfo = (sourceCode, importNodes) => {
  const firstNode = importNodes[0];
  const lastNode = importNodes[importNodes.length - 1];

  const firstComments = sourceCode.getCommentsBefore(firstNode);
  const startRange =
    firstComments.length > 0 ? firstComments[0].range[0] : firstNode.range[0];

  const lastComments = sourceCode
    .getCommentsAfter(lastNode)
    .filter((c) => c.loc.start.line === lastNode.loc.end.line);
  const endRange =
    lastComments.length > 0
      ? lastComments[lastComments.length - 1].range[1]
      : lastNode.range[1];

  const originalText = sourceCode.text.slice(startRange, endRange);
  const newline = originalText.includes("\r\n") ? "\r\n" : "\n";
  let indent = "  ";

  const indentMatch = originalText.match(/\n([ \t]+)/);
  if (indentMatch) indent = indentMatch[1];

  return { startRange, endRange, originalText, newline, indent };
};

const sortImportsIntoGroups = (imports, sideEffects, aliases) => {
  const sortedGroups = {
    "side-effect": [],
    builtin: [],
    external: [],
    internal: [],
    parent: [],
    sibling: [],
    index: [],
    object: [],
  };

  sideEffects.forEach((item) => sortedGroups["side-effect"].push(item));

  for (const data of imports.values()) {
    const type = getImportType(data.source, aliases);
    if (sortedGroups[type]) {
      sortedGroups[type].push(data);
    } else {
      sortedGroups["external"].push(data);
    }
  }

  Object.keys(sortedGroups).forEach((key) => {
    sortedGroups[key].sort((a, b) =>
      a.source.localeCompare(b.source, "en", { sensitivity: "base" }),
    );
  });

  return sortedGroups;
};

const normalizePath = function (source) {
  if (!source || typeof source !== "string") return source;

  if (/^[a-z]+:/i.test(source) && !source.startsWith("node:")) {
    return source;
  }
  return source.replace(/\/{2,}/g, "/");
};

const enforceNodeProtocol = function (source) {
  if (!source || typeof source !== "string") return source;
  if (source.startsWith("node:")) return source;

  const baseModule = source.split("/")[0];
  if (builtinModules.includes(baseModule) || builtinModules.includes(source)) {
    return `node:${source}`;
  }

  return source;
};

const parseAndMergeImports = (importNodes, sourceCode) => {
  const imports = new Map();
  const sideEffects = [];

  for (const decl of importNodes) {
    const leadingComments = sourceCode.getCommentsBefore(decl);
    const trailingComments = sourceCode
      .getCommentsAfter(decl)
      .filter((c) => c.loc.start.line === decl.loc.end.line);

    const comments = [...leadingComments, ...trailingComments];

    let source = "";
    let isSideEffect = false;
    let defaultImport = null;
    let namedImports = [];
    let namespaceImport = null;
    let importKind = "value";
    let attributes = "";

    if (decl.type === "ImportDeclaration") {
      source = decl.source.value;
      importKind = decl.importKind || "value";

      if (decl.attributes && decl.attributes.length > 0) {
        attributes = sourceCode
          .getText()
          .slice(decl.source.range[1], decl.range[1])
          .replace(/;$/, "");
      } else if (decl.assertions && decl.assertions.length > 0) {
        attributes = sourceCode
          .getText()
          .slice(decl.source.range[1], decl.range[1])
          .replace(/;$/, "");
      }

      if (decl.specifiers.length === 0) {
        isSideEffect = true;
      } else {
        decl.specifiers.forEach((spec) => {
          if (spec.type === "ImportDefaultSpecifier") {
            defaultImport = {
              name: spec.local.name,
              isType: decl.importKind === "type",
            };
          } else if (spec.type === "ImportNamespaceSpecifier") {
            namespaceImport = {
              name: spec.local.name,
              isType: decl.importKind === "type",
            };
          } else if (spec.type === "ImportSpecifier") {
            namedImports.push({
              imported: spec.imported.name || spec.imported.value,
              local: spec.local.name,
              isType: spec.importKind === "type" || decl.importKind === "type",
            });
          }
        });
      }
    } else if (isRequire(decl)) {
      const declNode = decl.declarations ? decl.declarations[0] : null;

      if (!declNode && decl.type === "ExpressionStatement") {
        source = decl.expression.arguments[0].value;
        isSideEffect = true;
      } else if (declNode) {
        const call = declNode.init;
        source = call.arguments[0].value;

        if (declNode.id.type === "Identifier") {
          defaultImport = { name: declNode.id.name, isType: false };
        } else if (declNode.id.type === "ObjectPattern") {
          declNode.id.properties.forEach((prop) => {
            if (prop.type === "Property") {
              namedImports.push({
                imported: prop.key.name || prop.key.value,
                local: prop.value.name,
                isType: false,
              });
            }
          });
        }
      }
    }

    source = normalizePath(source);
    source = enforceNodeProtocol(source);

    const uniqueKey = `${source}::${attributes}`;

    if (isSideEffect) {
      sideEffects.push({
        type: "side-effect",
        source,
        code: sourceCode.getText(decl),
        comments,
      });
      continue;
    }

    if (!imports.has(uniqueKey)) {
      imports.set(uniqueKey, {
        source,
        attributes,
        defaultImport: null,
        namespaceImport: null,
        namedImports: new Map(),
        comments: [],
        importKind: "value",
      });
    }

    const data = imports.get(uniqueKey);
    data.comments.push(...comments);

    if (importKind !== "type") {
      data.importKind = "value";
    }

    if (defaultImport && !data.defaultImport)
      data.defaultImport = defaultImport;

    if (namespaceImport && !data.namespaceImport)
      data.namespaceImport = namespaceImport;

    namedImports.forEach((spec) => {
      if (!data.namedImports.has(spec.imported)) {
        data.namedImports.set(spec.imported, spec);
      } else {
        const existing = data.namedImports.get(spec.imported);
        if (existing.isType && !spec.isType) {
          existing.isType = false;
        }
      }
    });
  }

  return { imports, sideEffects };
};

const generateFinalOutputText = (
  sortedGroups,
  groupOrder,
  mode,
  maxNamed,
  newline,
  indent,
  quote,
) => {
  let output = "";

  groupOrder.forEach((group) => {
    const items = sortedGroups[group];
    if (!items || items.length === 0) return;

    if (output.length > 0) output += newline;

    items.forEach((item) => {
      if (item.comments && item.comments.length > 0) {
        const uniqueComments = new Set();
        item.comments.forEach((c) => {
          const val = c.value.trim();
          if (!uniqueComments.has(val)) {
            if (c.type === "Block") {
              output += `/* ${val} */${newline}`;
            } else {
              output += `// ${val}${newline}`;
            }
            uniqueComments.add(val);
          }
        });
      }

      if (item.type === "side-effect") {
        if (mode === "cjs") {
          output += `require(${quote}${item.source}${quote});`;
        } else {
          output += `import ${quote}${item.source}${quote};`;
        }
      } else {
        if (mode === "cjs") {
          output += generateCJSStatement(
            item,
            maxNamed,
            newline,
            indent,
            quote,
          );
        } else {
          output += generateStatement(item, maxNamed, newline, indent, quote);
        }
      }
      output += newline;
    });
  });

  return output.trim();
};

module.exports = {
  meta: {
    type: "layout",
    docs: {
      description:
        "Enforce strict sorting, merging, typing, and formatting of imports.",
      category: "Stylistic Issues",
      recommended: false,
    },
    fixable: "code",
    schema: [
      {
        type: "object",
        properties: {
          groups: {
            type: "array",
            items: { type: "string" },
            default: [
              "side-effect",
              "builtin",
              "external",
              "internal",
              "parent",
              "sibling",
              "index",
              "object",
            ],
          },
          aliases: {
            type: "array",
            items: { type: "string" },
            default: ["@/", "~/", "#/"],
          },
          maxNamedImportsPerLine: {
            type: "number",
            default: 4,
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      strictImports: "Imports must be strictly sorted, merged, and formatted.",
    },
  },

  create(context) {
    const options = context.options[0] || {};
    const groupOrder = options.groups || [
      "side-effect",
      "builtin",
      "external",
      "internal",
      "parent",
      "sibling",
      "index",
      "object",
    ];

    const aliases = options.aliases || ["@/", "~/", "#/"];
    const maxNamed = options.maxNamedImportsPerLine ?? 4;
    const sourceCode = context.sourceCode || context.getSourceCode();

    const quote = '"';

    return {
      Program(node) {
        const body = node.body;
        if (!body || body.length === 0) return;

        const filename = context.getFilename ? context.getFilename() : "";
        const mode = detectModuleMode(body, filename);
        const importNodes = extractImportNodes(body);
        if (importNodes.length === 0) return;

        const format = extractFormattingInfo(sourceCode, importNodes);

        const { imports, sideEffects } = parseAndMergeImports(
          importNodes,
          sourceCode,
        );

        const sortedGroups = sortImportsIntoGroups(
          imports,
          sideEffects,
          aliases,
        );

        const output = generateFinalOutputText(
          sortedGroups,
          groupOrder,
          mode,
          maxNamed,
          format.newline,
          format.indent,
          quote,
        );

        if (normalize(output) !== normalize(format.originalText)) {
          context.report({
            loc: {
              start: sourceCode.getLocFromIndex(format.startRange),
              end: sourceCode.getLocFromIndex(format.endRange),
            },
            messageId: "strictImports",
            fix(fixer) {
              return fixer.replaceTextRange(
                [format.startRange, format.endRange],
                output,
              );
            },
          });
        }
      },
    };
  },
};
