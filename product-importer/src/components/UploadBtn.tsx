export const UploadBtn = () => {
    const handleClick = async (): Promise<void> => {
        const fileInput = document.getElementById('fileInput') as HTMLInputElement | null;
        if (!fileInput) return alert('File input not found');
        const file = fileInput.files?.[0];
        if (!file) return alert('Select a file');
        const fd = new FormData();
        fd.append('file', file);
        try {
            const res = await fetch('http://127.0.0.1:8000/upload', { method: 'POST', body: fd });
            if (res.ok) alert('Uploaded'); else alert('Upload failed');
        } catch {
            alert('Upload error');
        }
    }

    return (
        <>
            <input id="fileInput" type="file" />
            <button id="uploadBtn" onClick={handleClick}>Upload</button>
        </>
    )
}
