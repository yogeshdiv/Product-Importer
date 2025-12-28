import type { Product } from './interface'
import { useState, useEffect } from 'react'
import { UploadBtn, ProductBody, ProductHeader } from './index';
import styles from './Products.module.css';
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
        fetchProducts();
    }, []);
    return (
        <div className={styles.container}>
            <UploadBtn />
            <h2>Products</h2>
            <table>
                <ProductHeader />
                <ProductBody products={products} />
            </table>
        </div>
    )
}
