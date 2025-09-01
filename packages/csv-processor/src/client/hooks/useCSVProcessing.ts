import { useState } from "react";

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:3000";

interface ProcessingConfig {
  removeDuplicates?: boolean;
  duplicateCheckColumns?: string[];
  mergeColumns?: string[];
  mergeDelimiter?: string;
  columnMappings?: Record<string, string>;
}

interface ProcessingResult {
  job: {
    id: string;
    status: string;
  };
}

export function useCSVProcessing() {
  const [processingJobId, setProcessingJobId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingError, setProcessingError] = useState<string | null>(null);

  const processFile = async (
    fileId: string, 
    config: ProcessingConfig = {}
  ): Promise<string | null> => {
    setIsProcessing(true);
    setProcessingError(null);
    
    try {
      const response = await fetch(`${SERVER_URL}/api/csv/process`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileId,
          config,
        }),
        credentials: "include",
      });

      if (response.ok) {
        const data: ProcessingResult = await response.json();
        if (data.job?.id) {
          setProcessingJobId(data.job.id);
          return data.job.id;
        }
      } else {
        const error = await response.text();
        setProcessingError(error);
      }
    } catch (error) {
      console.error("Processing error:", error);
      setProcessingError(error instanceof Error ? error.message : "Processing failed");
    } finally {
      setIsProcessing(false);
    }
    
    return null;
  };

  const exportFile = async (fileId: string, fileName: string): Promise<boolean> => {
    try {
      const response = await fetch(`${SERVER_URL}/api/csv/files/${fileId}/export`, {
        method: "GET",
        credentials: "include",
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        return true;
      }
    } catch (error) {
      console.error("Export error:", error);
    }
    return false;
  };

  const loadFilePreview = async (fileId: string): Promise<any | null> => {
    try {
      // Always load the processed preview
      const response = await fetch(`${SERVER_URL}/api/csv/files/${fileId}/preview?processed=true`, {
        credentials: "include",
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log("Loaded processed preview:", data);
        
        // Transform to expected format - combine headers and rows
        if (data.preview) {
          const { headers, rows } = data.preview;
          const fullData = headers && rows ? [headers, ...rows] : [];
          
          return {
            rows: fullData,
            preview: data.preview,
            fileName: data.metadata?.fileName,
            name: data.metadata?.fileName,
          };
        }
        
        return data;
      }
    } catch (error) {
      console.error("Load preview error:", error);
    }
    return null;
  };

  return {
    processingJobId,
    isProcessing,
    processingError,
    processFile,
    exportFile,
    loadFilePreview,
  };
}