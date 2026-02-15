const hasExitingBreak = function (
  node,
  barrierDepth = 0,
  visibleLabels = new Set(),
) {
  if (!node) return false;
  if (Array.isArray(node)) {
    return node.some((n) => hasExitingBreak(n, barrierDepth, visibleLabels));
  }

  if (node.type.includes("Function")) return false;

  if (node.type === "BreakStatement") {
    if (node.label) {
      return !visibleLabels.has(node.label.name);
    }
    return barrierDepth === 0;
  }

  if (node.type === "LabeledStatement") {
    const newLabels = new Set(visibleLabels).add(node.label.name);
    return hasExitingBreak(node.body, barrierDepth, newLabels);
  }

  const isBarrier = [
    "SwitchStatement",
    "WhileStatement",
    "DoWhileStatement",
    "ForStatement",
    "ForInStatement",
    "ForOfStatement",
  ].includes(node.type);

  const nextDepth = isBarrier ? barrierDepth + 1 : barrierDepth;

  if (node.type === "BlockStatement")
    return hasExitingBreak(node.body, nextDepth, visibleLabels);
  if (node.type === "IfStatement") {
    return (
      hasExitingBreak(node.consequent, nextDepth, visibleLabels) ||
      hasExitingBreak(node.alternate, nextDepth, visibleLabels)
    );
  }
  if (node.type === "TryStatement") {
    return (
      hasExitingBreak(node.block, nextDepth, visibleLabels) ||
      hasExitingBreak(node.handler, nextDepth, visibleLabels) ||
      hasExitingBreak(node.finalizer, nextDepth, visibleLabels)
    );
  }
  if (node.type === "SwitchStatement") {
    return node.cases.some((c) =>
      hasExitingBreak(c.consequent, nextDepth, visibleLabels),
    );
  }
  if (node.body && typeof node.body === "object") {
    return hasExitingBreak(node.body, nextDepth, visibleLabels);
  }

  return false;
};

module.exports = {
  meta: {
    type: "problem",
    docs: { description: "Ensure .then() callbacks always return a value" },
    fixable: "code",
    messages: {
      injectReturn: "Inject 'return void 0;' to satisfy promise/always-return.",
    },
  },
  create(context) {
    const doesBlockTerminate = (stmt) => {
      if (!stmt) return false;
      if (stmt.type === "ReturnStatement" || stmt.type === "ThrowStatement")
        return true;
      if (stmt.type === "BlockStatement") {
        const last = stmt.body[stmt.body.length - 1];
        return doesBlockTerminate(last);
      }
      if (stmt.type === "IfStatement") {
        return (
          doesBlockTerminate(stmt.consequent) &&
          doesBlockTerminate(stmt.alternate)
        );
      }
      if (stmt.type === "SwitchStatement") {
        const hasDefault = stmt.cases.some((c) => !c.test);
        if (!hasDefault) return false;

        let nextCaseIsSafe = false;

        for (let i = stmt.cases.length - 1; i >= 0; i--) {
          const c = stmt.cases[i];
          const consequent = c.consequent;

          let terminatesStrictly = false;
          if (consequent.length > 0) {
            const lastStmt = consequent[consequent.length - 1];
            terminatesStrictly = doesBlockTerminate(lastStmt);
          }

          const exitsViaBreak = hasExitingBreak(consequent);

          if (terminatesStrictly) {
            nextCaseIsSafe = true;
          } else if (exitsViaBreak) {
            nextCaseIsSafe = false;
          }
        }

        return nextCaseIsSafe;
      }

      return false;
    };

    return {
      CallExpression(node) {
        if (
          node.callee.type === "MemberExpression" &&
          node.callee.property.name === "then" &&
          node.arguments.length > 0
        ) {
          const callback = node.arguments[0];
          if (
            callback.type === "ArrowFunctionExpression" ||
            callback.type === "FunctionExpression"
          ) {
            if (callback.body.type === "BlockStatement") {
              const statements = callback.body.body;
              const lastStmt = statements[statements.length - 1];

              if (!doesBlockTerminate(lastStmt)) {
                context.report({
                  node: callback.body,
                  messageId: "injectReturn",
                  fix(fixer) {
                    const closingBrace = context.sourceCode.getLastToken(
                      callback.body,
                    );
                    return fixer.insertTextBefore(
                      closingBrace,
                      " return void 0;",
                    );
                  },
                });
              }
            }
          }
        }
      },
    };
  },
};
