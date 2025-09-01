import { useState } from "react";
import { useMutation } from "@tanstack/react-query";

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:3000";

interface UploadResult {
  file: {
    id: string;
    name: string;
    size: number;
    hash: string;
  };
  preview: {
    rows: any[][];
    totalRows: number;
    columns: string[];
  };
}

interface UseCSVUploadOptions {
  onSuccess?: (data: UploadResult) => void;
  onError?: (error: Error) => void;
}

export function useCSVUpload(options?: UseCSVUploadOptions) {
  const [uploadStatus, setUploadStatus] = useState<
    "idle" | "uploading" | "success" | "error"
  >("idle");

  const uploadMutation = useMutation({
    mutationFn: async ({ file }: { file: File }) => {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${SERVER_URL}/api/csv/upload`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to upload CSV");
      }

      return response.json() as Promise<UploadResult>;
    },
    onMutate: () => {
      setUploadStatus("uploading");
    },
    onSuccess: (data) => {
      setUploadStatus("success");
      options?.onSuccess?.(data);
    },
    onError: (error: Error) => {
      setUploadStatus("error");
      options?.onError?.(error);
    },
  });

  const uploadFile = (file: File) => {
    uploadMutation.mutate({ file });
  };

  const resetUpload = () => {
    setUploadStatus("idle");
  };

  return {
    uploadFile,
    uploadStatus,
    isUploading: uploadStatus === "uploading",
    uploadError: uploadMutation.error,
    resetUpload,
  };
}