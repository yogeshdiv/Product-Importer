import { useNavigate } from "react-router-dom";
import { Pencil } from "lucide-react";
import styles from './EditBtn.module.css';

export const EditBtn = ({ sku }: { sku: string }) => {
    const navigator = useNavigate();
    const handleClick = (): void => {
        navigator(`/edit?sku=${sku}`);
    }
    return (
        <button
            className={styles.iconButton}
            onClick={() => handleClick()}
            aria-label="Edit product"
        >
            <Pencil size={16} />
        </button>
    )
}
