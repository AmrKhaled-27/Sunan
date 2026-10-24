// Execute repository TypeScript with its installed compiler, without a test dependency.
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
function createLoader(mocks = {}) {
  const cache = new Map();
  function load(file) {
    if (Object.hasOwn(mocks, file)) return mocks[file];
    const resolved = file.startsWith('@/') ? path.resolve(__dirname, '..', file.slice(2)) : file;
    let full = path.resolve(resolved);
    if (!path.extname(full)) full += ['.ts', '.tsx', '.js', '/index.ts'].find(suffix => fs.existsSync(full + suffix)) ?? '.ts';
    if (full.endsWith('.js')) return require(full);
    if (cache.has(full)) return cache.get(full).exports;
    const mod = { exports: {} };
    cache.set(full, mod);
    const js = ts.transpileModule(fs.readFileSync(full, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
    }).outputText;
    new Function('require', 'module', 'exports', js)((id) => {
      if (Object.hasOwn(mocks, id)) return mocks[id];
      if (id.startsWith('@/')) return load(id);
      if (id.startsWith('.')) return load(path.resolve(path.dirname(full), id));
      return require(id);
    }, mod, mod.exports);
    return mod.exports;
  }
  return load;
}
module.exports = { createLoader };
