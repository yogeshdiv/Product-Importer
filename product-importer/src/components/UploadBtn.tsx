import { useState } from 'react';
import { X } from 'lucide-react';
import styles from './UploadBtn.module.css';
import { uploadFile, openUploadProgressSocket } from '../api/files';

type UploadStatus = 'idle' | 'uploading' | 'processing' | 'completed' | 'error';

type UploadItem = {
  id: string;
  filename: string;
  status: UploadStatus;
  progress: number;
  total: number;
  errors: number;
  errorMessage?: string;
};


interface UploadBtnProps {
    onUploadComplete: () => void;
}

export const UploadBtn = ({ onUploadComplete }: UploadBtnProps) => {
    const [progress, setProgress] = useState<number>(0);
    const [total, setTotal] = useState<number>(0);
    const [errors, setErrors] = useState<number>(0);
    const [uploads, setUploads] = useState<UploadItem[]>([]);
    const [errorMessage, setErrorMessage] = useState<string>('');
    // const [isUploading, setIsUploading] = useState<boolean>(false);

    const resetState = () => {
        setProgress(0);
        setTotal(0);
        setErrors(0);
        setUploads([]);
        setErrorMessage('');
        // setIsUploading(false);
    };

    const addUpload = (file: File) => {
        const upload: UploadItem = {
            id: crypto.randomUUID(),
            filename: file.name,
            status: 'uploading',
            progress: 0,
            total: 0,
            errors: 0,
        };

        setUploads(prev => [...prev, upload]);
        return upload.id;
    };

    const updateUpload = (
        id: string,
        updates: Partial<UploadItem>
        ) => {
        setUploads(prev =>
            prev.map(upload =>
            upload.id === id ? { ...upload, ...updates } : upload
            )
        );
    };


    const handleClick = async (): Promise<void> => {
        const fileInput = document.getElementById('fileInput') as HTMLInputElement | null;
        if (!fileInput || !fileInput.files?.[0]) {
            setErrorMessage('Please select a file to upload');
            return;
        }

        const file = fileInput.files[0];
        const uploadId = addUpload(file);

        updateUpload(uploadId, { status: 'uploading' });
        setErrorMessage('');

        try {
            const fileId = await uploadFile(file);
            updateUpload(uploadId, { status: 'processing' });

            const ws = openUploadProgressSocket(fileId);

            ws.onmessage = (event) => {
            const message = JSON.parse(event.data);

            if (message.status === 'completed') {
                updateUpload(uploadId, {
                status: 'completed',
                progress: message.progress ?? 0,
                errors: message.errors ?? 0,
                });
                onUploadComplete();
                ws.close();
            }
            else if (message.status === 'error') {
                updateUpload(uploadId, {
                status: 'error',
                errorMessage: message.message,
                });
                ws.close();
            }
            else {
                updateUpload(uploadId, {
                status: 'processing',
                progress: message.progress ?? 0,
                total: message.total ?? 0,
                errors: message.errors ?? 0,
                });
            }
            };

            ws.onerror = () => {
            updateUpload(uploadId, {
                status: 'error',
                errorMessage: 'Connection error. Please try again.',
            });
            };

            ws.onclose = () => {
            const upload = uploads.find(u => u.id === uploadId);
            if (upload && !['completed', 'error'].includes(upload.status)) {
                updateUpload(uploadId, {
                status: 'error',
                errorMessage: 'Connection closed unexpectedly.',
                });
            }
            };

        } catch (err: any) {
            updateUpload(uploadId, {
            status: 'error',
            errorMessage: err.message || 'Network error',
            });
        }
    };


    const progressPercentage = (total: number, progress: number) => {
        return total > 0 ? Math.round((progress / total) * 100) : 0;
    }

    const checkNumber = () => {
        return uploads.length > 4
    }

    const handleCloseUpload = (uploadId: string) => {
        setUploads(prev => prev.filter(upload => upload.id !== uploadId));
    }

    return (
        <>
            <div className={styles.uploadSection}>
                <input 
                    id="fileInput" 
                    type="file" 
                    className={styles.fileInput}
                    accept=".csv"
                    disabled={checkNumber()}
                />
                <button 
                    id="uploadBtn" 
                    onClick={handleClick}
                    className={styles.uploadButton}
                    disabled={checkNumber()}
                >
                    Upload
                </button>
            </div>
            {console.log(uploads)}
            {(uploads.length > 0) && (
                uploads.map((upload) => 
                <div key={upload.id} className={`${styles.progressContainer} ${styles[upload.status]}`}>
                    <button
                        className={styles.closeButton}
                        onClick={() => handleCloseUpload(upload.id)}
                        aria-label="Close"
                        title="Close"
                    >
                        <X size={16} />
                    </button>
                    {upload.status === 'processing' && (
                        <>
                            <div className={styles.progressHeader}>
                                <div className={styles.progressIndicator}></div>
                                <span className={styles.progressTitle}>Processing file...{upload.filename}</span>
                            </div>
                            <div className={styles.progressBarWrapper}>
                                <div 
                                    className={styles.progressBar}
                                    style={{ width: `${progressPercentage(upload.total, upload.progress)}%` }}
                                ></div>
                            </div>
                            <div className={styles.progressStats}>
                                <span className={styles.statItem}>
                                    <span className={styles.statLabel}>Processed:</span>
                                    <span className={styles.statValue}>{upload.progress}</span>
                                    {upload.total > 0 && <span className={styles.statTotal}>/ {upload.total}</span>}
                                </span>
                                {upload.errors > 0 && (
                                    <span className={`${styles.statItem} ${styles.errorStat}`}>
                                        <span className={styles.statLabel}>Errors:</span>
                                        <span className={styles.statValue}>{upload.errors}</span>
                                    </span>
                                )}
                            </div>
                            <div className={styles.progressPercentage}>
                                {progressPercentage(upload.total, upload.progress)}%
                            </div>
                        </>
                    )}

                    {upload.status === 'completed' && (
                        <div className={styles.completedState}>
                            <div className={styles.successIcon}>✓</div>
                            <div className={styles.completedContent}>
                                <div className={styles.completedTitle}>Upload completed successfully!</div>
                                <div className={styles.completedStats}>
                                    <span>Processed: {upload.progress} records</span>
                                    {errors > 0 && (
                                        <span className={styles.errorCount}>{upload.errors} errors found</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {upload.status === 'error' && (
                        <div className={styles.errorState}>
                            <div className={styles.errorIcon}>✕</div>
                            <div className={styles.errorContent}>
                                <div className={styles.errorTitle}>Upload failed</div>
                                <div className={styles.errorMessage}>{upload.errorMessage}</div>
                            </div>
                        </div>
                    )}

                    {upload.status === 'uploading' && (
                        <div className={styles.uploadingState}>
                            <div className={styles.progressIndicator}></div>
                            <span>Uploading file...{upload.filename}</span>
                        </div>
                    )}
                </div>
            ))}
        </>
    )
}
