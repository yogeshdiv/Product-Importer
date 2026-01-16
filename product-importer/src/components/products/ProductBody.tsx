import type { Product } from '../interface';
import { EditBtn, DeleteBtn } from '../index';
import styles from './Products.module.css';

interface ProductBodyProps {
    products: Product[];
    onDeleteSuccess?: () => void;
}

export const ProductBody = ({ products, onDeleteSuccess }: ProductBodyProps) => {
    return (
    <tbody className={styles.tbody}>
        {products.map((product: Product) => (
            <tr key={product.sku}>
                <td className={styles.td}>{product.name}</td>
                <td className={styles.td}>{product.sku}</td>
                <td className={styles.td}>{product.description}</td>
                <td className={styles.td}>
                    <div className={styles.actionButtons}>
                        <EditBtn sku={product.sku} />
                        <DeleteBtn 
                            sku={product.sku} 
                            productName={product.name}
                            onDeleteSuccess={onDeleteSuccess}
                        />
                    </div>
                </td>
            </tr>
        ))}
    </tbody>)
}