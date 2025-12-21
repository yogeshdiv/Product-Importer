export type Product = {
    name: string;
    sku: string;
    description: string;
}

export type ProductsProps = {
    products: Product[];
}