DROP INDEX IF EXISTS products_sku_key;

ALTER TABLE public.products
  ALTER COLUMN sku DROP NOT NULL,
  DROP CONSTRAINT IF EXISTS products_sku_not_blank;

CREATE UNIQUE INDEX IF NOT EXISTS products_sku_key ON public.products (lower(sku)) WHERE sku IS NOT NULL;
