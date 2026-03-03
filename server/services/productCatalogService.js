const fs = require('fs');
const path = require('path');

const FRONTEND_PRODUCTS_FILE_PATH = path.resolve(__dirname, '../../src/data/products.ts');
const PRODUCT_ENTRY_REGEX = /\{\s*id:\s*["']([^"']+)["']\s*,\s*category:\s*['"][^'"]+['"]\s*,\s*name:\s*'([^']+)'\s*,\s*price:\s*([0-9]+(?:\.[0-9]+)?)/g;

const LEGACY_PRODUCT_ID_ALIASES = {
  'kibo-10': '1',
  'kibo-15': '2',
  'kibo-18': '3',
  'kibo-21': '4',
  'marker-set': '209',
  'building-brick': '202',
  'expression-module': '205',
  'sound-record': '211',
};

const createProductCatalogService = () => {
  const loadCatalog = () => {
    const source = fs.readFileSync(FRONTEND_PRODUCTS_FILE_PATH, 'utf8');
    const productsById = new Map();

    let match;
    while ((match = PRODUCT_ENTRY_REGEX.exec(source)) !== null) {
      const [, id, name, rawPrice] = match;
      const productId = String(id || '').trim();
      const productName = String(name || '').trim();
      const price = Number(rawPrice);

      if (!productId || !productName || !Number.isFinite(price) || price < 0) {
        continue;
      }

      productsById.set(productId, {
        id: productId,
        name: productName,
        price,
      });
    }

    if (productsById.size === 0) {
      throw new Error('Product catalog could not be loaded from src/data/products.ts');
    }

    for (const [legacyId, canonicalId] of Object.entries(LEGACY_PRODUCT_ID_ALIASES)) {
      const canonicalProduct = productsById.get(canonicalId);
      if (canonicalProduct) {
        productsById.set(legacyId, canonicalProduct);
      }
    }

    return productsById;
  };

  let productsById = loadCatalog();

  return {
    getProductById(productId) {
      const normalizedId = String(productId || '').trim();
      if (!normalizedId) {
        return null;
      }

      return productsById.get(normalizedId) || null;
    },

    reload() {
      productsById = loadCatalog();
      return productsById.size;
    },

    size() {
      return productsById.size;
    },
  };
};

module.exports = createProductCatalogService;
