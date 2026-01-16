export type UploadStatus =
  | 'idle'
  | 'uploading'
  | 'processing'
  | 'completed'
  | 'completed_with_error';

export interface UploadProgressMessage {
  status: UploadStatus;
  progress?: number;
  total?: number;
  errors?: number;
  message?: string;
}


const BASE_URL = 'http://localhost:8000';

export async function uploadFile(file: File): Promise<string> {
  const fd = new FormData();
  fd.append('file', file);

  const res = await fetch(`${BASE_URL}/files`, {
    method: 'POST',
    body: fd,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData?.detail?.message || 'Upload failed');
  }

  const data = await res.json();
  return data.file_id;
}

export function openUploadProgressSocket(
  fileId: string
): WebSocket {
  return new WebSocket(`${BASE_URL.replace('http', 'ws')}/ws/progress/${fileId}`);
}

export async function searchFiles(query: string): Promise<{ files: any[] }> {
  if (!query || !query.trim()) {
    return { files: [] };
  }

  const params = new URLSearchParams({
    q: query.trim()
  });

  const res = await fetch(`${BASE_URL}/files/search?${params.toString()}`, {
    method: 'GET'
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData?.detail?.message || 'Failed to search files');
  }

  return await res.json();
}