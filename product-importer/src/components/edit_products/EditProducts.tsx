import { useState, useEffect } from "react";
import type { Product } from "../interface"
import styles from './EditProducts.module.css';
import { useNavigate } from "react-router-dom";

export const EditProduct = () => {
    const navigator = useNavigate()
    const urlParams = new URLSearchParams(window.location.search);
    const sku = urlParams.get("sku");
    console.log(sku)
    const [product, setProducts] = useState<Product | null>(null);
    useEffect(() => {
        const fetchProduct = async () => {
            const res = await fetch(`http://localhost:8000/products/${sku}`);
            const product: Product = await res.json();
            console.log(product)
            setProducts(product);
        }
        fetchProduct();
    }, [sku]);
    const handleCancelClick = () => {
        navigator(`/`)
    }
    const handleSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
        e.preventDefault();
        const form = e.currentTarget;
        const formData = new FormData(form);

        const description = formData.get("description") as string;
        const name = formData.get("name") as string;
        const UpdateApi = async () => {
            const res = await fetch(`http://localhost:8000/products`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    sku: sku,
                    name: name,
                    description: description
                })
            });
            if (res.ok) {
                alert('Product updated');
            }
        }
        UpdateApi();

    }
    return (
        <form className={styles.form} onSubmit={handleSubmit}>
            <h2 className={styles.title}>Edit Product</h2>

            <div className={styles.field}>
                <label>SKU</label>
                <input type="text" name="sku" value={product?.sku} disabled />
            </div>

            <div className={styles.field}>
                <label>Name</label>
                <input type="text" name="name" defaultValue={product?.name} />
            </div>

            <div className={styles.field}>
                <label>Description</label>
                <textarea
                name="description"
                defaultValue={product?.description}
                rows={4}
                />
            </div>
            <div className={styles.actions}>
                <button type="submit">Save</button>
                <button type="button" onClick={handleCancelClick}>Cancel</button>
            </div>
            </form>
    )
}