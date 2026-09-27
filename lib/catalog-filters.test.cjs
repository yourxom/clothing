// Characterization tests for preview-only catalogue discovery; no database is needed.
/* eslint-disable @typescript-eslint/no-require-imports -- The Node CommonJS test runner uses require(). */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
/* eslint-enable @typescript-eslint/no-require-imports */
function loadFilters() {
  const filename = path.join(__dirname, 'catalog-filters.ts');
  const source = fs.readFileSync(filename, 'utf8');
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const loaded = new Module(filename, module);
  loaded.filename = filename;
  loaded.paths = module.paths;
  loaded._compile(compiled, filename);
  return loaded.exports;
}
const products = [
  { slug: 'olive-kurta', name: 'Olive Kurta', category: 'kurtas', color: 'Olive', fabric: 'Cotton blend', description: 'Everyday edit', sizes: ['S', 'M'], price: 1500 },
  { slug: 'rose-dress', name: 'Rose Dress', category: 'dresses', color: 'Rose', fabric: 'Viscose', description: 'Evening edit', sizes: ['M'], price: 900 },
  { slug: 'rose-kurta', name: 'Rose Kurta', category: 'kurtas', color: 'Rose', fabric: 'Cotton', description: 'Relaxed edit', sizes: ['XL'], price: 1500 },
];
test('unfiltered discovery returns all products in source order without truncation', () => {
  const { filterPreviewProducts } = loadFilters();
  assert.deepEqual(filterPreviewProducts(products, {}).map(p => p.slug), products.map(p => p.slug));
});
test('search is case-insensitive, trimmed and matches name, color and fabric', () => {
  const { filterPreviewProducts } = loadFilters();
  assert.deepEqual(filterPreviewProducts(products, { query: '  coTton ' }).map(p => p.slug), ['olive-kurta', 'rose-kurta']);
  assert.deepEqual(filterPreviewProducts(products, { query: 'DRESS' }).map(p => p.slug), ['rose-dress']);
});
test('category, size and search combine; empty matches remain empty', () => {
  const { filterPreviewProducts } = loadFilters();
  assert.deepEqual(filterPreviewProducts(products, { category: 'kurtas', size: 'XL', query: 'rose' }).map(p => p.slug), ['rose-kurta']);
  assert.deepEqual(filterPreviewProducts(products, { category: 'dresses', size: 'XL' }), []);
});
test('sort orders use stable tie-breaking without mutating input', () => {
  const { filterPreviewProducts } = loadFilters();
  assert.deepEqual(filterPreviewProducts(products, { sort: 'price-asc' }).map(p => p.slug), ['rose-dress', 'olive-kurta', 'rose-kurta']);
  assert.deepEqual(filterPreviewProducts(products, { sort: 'price-desc' }).map(p => p.slug), ['olive-kurta', 'rose-kurta', 'rose-dress']);
  assert.deepEqual(filterPreviewProducts(products, { sort: 'name' }).map(p => p.slug), ['olive-kurta', 'rose-dress', 'rose-kurta']);
  assert.deepEqual(products.map(p => p.slug), ['olive-kurta', 'rose-dress', 'rose-kurta']);
});
test('unrecognized sort preserves source order and empty catalogue stays empty', () => {
  const { filterPreviewProducts } = loadFilters();
  assert.deepEqual(filterPreviewProducts(products, { sort: 'unexpected' }).map(p => p.slug), products.map(p => p.slug));
  assert.deepEqual(filterPreviewProducts([], { query: 'rose' }), []);
});
test('collection discovery is scoped before sorting and does not modify source', () => {
  const { filterPreviewProducts } = loadFilters();
  assert.deepEqual(filterPreviewProducts(products, { category: 'kurtas', query: 'cotton', sort: 'price-desc' }).map(p => p.slug), ['olive-kurta', 'rose-kurta']);
  assert.deepEqual(filterPreviewProducts(products, { category: 'kurtas', size: 'M', sort: 'price-asc' }).map(p => p.slug), ['olive-kurta']);
  assert.deepEqual(products.map(p => p.slug), ['olive-kurta', 'rose-dress', 'rose-kurta']);
});
test('exact color filtering does not conflate similar names and combines with size', () => {
  const { filterPreviewProducts } = loadFilters();
  assert.deepEqual(filterPreviewProducts(products, { color: 'rose', size: 'M' }).map(p => p.slug), ['rose-dress']);
  assert.deepEqual(filterPreviewProducts(products, { color: 'rose', size: 'XL' }).map(p => p.slug), ['rose-kurta']);
  assert.deepEqual(filterPreviewProducts(products, { color: 'red' }), []);
});
test('suggestions are bounded, use existing filters, and leave input unchanged', () => {
  const { suggestPreviewProducts } = loadFilters();
  assert.deepEqual(suggestPreviewProducts(products, ' rose ', 1).map(p => p.slug), ['rose-dress']);
  assert.deepEqual(suggestPreviewProducts(products, '  '), []);
  assert.deepEqual(suggestPreviewProducts(products, 'rose', 0), []);
  assert.deepEqual(products.map(p => p.slug), ['olive-kurta', 'rose-dress', 'rose-kurta']);
});
