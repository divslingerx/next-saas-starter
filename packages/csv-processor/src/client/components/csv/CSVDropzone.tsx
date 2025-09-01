import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileSpreadsheet, AlertCircle } from "lucide-react";
import Papa from "papaparse";
import { cn } from "@tmcdm/ui/lib/utils";

interface CSVDropzoneProps {
  onFileAccepted: (file: File) => void;
  className?: string;
}

export function CSVDropzone({ onFileAccepted, className }: CSVDropzoneProps) {
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      console.log("[CSVDropzone] onDrop called with files:", acceptedFiles);
      setError(null);
      const file = acceptedFiles[0];
      
      if (!file) {
        console.log("[CSVDropzone] No file in acceptedFiles");
        return;
      }
      
      console.log("[CSVDropzone] File details:", {
        name: file.name,
        size: file.size,
        type: file.type
      });
      
      if (!file.name.endsWith('.csv')) {
        console.log("[CSVDropzone] File is not CSV:", file.name);
        setError("Please upload a CSV file");
        return;
      }

      setIsProcessing(true);
      console.log("[CSVDropzone] Starting CSV parsing...");
      
      // Basic validation - parse the CSV to check for errors but don't pass the data
      Papa.parse(file, {
        complete: (result) => {
          console.log("[CSVDropzone] Parse complete:", {
            rowCount: result.data.length,
            errors: result.errors
          });
          setIsProcessing(false);
          
          if (result.errors.length > 0) {
            console.error("[CSVDropzone] Parse errors:", result.errors);
            setError(`Error parsing CSV: ${result.errors[0]?.message || 'Unknown error'}`);
            return;
          }
          
          if (result.data.length === 0) {
            console.log("[CSVDropzone] CSV file is empty");
            setError("CSV file is empty");
            return;
          }
          
          // File is valid, pass it to the parent
          console.log("[CSVDropzone] Calling onFileAccepted with file:", file.name);
          onFileAccepted(file);
        },
        error: (error) => {
          console.error("[CSVDropzone] Parse error:", error);
          setIsProcessing(false);
          setError(`Error reading file: ${error.message}`);
        }
      });
    },
    [onFileAccepted]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv']
    },
    multiple: false,
    onDropAccepted: (files) => {
      console.log("[CSVDropzone] Files accepted by dropzone:", files);
    },
    onDropRejected: (rejections) => {
      console.log("[CSVDropzone] Files rejected by dropzone:", rejections);
      rejections.forEach(rejection => {
        console.log("[CSVDropzone] Rejection reason:", rejection.errors);
      });
    }
  });

  return (
    <div className={className}>
      <div
        {...getRootProps()}
        className={cn(
          "relative border-2 border-dashed rounded-lg p-8 transition-colors cursor-pointer",
          isDragActive && "border-primary bg-primary/5",
          !isDragActive && "border-gray-300 hover:border-gray-400",
          isProcessing && "opacity-50 cursor-not-allowed"
        )}
      >
        <input {...getInputProps()} />
        
        <div className="flex flex-col items-center justify-center space-y-4">
          {isProcessing ? (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              <p className="text-sm text-gray-600">Processing CSV...</p>
            </>
          ) : isDragActive ? (
            <>
              <FileSpreadsheet className="w-12 h-12 text-primary" />
              <p className="text-lg font-medium">Drop your CSV file here</p>
            </>
          ) : (
            <>
              <Upload className="w-12 h-12 text-gray-400" />
              <div className="text-center">
                <p className="text-lg font-medium">Drop CSV file here</p>
                <p className="text-sm text-gray-500 mt-1">or click to browse</p>
              </div>
              <p className="text-xs text-gray-400">Only CSV files are accepted</p>
            </>
          )}
        </div>
      </div>
      
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-start space-x-2">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
    </div>
  );
}