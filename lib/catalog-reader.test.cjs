// Characterization tests for the server-side preview catalogue; no database is needed.
/* eslint-disable @typescript-eslint/no-require-imports -- Node CommonJS test runner uses require(). */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
/* eslint-enable @typescript-eslint/no-require-imports */

function loadReader({ database, databaseUrl } = {}) {
  const filename = path.join(__dirname, 'catalog-reader.ts');
  const source = fs.readFileSync(filename, 'utf8');
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const mockCatalog = {
    products: [{ slug: 'fallback', name: 'Preview', category: 'kurtas', color: 'Olive', fabric: 'Cotton', price: 100, mrp: 200, tone: 'olive', description: 'Demo', sizes: ['S'] }],
  };
  const loaded = new Module(filename, module);
  loaded.filename = filename;
  loaded.paths = module.paths;
  const originalRequire = loaded.require.bind(loaded);
  loaded.require = id => {
    if (id === '@/lib/catalog') return mockCatalog;
    if (id === '@prisma/client') return { PrismaClient: class { constructor() { return database; } } };
    return originalRequire(id);
  };
  loaded._compile(compiled, filename);
  return {
    ...loaded.exports,
    async getPreviewProducts() {
      const previousUrl = process.env.DATABASE_URL;
      try {
        if (databaseUrl === undefined) delete process.env.DATABASE_URL;
        else process.env.DATABASE_URL = databaseUrl;
        return await loaded.exports.getPreviewProducts();
      } finally {
        if (previousUrl === undefined) delete process.env.DATABASE_URL;
        else process.env.DATABASE_URL = previousUrl;
      }
    },
  };
}

const record = {
  slug: 'demo-kurta', name: 'Demo Kurta', color: 'Olive', fabric: 'Cotton', tone: 'olive',
  description: 'Demo only', price: 123499, mrp: 150000, published: false,
  category: { slug: 'kurtas' }, variants: [{ size: 'XL' }, { size: 'S' }],
};

test('maps paise to rupees and variant sizes without changing the preview contract', () => {
  const { mapPreviewProduct } = loadReader();
  assert.deepEqual(mapPreviewProduct(record), {
    slug: 'demo-kurta', name: 'Demo Kurta', category: 'kurtas', color: 'Olive', fabric: 'Cotton',
    price: 1234.99, mrp: 1500, tone: 'olive', description: 'Demo only', sizes: ['S', 'XL'],
  });
});

test('without a database URL, the in-memory preview remains available', async () => {
  const { getPreviewProducts } = loadReader();
  assert.equal((await getPreviewProducts())[0].slug, 'fallback');
});

test('successful empty database result is not replaced with demo fallback', async () => {
  const { getPreviewProducts } = loadReader({ databaseUrl: 'mysql://example', database: { product: { findMany: async () => [] } } });
  assert.deepEqual(await getPreviewProducts(), []);
});

test('connection failure falls back, while unexpected query errors do not', async () => {
  const offline = loadReader({ databaseUrl: 'mysql://example', database: { product: { findMany: async () => { throw { code: 'P1001' }; } } } });
  assert.equal((await offline.getPreviewProducts())[0].slug, 'fallback');
  const invalid = loadReader({ databaseUrl: 'mysql://example', database: { product: { findMany: async () => { throw new Error('Invalid query'); } } } });
  await assert.rejects(invalid.getPreviewProducts(), /Invalid query/);
});

test('reads only unpublished concepts from the database', async () => {
  let query;
  const { getPreviewProducts } = loadReader({ databaseUrl: 'mysql://example', database: { product: { findMany: async options => { query = options; return [record]; } } } });
  assert.equal((await getPreviewProducts())[0].slug, 'demo-kurta');
  assert.equal(query.where.published, false);
});
