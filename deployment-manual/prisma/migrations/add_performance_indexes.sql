-- Safe Performance Optimization Indexes
-- This migration ONLY adds indexes, NO data changes
-- Can be safely rolled back anytime

-- 1. Product Category Index (for faster category queries)
CREATE INDEX IF NOT EXISTS idx_product_category_status ON Product(categoryId, status);

-- 2. Product Name Index (for faster search)
CREATE INDEX IF NOT EXISTS idx_product_name ON Product(name);

-- 3. Category Slug Index (for faster category lookup)
CREATE INDEX IF NOT EXISTS idx_category_slug ON Category(slug);

-- 4. Product Slug Index (for faster product lookup)
CREATE INDEX IF NOT EXISTS idx_product_slug ON Product(slug);

-- 5. Order Date Index (for faster order queries)
CREATE INDEX IF NOT EXISTS idx_order_created_at ON Order(createdAt);

-- 6. Inventory Product Index (for faster inventory lookup)
CREATE INDEX IF NOT EXISTS idx_inventory_product ON Inventory(productId);

-- 7. Product Image Order Index (for faster image sorting)
CREATE INDEX IF NOT EXISTS idx_product_image_order ON ProductImage(productId, "order");

-- 8. Composite Index for Product Search
CREATE INDEX IF NOT EXISTS idx_product_search ON Product(categoryId, status, name);

-- 9. Composite Index for Category Products
CREATE INDEX IF NOT EXISTS idx_category_products ON Product(categoryId, status, createdAt);

-- 10. Order Status Index (for faster order filtering)
CREATE INDEX IF NOT EXISTS idx_order_status ON Order(status, createdAt);
