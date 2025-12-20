import type { Product } from './interface'
import { useState, useEffect } from 'react'
import { UploadBtn, EditBtn } from './index';
export const Products = () => {
    const [products, setProducts] = useState<Product[]>([]);
    useEffect(() => {
        const fetchProducts = async () => {
        try {
            const res = await fetch("http://localhost:8000/products");
            const json = await res.json();
            setProducts(json.products);
        } catch (err) {
            console.error("Failed to fetch products", err);
        }
        };
        console.log("called fetch products")
        fetchProducts();
    }, []);
    return (
        <div>
            <UploadBtn />
            <h2>Products</h2>
            <table>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>SKU</th>
                        <th>Description</th>
                    </tr>
                </thead>
                <tbody>
                    {products.map((product: Product, index: number) => (
                        <tr key={index}>
                            <td>{product.name}</td>
                            <td>{product.sku}</td>
                            <td>{product.description}</td>
                            <td><EditBtn sku={product.sku} /></td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}
