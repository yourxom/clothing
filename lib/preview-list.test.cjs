// Preview-only browser list contract tests. No live database or orders are involved.
/* eslint-disable @typescript-eslint/no-require-imports -- Node's CommonJS test runner uses require(). */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
/* eslint-enable @typescript-eslint/no-require-imports */
function load() {
  const filename = path.join(__dirname, 'preview-list.ts');
  const source = fs.readFileSync(filename, 'utf8');
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const loaded = new Module(filename, module);
  loaded.filename = filename;
  loaded.paths = module.paths;
  loaded._compile(compiled, filename);
  return loaded.exports;
}
const item = { slug: 'rose-kurta', size: 'M', quantity: 1 };
test('invalid and outdated storage never creates a cart or wishlist', () => {
  const { parsePreviewList } = load();
  assert.deepEqual(parsePreviewList('{'), { wishlist: [], bag: [] });
  assert.deepEqual(parsePreviewList(JSON.stringify({ version: 0, wishlist: ['x'], bag: [item] })), { wishlist: [], bag: [] });
  assert.deepEqual(parsePreviewList(JSON.stringify({ version: 1, wishlist: ['../../bad', 'rose-kurta', 'rose-kurta'], bag: [{ ...item, quantity: -1 }, item] })), { wishlist: ['rose-kurta'], bag: [item] });
});
test('wishlist toggles without duplicates and respects valid slugs', () => {
  const { toggleWishlist, emptyPreviewList } = load();
  const saved = toggleWishlist(emptyPreviewList, 'rose-kurta');
  assert.deepEqual(saved.wishlist, ['rose-kurta']);
  assert.deepEqual(toggleWishlist(saved, 'rose-kurta').wishlist, []);
  assert.deepEqual(toggleWishlist(saved, 'bad slug'), saved);
  assert.deepEqual(emptyPreviewList.wishlist, []);
});
test('bag separates sizes, combines duplicates, caps quantity, and removes items', () => {
  const { addToBag, setBagQuantity, emptyPreviewList } = load();
  const initial = addToBag(emptyPreviewList, 'rose-kurta', 'M');
  assert.deepEqual(addToBag(initial, 'rose-kurta', 'M').bag, [{ ...item, quantity: 2 }]);
  assert.equal(addToBag(initial, 'rose-kurta', 'L').bag.length, 2);
  assert.deepEqual(addToBag(initial, 'rose-kurta', '').bag, initial.bag);
  assert.equal(setBagQuantity(initial, 'rose-kurta', 'M', 999).bag[0].quantity, 10);
  assert.deepEqual(setBagQuantity(initial, 'rose-kurta', 'M', 0).bag, []);
});
test('storage cannot become an order or unbounded list', () => {
  const { parsePreviewList, emptyPreviewList } = load();
  const raw = JSON.stringify({ version: 1, wishlist: Array.from({ length: 120 }, (_, n) => `style-${n}`), bag: [{ ...item, quantity: 900 }, { slug: 'x', size: 'M', quantity: '3' }] });
  const state = parsePreviewList(raw);
  assert.equal(state.wishlist.length, 100);
  assert.deepEqual(state.bag, [{ ...item, quantity: 10 }]);
  assert.deepEqual(parsePreviewList(null), emptyPreviewList);
});
