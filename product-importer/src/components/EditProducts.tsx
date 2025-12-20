import { useState, useEffect } from "react";
import type { Product } from "./interface"

export const EditProduct = () => {
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
        <form onSubmit={handleSubmit}>
            <h2>Edit Product</h2>
            <label>sku</label>
            <input type="text" name="sku" value={product?.sku} disabled/>
            <label>Name</label>
            <input type="text" name="name" defaultValue={product?.name} />
            <label>Description</label>
            <textarea name="description" defaultValue={product?.description}></textarea>
            <button type="submit">Save</button>
        </form>
    )
}