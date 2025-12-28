import { useState } from 'react';
import styles from './UploadBtn.module.css';

type UploadStatus = 'idle' | 'uploading' | 'processing' | 'completed' | 'error';

export const UploadBtn = () => {
    const [progress, setProgress] = useState<number>(0);
    const [total, setTotal] = useState<number>(0);
    const [errors, setErrors] = useState<number>(0);
    const [status, setStatus] = useState<UploadStatus>('idle');
    const [errorMessage, setErrorMessage] = useState<string>('');
    const [isUploading, setIsUploading] = useState<boolean>(false);

    const resetState = () => {
        setProgress(0);
        setTotal(0);
        setErrors(0);
        setStatus('idle');
        setErrorMessage('');
        setIsUploading(false);
    };

    const handleClick = async (): Promise<void> => {
        const fileInput = document.getElementById('fileInput') as HTMLInputElement | null;
        if (!fileInput) {
            setStatus('error');
            setErrorMessage('File input not found');
            return;
        }
        
        const file = fileInput.files?.[0];
        if (!file) {
            setStatus('error');
            setErrorMessage('Please select a file to upload');
            return;
        }

        setIsUploading(true);
        setStatus('uploading');
        setErrorMessage('');
        setProgress(0);
        setErrors(0);

        const fd = new FormData();
        fd.append('file', file);

        try {
            const res = await fetch('http://localhost:8000/upload', { method: 'POST', body: fd });
            
            if (res.ok) {
                const fileId = await res.json().then((data) => data.file_id);
                setStatus('processing');
                
                const ws = new WebSocket(`ws://localhost:8000/ws/progress/${fileId}`);

                ws.onmessage = (event) => {
                    try {
                        const message = JSON.parse(event.data);
                        
                        if (message.status === 'completed') {
                            setStatus('completed');
                            setProgress(message.progress || total);
                            setErrors(message.errors || 0);
                            setIsUploading(false);
                            ws.close();
                            
                            // Reset after 5 seconds
                            setTimeout(() => {
                                resetState();
                                fileInput.value = '';
                            }, 5000);
                        } else if (message.status === 'error') {
                            setStatus('error');
                            setErrorMessage(message.message || 'An error occurred during processing');
                            setIsUploading(false);
                            ws.close();
                        } else {
                            setProgress(message.progress || 0);
                            setTotal(message.total || 0);
                            setErrors(message.errors || 0);
                        }
                    } catch (err) {
                        console.error('Error parsing WebSocket message:', err);
                    }
                };

                ws.onerror = () => {
                    setStatus('error');
                    setErrorMessage('Connection error. Please try again.');
                    setIsUploading(false);
                };

                ws.onclose = () => {
                    // Only set error if not already completed or in error state
                    setStatus((prevStatus) => {
                        if (prevStatus !== 'completed' && prevStatus !== 'error') {
                            setErrorMessage('Connection closed unexpectedly');
                            setIsUploading(false);
                            return 'error';
                        }
                        return prevStatus;
                    });
                };

                ws.onopen = () => {
                    console.log("WebSocket connected");
                };
            } else {
                const errorData = await res.json().catch(() => ({}));
                setStatus('error');
                setErrorMessage(errorData.message || 'Upload failed. Please try again.');
                setIsUploading(false);
            }
        } catch (err) {
            setStatus('error');
            setErrorMessage('Network error. Please check your connection and try again.');
            setIsUploading(false);
        }
    };

    const progressPercentage = total > 0 ? Math.round((progress / total) * 100) : 0;

    return (
        <>
            <div className={styles.uploadSection}>
                <input 
                    id="fileInput" 
                    type="file" 
                    className={styles.fileInput}
                    accept=".csv"
                    disabled={isUploading}
                />
                <button 
                    id="uploadBtn" 
                    onClick={handleClick}
                    className={styles.uploadButton}
                    disabled={isUploading}
                >
                    {isUploading ? 'Processing...' : 'Upload'}
                </button>
            </div>

            {(status !== 'idle') && (
                <div className={`${styles.progressContainer} ${styles[status]}`}>
                    {status === 'processing' && (
                        <>
                            <div className={styles.progressHeader}>
                                <div className={styles.progressIndicator}></div>
                                <span className={styles.progressTitle}>Processing file...</span>
                            </div>
                            <div className={styles.progressBarWrapper}>
                                <div 
                                    className={styles.progressBar}
                                    style={{ width: `${progressPercentage}%` }}
                                ></div>
                            </div>
                            <div className={styles.progressStats}>
                                <span className={styles.statItem}>
                                    <span className={styles.statLabel}>Processed:</span>
                                    <span className={styles.statValue}>{progress}</span>
                                    {total > 0 && <span className={styles.statTotal}>/ {total}</span>}
                                </span>
                                {errors > 0 && (
                                    <span className={`${styles.statItem} ${styles.errorStat}`}>
                                        <span className={styles.statLabel}>Errors:</span>
                                        <span className={styles.statValue}>{errors}</span>
                                    </span>
                                )}
                            </div>
                            <div className={styles.progressPercentage}>
                                {progressPercentage}%
                            </div>
                        </>
                    )}

                    {status === 'completed' && (
                        <div className={styles.completedState}>
                            <div className={styles.successIcon}>✓</div>
                            <div className={styles.completedContent}>
                                <div className={styles.completedTitle}>Upload completed successfully!</div>
                                <div className={styles.completedStats}>
                                    <span>Processed: {progress} records</span>
                                    {errors > 0 && (
                                        <span className={styles.errorCount}>{errors} errors found</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {status === 'error' && (
                        <div className={styles.errorState}>
                            <div className={styles.errorIcon}>✕</div>
                            <div className={styles.errorContent}>
                                <div className={styles.errorTitle}>Upload failed</div>
                                <div className={styles.errorMessage}>{errorMessage}</div>
                            </div>
                            <button 
                                className={styles.retryButton}
                                onClick={() => {
                                    resetState();
                                    const fileInput = document.getElementById('fileInput') as HTMLInputElement | null;
                                    if (fileInput) fileInput.value = '';
                                }}
                            >
                                Try Again
                            </button>
                        </div>
                    )}

                    {status === 'uploading' && (
                        <div className={styles.uploadingState}>
                            <div className={styles.progressIndicator}></div>
                            <span>Uploading file...</span>
                        </div>
                    )}
                </div>
            )}
        </>
    )
}
