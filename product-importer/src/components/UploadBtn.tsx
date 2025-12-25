import { useState } from 'react';
export const UploadBtn = () => {
    const [progress, setProgress] = useState<number>(0);
    const handleClick = async (): Promise<void> => {
        const fileInput = document.getElementById('fileInput') as HTMLInputElement | null;
        if (!fileInput) return alert('File input not found');
        const file = fileInput.files?.[0];
        if (!file) return alert('Select a file');
        const fd = new FormData();
        fd.append('file', file);
        try {
            const res = await fetch('http://localhost:8000/upload', { method: 'POST', body: fd });
            if (res.ok){
                const fileId = await res.json().then((data) => data.file_id);
                console.log("upload complete", fileId);
                const ws = new WebSocket(`ws://localhost:8000/ws/progress/${fileId}`);

                ws.onmessage = (event) => {
                    console.log("Message:", JSON.parse(event.data));
                    const message = JSON.parse(event.data);
                    if (message.status === 'completed'){
                        alert('Upload completed');
                        ws.close();
                    }else{
                        console.log(`Progress: ${message.progress}%`);
                        setProgress(message.progress);
                    }
                };

                ws.onopen = () => console.log("Connected");
                ws.onclose = () => console.log("Closed")
            } else{
                alert('Upload failed');
            }
        } catch {
            alert('Upload error');
        }
    }

    return (
        <>
            <input id="fileInput" type="file" />
            <button id="uploadBtn" onClick={handleClick}>Upload</button>
            <div>Progress: {progress}%</div>
        </>
    )
}
