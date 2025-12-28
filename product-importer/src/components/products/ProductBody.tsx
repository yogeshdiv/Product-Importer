import type { Product } from '../interface';
import { EditBtn } from '../index';
import styles from './Products.module.css';
export const ProductBody = ({ products }: { products: Product[] }) => {
    return (
    <tbody className={styles.tbody}>
        {products.map((product: Product) => (
            <tr key={product.sku}>
                <td className={styles.td}>{product.name}</td>
                <td className={styles.td}>{product.sku}</td>
                <td className={styles.td}>{product.description}</td>
                <td className={styles.td}><EditBtn sku={product.sku} /></td>
            </tr>
        ))}
    </tbody>)
}