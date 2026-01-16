export type UploadStatus =
  | 'idle'
  | 'uploading'
  | 'processing'
  | 'completed'
  | 'error';

export interface UploadProgressMessage {
  status: UploadStatus;
  progress?: number;
  total?: number;
  errors?: number;
  message?: string;
}
