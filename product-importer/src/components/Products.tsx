import type { Product } from './interface'
import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { UploadBtn, ProductBody, ProductHeader, SampleCsv, Pagination, SearchInput } from './index';
import { NavBar } from './NavBar';
import { getProducts } from '../api/products.api';
import styles from './Products.module.css';

const BATCH_SIZE = 90;
const PAGE_SIZE = 15;

export const Products = () => {
    const [allProducts, setAllProducts] = useState<Product[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [nextCursor, setNextCursor] = useState<number | null>(null);
    const [hasMore, setHasMore] = useState(true);
    const [totalCount, setTotalCount] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [loadingBatch, setLoadingBatch] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchMode, setIsSearchMode] = useState(false);

    const abortRef = useRef<AbortController | null>(null);

    // Calculate which products to display for current page
    const displayedProducts = useMemo(() => {
        const startIndex = (currentPage - 1) * PAGE_SIZE;
        const endIndex = startIndex + PAGE_SIZE;
        return allProducts.slice(startIndex, endIndex);
    }, [allProducts, currentPage]);

    // Calculate total pages based on loaded products and whether there are more
    const totalPages = useMemo(() => {
        if (totalCount !== null && totalCount > 0) {
            return Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
        }
        // If we don't know total count, calculate based on loaded products
        if (allProducts.length === 0) {
            return 1; // At least 1 page even if empty
        }
        const pagesFromLoaded = Math.ceil(allProducts.length / PAGE_SIZE);
        // If we have more products to load, we need at least one more page
        // Always ensure we have at least the pages from loaded products
        if (hasMore) {
            return pagesFromLoaded + 1; // Add one more page if there are more products
        }
        return Math.max(1, pagesFromLoaded); // Use pages from loaded products
    }, [allProducts.length, hasMore, totalCount]);

    const loadingBatchRef = useRef(false);

    const fetchNextBatch = useCallback(async (cursor: number | null = null) => {
        if (loadingBatchRef.current) return;

        loadingBatchRef.current = true;
        setLoadingBatch(true);
        abortRef.current?.abort();
        abortRef.current = new AbortController();

        try {
            const data = await getProducts({cursor: cursor, limit: BATCH_SIZE});

            setAllProducts(prev => [...prev, ...data.products]);
            setNextCursor(data.next_cursor);
            setHasMore(data.has_more);
            if (data.total_count !== null) {
                setTotalCount(data.total_count);
            }
        } catch (err) {
            if ((err as any).name !== 'AbortError') {
                console.error('Fetch failed', err);
            }
        } finally {
            loadingBatchRef.current = false;
            setLoadingBatch(false);
        }
    }, []);

    const fetchSearchResults = useCallback(async (query: string, cursor: number | null = null) => {
        if (loadingBatchRef.current) return;

        loadingBatchRef.current = true;
        setLoadingBatch(true);
        abortRef.current?.abort();
        abortRef.current = new AbortController();

        try {
            const data = await getProducts({q: query, cursor: cursor, limit: BATCH_SIZE});

            if (cursor === null) {
                // First page of search results
                setAllProducts(data.products);
            } else {
                // Append next batch
                setAllProducts(prev => [...prev, ...data.products]);
            }
            setNextCursor(data.next_cursor);
            setHasMore(data.has_more);
            if (data.total_count !== null) {
                setTotalCount(data.total_count);
            }
        } catch (err) {
            if ((err as any).name !== 'AbortError') {
                console.error('Search failed', err);
            }
        } finally {
            loadingBatchRef.current = false;
            setLoadingBatch(false);
        }
    }, []);

    // Handle search query changes
    useEffect(() => {
        const query = searchQuery.trim();
        if (query) {
            setIsSearchMode(true);
            setCurrentPage(1);
            setLoading(true);
            fetchSearchResults(query, null).finally(() => setLoading(false));
        } else {
            setIsSearchMode(false);
            // Reset to normal mode
            setAllProducts([]);
            setNextCursor(null);
            setHasMore(true);
            setTotalCount(null);
            setCurrentPage(1);
            setLoading(true);
            fetchNextBatch(null).finally(() => setLoading(false));
        }
    }, [searchQuery, fetchSearchResults, fetchNextBatch]);

    // Check if we need to fetch next batch when page changes
    useEffect(() => {
        if (isSearchMode) {
            // In search mode, fetch next batch if needed
            const productsNeeded = currentPage * PAGE_SIZE;
            if (productsNeeded > allProducts.length && hasMore && nextCursor !== null && !loadingBatch) {
                fetchSearchResults(searchQuery.trim(), nextCursor);
            }
        } else {
            // In normal mode, fetch next batch if needed
            const productsNeeded = currentPage * PAGE_SIZE;
            if (productsNeeded > allProducts.length && hasMore && nextCursor !== null && !loadingBatch) {
                fetchNextBatch(nextCursor);
            }
        }
    }, [currentPage, allProducts.length, hasMore, nextCursor, loadingBatch, isSearchMode, searchQuery, fetchNextBatch, fetchSearchResults]);

    const handlePageChange = (page: number) => {
        if (page >= 1 && page !== currentPage) {
            setCurrentPage(page);
        }
    };

    const refreshProducts = () => {
        abortRef.current?.abort();
        setAllProducts([]);
        setNextCursor(null);
        setHasMore(true);
        setTotalCount(null);
        setCurrentPage(1);
        setSearchQuery('');
        setIsSearchMode(false);
        setLoading(true);
        fetchNextBatch(null).finally(() => setLoading(false));
    };

    const handleSearch = (query: string) => {
        setSearchQuery(query);
    };

    return (
        <>
            <NavBar />
            <div className={styles.container}>
                <UploadBtn onUploadComplete={refreshProducts} />
                <SampleCsv />
                <h2>Products</h2>
                <SearchInput
                    placeholder="Search by SKU, name, or description..."
                    onSearch={handleSearch}
                    className={styles.searchInput}
                />
                {loading && allProducts.length === 0 ? (
                    <div className={styles.loading}>Loading products...</div>
                ) : (
                    <>
                        {isSearchMode && searchQuery && (
                            <div className={styles.searchInfo}>
                                {totalCount !== null ? (
                                    <>Found {totalCount} result{totalCount !== 1 ? 's' : ''} for "{searchQuery}"</>
                                ) : (
                                    <>Searching for "{searchQuery}"...</>
                                )}
                            </div>
                        )}
                        {totalCount !== null && !isSearchMode && (
                            <div className={styles.productCount}>
                                Showing {displayedProducts.length} of {totalCount} products
                                {loadingBatch && <span className={styles.loadingBatch}> (Loading more...)</span>}
                            </div>
                        )}
                        {isSearchMode && totalCount === 0 && !loading && (
                            <div className={styles.productCount}>
                                No products found for "{searchQuery}"
                            </div>
                        )}
                        {displayedProducts.length === 0 && !loading ? (
                            <div className={styles.loading}>No products found</div>
                        ) : (
                            <>
                                <table>
                                    <ProductHeader />
                                    <ProductBody 
                                        products={displayedProducts} 
                                        onDeleteSuccess={refreshProducts}
                                    />
                                </table>
                                {displayedProducts.length > 0 && totalPages > 1 && (
                                    <Pagination
                                        currentPage={currentPage}
                                        totalPages={totalPages}
                                        onPageChange={handlePageChange}
                                    />
                                )}
                            </>
                        )}
                    </>
                )}
            </div>
        </>
    );
};
