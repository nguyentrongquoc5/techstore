import { storageService } from './storageService';
import type { Product, Category } from '../types';
import { products as mockProducts, categories as mockCategories } from '../data/mockData';

const PRODUCTS_KEY = 'products';
const CATEGORIES_KEY = 'categories';

function ensureProducts(): Product[] {
  let products = storageService.get<Product[]>(PRODUCTS_KEY, []);
  if (products.length === 0) {
    products = mockProducts;
    storageService.set(PRODUCTS_KEY, products);
  }
  return products;
}

function ensureCategories(): Category[] {
  let cats = storageService.get<Category[]>(CATEGORIES_KEY, []);
  if (cats.length === 0) {
    cats = mockCategories;
    storageService.set(CATEGORIES_KEY, cats);
  }
  // update product counts
  const products = ensureProducts();
  return cats.map((c) => ({
    ...c,
    productCount: products.filter((p) => p.categoryId === c.id).length,
  }));
}

export const productService = {
  getAll(): Product[] {
    return ensureProducts();
  },

  getById(id: string): Product | undefined {
    return ensureProducts().find((p) => p.id === id);
  },

  getFeatured(): Product[] {
    return ensureProducts().filter((p) => p.isFeatured && p.status === 'active');
  },

  getBestSellers(): Product[] {
    return ensureProducts().filter((p) => p.isBestSeller && p.status === 'active');
  },

  getByCategory(categoryId: string): Product[] {
    return ensureProducts().filter((p) => p.categoryId === categoryId && p.status === 'active');
  },

  search(query: string): Product[] {
    const q = query.toLowerCase().trim();
    if (!q) return ensureProducts().filter((p) => p.status === 'active');
    return ensureProducts().filter(
      (p) =>
        p.status === 'active' &&
        (p.name.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.categoryName.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q))
    );
  },

  create(data: Omit<Product, 'id' | 'slug' | 'createdAt'>): Product {
    const products = ensureProducts();
    const id = `prod-${Date.now()}`;
    const newProduct: Product = {
      ...data,
      id,
      slug: data.name.toLowerCase().replace(/\s+/g, '-') + '-' + id,
      createdAt: new Date().toISOString(),
    };
    products.push(newProduct);
    storageService.set(PRODUCTS_KEY, products);
    return newProduct;
  },

  update(id: string, data: Partial<Product>): Product | null {
    const products = ensureProducts();
    const idx = products.findIndex((p) => p.id === id);
    if (idx === -1) return null;
    products[idx] = { ...products[idx], ...data, id };
    storageService.set(PRODUCTS_KEY, products);
    return products[idx];
  },

  delete(id: string): boolean {
    const products = ensureProducts();
    const filtered = products.filter((p) => p.id !== id);
    if (filtered.length === products.length) return false;
    storageService.set(PRODUCTS_KEY, filtered);
    return true;
  },

  getCategories(): Category[] {
    return ensureCategories();
  },

  createCategory(data: Omit<Category, 'id' | 'slug' | 'productCount'>): Category {
    const cats = storageService.get<Category[]>(CATEGORIES_KEY, mockCategories);
    const id = `cat-${Date.now()}`;
    const newCat: Category = {
      ...data,
      id,
      slug: data.name.toLowerCase().replace(/\s+/g, '-'),
      productCount: 0,
    };
    cats.push(newCat);
    storageService.set(CATEGORIES_KEY, cats);
    return newCat;
  },

  updateCategory(id: string, data: Partial<Category>): Category | null {
    const cats = storageService.get<Category[]>(CATEGORIES_KEY, mockCategories);
    const idx = cats.findIndex((c) => c.id === id);
    if (idx === -1) return null;
    cats[idx] = { ...cats[idx], ...data, id };
    storageService.set(CATEGORIES_KEY, cats);
    return cats[idx];
  },

  deleteCategory(id: string): boolean {
    const cats = storageService.get<Category[]>(CATEGORIES_KEY, mockCategories);
    const filtered = cats.filter((c) => c.id !== id);
    if (filtered.length === cats.length) return false;
    storageService.set(CATEGORIES_KEY, filtered);
    return true;
  },
};
