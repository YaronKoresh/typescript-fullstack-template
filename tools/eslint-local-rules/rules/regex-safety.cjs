module.exports = {
  meta: {
    type: "problem",
    docs: { description: "Safely escape control characters in Regex literals" },
    fixable: "code",
    messages: {
      escape: "Escape unsafe control character in RegEx.",
    },
  },
  create(context) {
    return {
      Literal(node) {
        if (!node.regex) return;

        const raw = node.raw;
        if (/[\u0000-\u001f]/.test(node.value)) {
          if (raw.includes("\\x1b") || raw.includes("\\x00")) {
            context.report({
              node,
              messageId: "escape",
              fix(fixer) {
                const pattern = node.regex.pattern;
                const flags = node.regex.flags;
                return fixer.replaceText(
                  node,
                  `new RegExp("${pattern.replace(/\\/g, "\\\\")}", "${flags}")`,
                );
              },
            });
          }
        }
      },
    };
  },
};
