import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  FunctionLikeDeclaration,
  Node,
  Project,
  PropertyDeclaration,
  SourceFile,
  SyntaxKind,
  Type,
  TypedNode,
  TypeFormatFlags,
  VariableDeclaration,
  VariableDeclarationKind,
} from "ts-morph";

const __filename: string = fileURLToPath(import.meta.url);
const __dirname: string = path.dirname(__filename);

interface GeneratorConfig {
  addVoidReturns: boolean;
  skipConstLiterals: boolean;
  widenLetVariables: boolean;
  maxTypeLength: number;
  autoFixImports: boolean;
  removeRedundantTypes: boolean;
}

interface ChangeTracker {
  count: number;
}

const CONFIG: GeneratorConfig = {
  addVoidReturns: true,
  skipConstLiterals: false,
  widenLetVariables: true,
  maxTypeLength: 400,
  autoFixImports: true,
  removeRedundantTypes: true,
};

const resolveImportsInType = (
  sourceFile: SourceFile,
  typeText: string,
): string => {
  if (!CONFIG.autoFixImports) return typeText;

  const importRegex = /import\("([^"]+)"\)\.([a-zA-Z0-9_$]+)/g;
  let updatedTypeText = typeText;
  let match;

  while ((match = importRegex.exec(typeText)) !== null) {
    const [fullMatch, modulePath, exportName] = match;

    const existingImport = sourceFile.getImportDeclaration(
      (decl) => decl.getModuleSpecifierValue() === modulePath,
    );

    if (existingImport) {
      const hasNamedImport = existingImport
        .getNamedImports()
        .some((ni) => ni.getName() === exportName);

      if (!hasNamedImport) {
        existingImport.addNamedImport(exportName);
      }
    } else {
      sourceFile.addImportDeclaration({
        moduleSpecifier: modulePath,
        namedImports: [exportName],
      });
    }

    updatedTypeText = updatedTypeText.split(fullMatch).join(exportName);
  }

  return updatedTypeText;
};

const isValidType = (typeText: string): boolean => {
  if (!typeText) return false;
  if (/\bany\b/.test(typeText) || typeText === "unknown") return false;
  if (typeText === "never") return false;
  if (typeText === "object") return false;
  if (typeText === "Function") return false;

  if (
    !CONFIG.autoFixImports &&
    (typeText.includes("typeof import") || typeText.includes('import("'))
  )
    return false;

  if (typeText.length > CONFIG.maxTypeLength) return false;

  if (typeText.includes("__type")) return false;

  return true;
};

const enforceConstAssertion = (
  declaration: VariableDeclaration,
  tracker: ChangeTracker,
): boolean => {
  const variableStatement = declaration.getVariableStatement();
  if (variableStatement?.getDeclarationKind() !== VariableDeclarationKind.Const)
    return false;

  const initializer = declaration.getInitializer();
  if (!initializer) return false;

  if (Node.isAsExpression(initializer)) {
    if (initializer.getTypeNode()?.getText() === "const") {
      if (declaration.getTypeNode()) {
        declaration.removeType();
        tracker.count++;
      }
      return true;
    }
    return false;
  }

  const kind = initializer.getKind();
  const isLiteral =
    kind === SyntaxKind.StringLiteral ||
    kind === SyntaxKind.NumericLiteral ||
    kind === SyntaxKind.TrueKeyword ||
    kind === SyntaxKind.FalseKeyword;

  if (!isLiteral) return false;

  const text = initializer.getText();

  declaration.setInitializer(`${text} as const`);

  if (declaration.getTypeNode()) {
    declaration.removeType();
  }

  tracker.count++;
  return true;
};

const cleanupRedundantTypes = (
  declaration: VariableDeclaration,
  tracker: ChangeTracker,
): void => {
  if (!CONFIG.removeRedundantTypes) return;
  if (!declaration.getTypeNode()) return;

  const initializer = declaration.getInitializer();
  if (!initializer) return;

  const isFunction =
    initializer.getKind() === SyntaxKind.ArrowFunction ||
    initializer.getKind() === SyntaxKind.FunctionExpression;

  const isLiteral =
    initializer.getKind() === SyntaxKind.StringLiteral ||
    initializer.getKind() === SyntaxKind.NumericLiteral ||
    initializer.getKind() === SyntaxKind.TrueKeyword ||
    initializer.getKind() === SyntaxKind.FalseKeyword;

  if (!isFunction && !isLiteral) return;

  try {
    const explicitType = declaration.getType();
    const inferredType = initializer.getType();

    const fmt =
      TypeFormatFlags.NoTruncation |
      TypeFormatFlags.UseAliasDefinedOutsideCurrentScope |
      TypeFormatFlags.NoTypeReduction;

    if (
      explicitType.getText(declaration, fmt) ===
      inferredType.getText(declaration, fmt)
    ) {
      declaration.removeType();
      tracker.count++;
    }
  } catch (err) {
    console.error(err);
  }
};

const processTypedNode = (
  node: Node & TypedNode,
  sourceFile: SourceFile,
  tracker: ChangeTracker,
  isConst: boolean = false,
): void => {
  if (node.getTypeNode()) return;

  if (Node.isVariableDeclaration(node)) {
    const initializer = node.getInitializer();
    if (
      initializer &&
      (initializer.getKind() === SyntaxKind.ArrowFunction ||
        initializer.getKind() === SyntaxKind.FunctionExpression)
    ) {
      return;
    }
  }

  try {
    const type: Type = node.getType();

    const typeFormatFlags =
      TypeFormatFlags.NoTruncation |
      TypeFormatFlags.UseAliasDefinedOutsideCurrentScope |
      TypeFormatFlags.NoTypeReduction |
      TypeFormatFlags.WriteArrayAsGenericType;

    let typeText: string = type.getText(node, typeFormatFlags);

    if (CONFIG.widenLetVariables && !isConst && type.isLiteral()) {
      typeText = type.getWidenedType().getText(node, typeFormatFlags);
    }

    if (CONFIG.skipConstLiterals && isConst && type.isLiteral()) {
      if (!type.isObject()) return;
    }

    typeText = resolveImportsInType(sourceFile, typeText);

    if (isValidType(typeText)) {
      node.setType(typeText);
      tracker.count++;
    }
  } catch (err) {
    console.error(err);
  }
};

const processFunctionLike = (
  func: FunctionLikeDeclaration,
  sourceFile: SourceFile,
  tracker: ChangeTracker,
): void => {
  if (!func.getReturnTypeNode()) {
    try {
      const returnType: Type = func.getReturnType();

      const fmt =
        TypeFormatFlags.NoTruncation |
        TypeFormatFlags.UseAliasDefinedOutsideCurrentScope |
        TypeFormatFlags.NoTypeReduction;

      let returnTypeText: string = returnType.getText(func, fmt);

      const isVoid: boolean = returnTypeText === "void";

      if ((isVoid && CONFIG.addVoidReturns) || !isVoid) {
        returnTypeText = resolveImportsInType(sourceFile, returnTypeText);

        if (isValidType(returnTypeText)) {
          func.setReturnType(returnTypeText);
          tracker.count++;
        }
      }
    } catch (err) {
      console.error(err);
    }
  }

  const params = func.getParameters();
  for (const param of params) {
    processTypedNode(param, sourceFile, tracker, false);
  }
};

const run = async (): Promise<void> => {
  console.log("🔍 Initializing TypeScript project...");

  const project: Project = new Project({
    tsConfigFilePath: path.join(__dirname, "..", "tsconfig", "tsconfig.json"),
    skipAddingFilesFromTsConfig: true,
  });

  project.addSourceFilesAtPaths("src/**/*.ts");

  const sourceFiles: SourceFile[] = project.getSourceFiles();
  console.log(`📁 Found ${sourceFiles.length} source files to analyze\n`);

  let totalChanges: number = 0;

  for (const sourceFile of sourceFiles) {
    const filePath: string = sourceFile.getFilePath();
    const relativePath: string = path.relative(process.cwd(), filePath);
    const tracker: ChangeTracker = { count: 0 };

    const variableDeclarations: VariableDeclaration[] =
      sourceFile.getDescendantsOfKind(SyntaxKind.VariableDeclaration);

    for (const declaration of variableDeclarations) {
      if (!declaration.getInitializer()) continue;
      if (declaration.getParent()?.getKind() === SyntaxKind.ForStatement)
        continue;

      const handledConst = enforceConstAssertion(declaration, tracker);
      if (handledConst) continue;

      cleanupRedundantTypes(declaration, tracker);

      const variableStatement = declaration.getVariableStatement();
      const isConst: boolean =
        variableStatement?.getDeclarationKind() ===
        VariableDeclarationKind.Const;

      processTypedNode(declaration, sourceFile, tracker, isConst);
    }

    const functionLikes: FunctionLikeDeclaration[] = [
      ...sourceFile.getFunctions(),
      ...sourceFile.getDescendantsOfKind(SyntaxKind.ArrowFunction),
      ...sourceFile.getDescendantsOfKind(SyntaxKind.FunctionExpression),
      ...sourceFile.getDescendantsOfKind(SyntaxKind.MethodDeclaration),
      ...sourceFile.getDescendantsOfKind(SyntaxKind.GetAccessor),
      ...sourceFile.getDescendantsOfKind(SyntaxKind.SetAccessor),
    ];

    for (const func of functionLikes) {
      processFunctionLike(func, sourceFile, tracker);
    }

    const classProperties: PropertyDeclaration[] =
      sourceFile.getDescendantsOfKind(SyntaxKind.PropertyDeclaration);

    for (const prop of classProperties) {
      if (prop.getInitializer()) {
        processTypedNode(prop, sourceFile, tracker, false);
      }
    }

    if (tracker.count > 0) {
      if (CONFIG.autoFixImports) {
        sourceFile.organizeImports();
      }

      sourceFile.formatText();

      await sourceFile.save();
      console.log(`✅ ${relativePath}: Modified ${tracker.count} locations`);
      totalChanges += tracker.count;
    }
  }

  console.log(
    `\n🎉 Complete! Modified ${totalChanges} locations across ${sourceFiles.length} files`,
  );
};

try {
  await run();
} catch (err) {
  console.error(err);
}
