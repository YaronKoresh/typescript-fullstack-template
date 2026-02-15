module.exports = {
  meta: {
    type: "layout",
    docs: {
      description: "Remove all comments from code except shebangs",
      category: "Stylistic Issues",
      recommended: false,
    },
    fixable: "whitespace",
    schema: [],
    messages: {
      noComments: "Comments are not allowed in the codebase",
    },
  },

  create(context) {
    return {
      Program() {
        const sourceCode = context.sourceCode || context.getSourceCode();
        const comments = sourceCode.getAllComments();

        comments.forEach((comment) => {
          const commentText = sourceCode.getText(comment);

          if (commentText.startsWith("#!")) {
            return;
          }

          context.report({
            loc: comment.loc,
            messageId: "noComments",
            fix(fixer) {
              return fixer.removeRange(comment.range);
            },
          });
        });
      },
    };
  },
};
