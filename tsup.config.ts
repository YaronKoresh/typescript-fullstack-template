import { defineConfig } from 'tsup';
import { builtinModules } from 'node:module';
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import postcss from 'postcss';
import postcssModules from 'postcss-modules';

const globalCssMapping = {};

const customCssObfuscation = {
  name: 'custom-css-obfuscation',
  setup(build) {
    const CUSTOM_NAMESPACE = 'custom-css-module';
    build.onResolve({ filter: /\.module\.css$/ }, (args) => {
      const resolveDir = args.resolveDir || process.cwd();
      const fullPath = path.resolve(resolveDir, args.path);
      return {
        path: fullPath + ".obfuscated",
        namespace: CUSTOM_NAMESPACE
      };
    });

    build.onLoad({ filter: /.*/, namespace: CUSTOM_NAMESPACE }, async (args) => {
      const realPath = args.path.replace(/\.obfuscated$/, '');
      const css = await fs.readFile(realPath, 'utf8');

      let rawMapping = {};

      const result = await postcss([
        postcssModules({
          generateScopedName: '[hash:base64:5]',
          getJSON: (_, json) => {
            rawMapping = json;
          }
        })
      ]).process(css, { from: realPath });

      Object.assign(globalCssMapping, rawMapping);

      const camelCaseMapping = {};
      for (const [key, value] of Object.entries(rawMapping)) {
        const camelKey = key.replace(/[-_]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ""));
        camelCaseMapping[camelKey] = value;
      }

      const namedExportsLines = [];
      for (const [key, value] of Object.entries(camelCaseMapping)) {
        if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key)) {
           namedExportsLines.push(`export const ${key} = ${JSON.stringify(value)};`);
        }
      }

      const contents = `
        const css = ${JSON.stringify(result.css)};
        const mapping = ${JSON.stringify(camelCaseMapping)};
        
        if (typeof document !== 'undefined') {
          const style = document.createElement('style');
          style.type = 'text/css';
          style.appendChild(document.createTextNode(css));
          document.head.appendChild(style);
        }
        
        ${namedExportsLines.join('\n')}

        export default mapping;
      `;

      return {
        contents,
        loader: 'js',
        resolveDir: path.dirname(realPath),
      };
    });

    build.onEnd(async () => {
      const distPath = path.resolve(process.cwd(), 'dist/client');
      await fs.mkdir(distPath, { recursive: true });
      
      await fs.writeFile(
        path.join(distPath, 'css-map.json'), 
        JSON.stringify(globalCssMapping, null, 2)
      );
      console.log('⚡ CSS Manifest saved to dist/client/css-map.json');
    });

  },
};

export default defineConfig([{
    name: 'client',
    platform: 'browser',
    shims: false,
    plugins: [
      {
        name: 'block-node-builtins',
        setup(build) {
          const nodes = new Set(builtinModules);
          build.onResolve({ filter: /^node:|^[a-z]+$/ }, (args) => {
            const moduleName = args.path.replace(/^node:/, '');
            if (nodes.has(moduleName)) {
              return { 
                errors: [{ 
                  text: `FORBIDDEN: Node.js module "${args.path}" detected in client build. (Imported by ${args.importer})` 
                }] 
              };
            }
          });
        }
      }
    ],
    entry: ['src/client/index.ts'],
    external: ['./src/server/**/*'],
    outDir: 'dist/client',
    tsconfig: 'tsconfig/client.json',
    clean: true,
    format: ["iife"],
    globalName: "ChatEngines",
    dts: false,
    splitting: false,
    sourcemap: false,
    minify: true,
    injectStyle: false,
    esbuildPlugins: [customCssObfuscation],
    esbuildOptions(options) {
      options.platform = 'browser';
    },
    treeshake: true,
    define: {
      'process.env.NODE_ENV': JSON.stringify('production')
    }
}, {
    name: 'server',
    platform: 'node',
    noExternal: [/(.*)/],
    entry: ['src/server/index.ts'],
    external: ['./src/client/**/*'],
    outDir: 'dist/server',
    tsconfig: 'tsconfig/server.json',
    clean: true,
    format: ["esm"],
    banner: {
      js: `import { createRequire } from 'module'; const require = createRequire(import.meta.url);`,
    },
    dts: false,
    splitting: false,
    sourcemap: false,
    minify: true,
    treeshake: true
}, {
    name: 'balancer',
    platform: 'node',
    noExternal: [/(.*)/],
    entry: ['src/balancer/index.ts'],
    external: ['./src/client/**/*'],
    outDir: 'dist/balancer',
    tsconfig: 'tsconfig/balancer.json',
    clean: true,
    format: ["esm"],
    banner: {
      js: `import { createRequire } from 'module'; const require = createRequire(import.meta.url);`,
    },
    dts: false,
    splitting: false,
    sourcemap: false,
    minify: true,
    treeshake: true
}])
