const fs = require('fs');
const path = require('path');

const SHARED_PRODUCT_CATALOG_PATH = path.resolve(__dirname, '../../src/data/productCatalog.json');

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
    const source = fs.readFileSync(SHARED_PRODUCT_CATALOG_PATH, 'utf8');
    const entries = JSON.parse(source);
    const productsById = new Map();

    for (const entry of Array.isArray(entries) ? entries : []) {
      const productId = String(entry?.id || '').trim();
      const productName = String(entry?.name || '').trim();
      const price = Number(entry?.price);
      const slug = String(entry?.slug || '').trim();
      const detailPath = String(entry?.detailPath || '').trim();

      if (!productId || !productName || !Number.isFinite(price) || price < 0) {
        continue;
      }

      productsById.set(productId, {
        id: productId,
        name: productName,
        price,
        slug,
        detailPath,
      });
    }

    if (productsById.size === 0) {
      throw new Error('Product catalog could not be loaded from src/data/productCatalog.json');
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
