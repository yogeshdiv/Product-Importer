import styles from "./Products.module.css";

export const ProductHeader = () => {
    return (
        <thead>
            <tr>
                <th className={styles.th}>Name</th>
                <th className={styles.th}>SKU</th>
                <th className={styles.th}>Description</th>
                <th className={styles.th}></th>
            </tr>
        </thead>
    )
}