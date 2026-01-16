import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { confirmAlert } from 'react-confirm-alert';
import 'react-confirm-alert/src/react-confirm-alert.css';
import './ConfirmModal.css';
import styles from './DeleteBtn.module.css';

interface DeleteBtnProps {
  sku: string;
  productName?: string;
  onDeleteSuccess?: () => void;
}

export const DeleteBtn = ({ sku, productName, onDeleteSuccess }: DeleteBtnProps) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteClick = () => {
    const displayName = productName || sku;

    confirmAlert({
      title: 'Delete Product',
      message: `Are you sure you want to delete "${displayName}"? This action cannot be undone.`,
      buttons: [
        {
          label: 'Cancel',
          onClick: () => {}
        },
        {
          label: 'Delete',
          onClick: async () => {
            setIsDeleting(true);
            try {
              const res = await fetch(`http://localhost:8000/products/${sku}`, {
                method: 'DELETE'
              });

              if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData?.error || 'Failed to delete product');
              }

              if (onDeleteSuccess) {
                onDeleteSuccess();
              }
            } catch (err) {
              console.error('Delete failed', err);
              alert(err instanceof Error ? err.message : 'Failed to delete product');
            } finally {
              setIsDeleting(false);
            }
          },
          className: 'delete-button'
        }
      ],
      closeOnEscape: true,
      closeOnClickOutside: true,
      overlayClassName: 'confirm-overlay'
    });
  };

  return (
    <button
      className={styles.iconButton}
      onClick={handleDeleteClick}
      aria-label="Delete product"
      disabled={isDeleting}
    >
      <Trash2 size={16} />
    </button>
  );
};

