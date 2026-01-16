export type Product = {
    id?: number;
    name: string;
    sku: string;
    description: string;
}

export type ProductsProps = {
    products: Product[];
}

export type File = {
    id: number;
    file_name: string;
    status: string;
    total_number_of_records: number;
    records_inserted: number;
    records_updated: number;
    file_with_errors: string;
}

export interface ProductsResponse {
  products: Product[];
  next_cursor: number | null;
  has_more: boolean;
  total_count: number | null;
}
