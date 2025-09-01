import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:3000";

export interface ProcessedFile {
  id: string;
  name: string;
  size: number;
  hash: string;
  createdAt: string;
  updatedAt: string;
  processingJob?: {
    id: string;
    status: string;
    processedRowCount: number;
    processedColumnCount: number;
    originalFileId: string;
    processingCompletedAt: string;
  };
}

export function useFileManagement() {
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const queryClient = useQueryClient();

  // Fetch processed files
  const {
    data: files,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["processed-files"],
    queryFn: async () => {
      const response = await fetch(`${SERVER_URL}/api/csv/files?processed=true`, {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to fetch files");
      }
      return response.json() as Promise<ProcessedFile[]>;
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (fileIds: string[]) => {
      const promises = fileIds.map(async (id) => {
        const response = await fetch(`${SERVER_URL}/api/csv/files/${id}`, {
          method: "DELETE",
          credentials: "include",
        });
        
        if (!response.ok) {
          const error = await response.text();
          console.error(`Failed to delete file ${id}:`, error);
          throw new Error(`Failed to delete file ${id}`);
        }
        
        return response.json();
      });
      
      return Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["processed-files"] });
      setSelectedFiles(new Set());
    },
    onError: (error) => {
      console.error("Delete error:", error);
    },
  });

  // Selection management
  const toggleFileSelection = (fileId: string) => {
    const newSelected = new Set(selectedFiles);
    if (newSelected.has(fileId)) {
      newSelected.delete(fileId);
    } else {
      newSelected.add(fileId);
    }
    setSelectedFiles(newSelected);
  };

  const selectAll = () => {
    if (files) {
      setSelectedFiles(new Set(files.map(f => f.id)));
    }
  };

  const clearSelection = () => {
    setSelectedFiles(new Set());
  };

  const deleteSelected = async () => {
    if (selectedFiles.size > 0) {
      await deleteMutation.mutateAsync(Array.from(selectedFiles));
    }
  };

  const deleteFile = async (fileId: string) => {
    await deleteMutation.mutateAsync([fileId]);
  };

  // Utility functions
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  return {
    // Data
    files: files || [],
    isLoading,
    error,
    
    // Selection
    selectedFiles,
    toggleFileSelection,
    selectAll,
    clearSelection,
    isAllSelected: files ? selectedFiles.size === files.length : false,
    
    // Operations
    deleteFile,
    deleteSelected,
    isDeleting: deleteMutation.isPending,
    
    // Utilities
    formatFileSize,
    refetch,
  };
}