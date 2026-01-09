import type { Product, ProductsResponse } from './interface'
import { useState, useEffect, useRef } from 'react'
import { UploadBtn, ProductBody, ProductHeader, SampleCsv } from './index';
import { NavBar } from './NavBar';
import styles from './Products.module.css';
export const Products = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [cursor, setCursor] = useState<number | null>(0);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [refreshKey, setRefreshKey] = useState(0);

    const abortRef = useRef<AbortController | null>(null);

    const fetchProducts = async () => {
        if (loading || !hasMore) return;

        setLoading(true);
        abortRef.current?.abort();
        abortRef.current = new AbortController();

        try {
            const res = await fetch(
                `http://localhost:8000/products?cursor=${cursor}&count=10`,
                { signal: abortRef.current.signal }
            );

            const data: ProductsResponse = await res.json();

            setProducts(prev => [...prev, ...data.products]);
            setCursor(data.next_cursor);
            setHasMore(data.has_more);
        } catch (err) {
            if ((err as any).name !== 'AbortError') {
                console.error('Fetch failed', err);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
        return () => abortRef.current?.abort();
    }, [refreshKey]);

    const refreshProducts = () => {
        abortRef.current?.abort();
        setProducts([]);
        setCursor(0);
        setHasMore(true);
        setRefreshKey(prev => prev + 1);
    };

    return (
        <>
            <NavBar />
            <div className={styles.container}>
                <UploadBtn onUploadComplete={refreshProducts} />
                <SampleCsv />
                <h2>Products</h2>
                <table>
                    <ProductHeader />
                    <ProductBody products={products} />
                </table>
                {hasMore && (
                    <button onClick={fetchProducts} disabled={loading}>
                        {loading ? 'Loading...' : 'Load more'}
                    </button>
                )}
            </div>
        </>
    );
};
