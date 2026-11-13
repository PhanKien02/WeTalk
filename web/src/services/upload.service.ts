import baseRequest from "./base.service";
import type { ApiResponse, UploadResult } from "@/type";

/** Khớp với UPLOAD_MAX_SIZE_MB mặc định của upload service */
export const MAX_UPLOAD_SIZE = 10 * 1024 * 1024;
const UPLOAD_TIMEOUT = 60_000;

export interface UploadOptions {
  /** Tiền tố key trên R2, ví dụ "messages" hoặc "avatars" */
  folder?: string;
  signal?: AbortSignal;
  /** Tiến độ 0..1 */
  onProgress?: (progress: number) => void;
}

export const uploadService = {
  /** Tải một file lên R2 qua upload service, trả về URL công khai */
  async uploadFile(
    file: File,
    { folder, signal, onProgress }: UploadOptions = {}
  ): Promise<ApiResponse<UploadResult>> {
    const form = new FormData();
    form.append("file", file);
    if (folder) form.append("folder", folder);

    const response = await baseRequest.post<ApiResponse<UploadResult>>(
      "/v1/upload",
      form,
      {
        // baseRequest mặc định là application/json, khi đó axios sẽ đổi FormData thành JSON.
        // Đặt multipart để axios giữ FormData; trình duyệt tự thêm boundary.
        headers: { "Content-Type": "multipart/form-data" },
        timeout: UPLOAD_TIMEOUT,
        signal,
        onUploadProgress: onProgress
          ? (e) => onProgress(e.total ? e.loaded / e.total : 0)
          : undefined,
      }
    );
    return response.data;
  },
};

export default uploadService;
