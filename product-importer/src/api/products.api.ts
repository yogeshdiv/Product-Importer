import type { Product, ProductsResponse } from '../components/interface'

const BASE_URL = 'http://localhost:8000';

type GetProductsParams = {
  sku?: string;          // exact match
  q?: string;            // search
  cursor?: number | null;
  limit?: number;
};

export async function getProducts({
  sku,
  q,
  cursor = null,
  limit = 90,
}: GetProductsParams = {}): Promise<ProductsResponse> {

  // ❌ invalid usage
  if (sku && q) {
    throw new Error("Use either sku or q, not both");
  }

  const params = new URLSearchParams();

  if (sku) params.append("sku", sku);
  if (q && q.trim()) params.append("q", q.trim());
  if (cursor !== null) params.append("cursor", cursor.toString());
  params.append("limit", limit.toString());

  const res = await fetch(`${BASE_URL}/products?${params.toString()}`, {
    method: "GET",
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData?.detail || "Failed to fetch products");
  }

  return await res.json();
}


export async function postProduct(product: Product): Promise<any> {

  const res = await fetch(`${BASE_URL}/products`, {
    method: 'POST',
    body: JSON.stringify({
        sku: product.sku,
        name: product.name,
        description: product.description
    })
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData?.detail?.message || 'Upload failed');
  }

  return await res.json();
}