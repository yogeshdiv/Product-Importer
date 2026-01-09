import styles from './Products.module.css';
export const SampleCsv = () => {
    return (
        <div className={styles.sampleBox}>
            <div className={styles.sampleText}>
                <span className={styles.sampleTitle}>Sample CSV file</span>
                <span className={styles.sampleHint}>
                    Download this sample to see the expected columns and format.
                </span>
            </div>
            <a
                href="/sample-products.csv"
                className={styles.sampleLink}
                download
            >
                Download sample
            </a>
        </div>
    )
}