import type { File } from './interface'
import { useState, useEffect } from 'react'
import { NavBar } from './NavBar';
import styles from './Files.module.css';

export const Files = () => {
    const [files, setFiles] = useState<File[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>('');

    const handleDownload = async (
        e: React.MouseEvent<HTMLAnchorElement>,
        fileId: string | number
    ) => {
        e.preventDefault();

        try {
            const res = await fetch(`http://localhost:8000/files/${fileId}/error-download-url`);
            if (!res.ok) throw new Error("Failed to get download URL");

            const data = await res.json();
            const downloadUrl = data.error_file_download_url;

            window.open(downloadUrl);
        } catch (err) {
            console.error(err);
            alert("Unable to download error file");
        }
    };

    useEffect(() => {
        const fetchFiles = async () => {
            try {
                setLoading(true);
                const res = await fetch("http://localhost:8000/files");
                if (!res.ok) {
                    throw new Error('Failed to fetch files');
                }
                const json = await res.json();
                setFiles(json.files);
                setError('');
            } catch (err) {
                console.error("Failed to fetch files", err);
                setError('Failed to load files. Please try again.');
            } finally {
                setLoading(false);
            }
        };
        fetchFiles();
    }, []);

    const getStatusBadgeClass = (status: string) => {
        switch (status.toLowerCase()) {
            case 'completed':
                return styles.statusCompleted;
            case 'processing':
                return styles.statusProcessing;
            case 'pending':
                return styles.statusPending;
            case 'error':
                return styles.statusError;
            default:
                return styles.statusDefault;
        }
    };

    return (
        <>
            <NavBar />
            <div className={styles.container}>
                <h2>Files</h2>
                
                {loading && (
                    <div className={styles.loading}>Loading files...</div>
                )}

                {error && (
                    <div className={styles.error}>{error}</div>
                )}

                {!loading && !error && (
                    <>
                        {files.length === 0 ? (
                            <div className={styles.emptyState}>
                                No files uploaded yet.
                            </div>
                        ) : (
                            <div className={styles.tableWrapper}>
                                <table className={styles.table}>
                                    <thead>
                                        <tr>
                                            <th className={styles.th}>ID</th>
                                            <th className={styles.th}>File Name</th>
                                            <th className={styles.th}>Status</th>
                                            <th className={styles.th}>Total Records</th>
                                            <th className={styles.th}>Inserted</th>
                                            <th className={styles.th}>Updated</th>
                                            <th className={styles.th}>Errors</th>
                                        </tr>
                                    </thead>
                                    <tbody className={styles.tbody}>
                                        {files.map((file: File) => (
                                            <tr key={file.id}>
                                                <td className={styles.td}>{file.id}</td>
                                                <td className={styles.td}>{file.file_name}</td>
                                                <td className={styles.td}>
                                                    <span className={`${styles.statusBadge} ${getStatusBadgeClass(file.status)}`}>
                                                        {file.status}
                                                    </span>
                                                </td>
                                                <td className={styles.td}>{file.total_number_of_records}</td>
                                                <td className={styles.td}>{file.records_inserted}</td>
                                                <td className={styles.td}>{file.records_updated}</td>
                                                <td className={styles.td}>
                                                    {file.file_with_errors ? (
                                                        <a
                                                        href="#"
                                                        className={styles.hasErrors}
                                                        onClick={(e) => handleDownload(e, file.id)}
                                                        >
                                                        Download error file
                                                        </a>
                                                    ) : (
                                                        <span className={styles.noErrors}>No</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </>
                )}
            </div>
        </>
    )
}

