import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@tmcdm/ui/components/ui/button";
import { FileText, Trash2, Upload } from "lucide-react";

import { CSVDropzone, CSVEditor } from "../components/csv";
import { FilesTable } from "../components/files";
import { Header } from "../components/layout";
import { useCSVProcessing } from "../hooks/useCSVProcessing";
import { useCSVUpload } from "../hooks/useCSVUpload";
import { useFileManagement } from "../hooks/useFileManagement";
import { requireAuth } from "../lib/auth-guard";

export const Route = createFileRoute("/")({
  beforeLoad: requireAuth,
  component: Index,
});

type ViewMode = "files" | "editor";

function Index() {
  const [view, setView] = useState<ViewMode>("files");
  const [csvData, setCsvData] = useState<any[][] | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [currentFileId, setCurrentFileId] = useState<string | null>(null);
  const [showDropzone, setShowDropzone] = useState(false);

  // Custom hooks
  const fileManagement = useFileManagement();
  const csvProcessing = useCSVProcessing();
  const csvUpload = useCSVUpload({
    onSuccess: async (data) => {
      // Set initial data and show editor
      if (data.file) {
        setFileName(data.file.name);
        setCurrentFileId(data.file.id);
        setView("editor");
        setShowDropzone(false);

        // Show initial preview immediately
        if (data.preview && data.preview.rows) {
          setCsvData(data.preview.rows);
        }

        // Processing happens automatically on upload
        // Load processed preview after a short delay
        setTimeout(async () => {
          const processedPreview = await csvProcessing.loadFilePreview(
            data.file.id,
          );
          if (processedPreview && processedPreview.rows) {
            setCsvData(processedPreview.rows);
          }
          fileManagement.refetch();
        }, 2000);

        // Additional refetches to update the file list
        setTimeout(() => fileManagement.refetch(), 4000);
        setTimeout(() => fileManagement.refetch(), 6000);
      }
    },
    onError: (error) => {
      console.error("Upload error:", error);
    },
  });

  // Handle file selection from table
  const handleReprocess = async (
    fileId: string,
    fileName: string,
    isOriginal: boolean,
  ) => {
    console.log(
      "Reprocessing file:",
      fileId,
      "fileName:",
      fileName,
      "isOriginal:",
      isOriginal,
    );

    // For processed files, we need to get the preview directly
    // For original files, we use the fileId as-is
    const targetFileId = isOriginal ? fileId : fileId;

    const preview = await csvProcessing.loadFilePreview(targetFileId);
    console.log("Preview data:", preview);

    if (preview) {
      // Check different possible data structures
      const rows =
        preview.rows ||
        preview.preview?.rows ||
        (preview.preview?.headers && preview.preview?.data
          ? [preview.preview.headers, ...preview.preview.data]
          : null);

      if (rows) {
        setCsvData(rows);
        setFileName(fileName); // Use the passed filename
        setCurrentFileId(targetFileId);
        setView("editor");
      } else {
        console.error("No valid data found in preview:", preview);
      }
    }
  };

  // Handle file deletion
  const handleDelete = async (fileId: string) => {
    await fileManagement.deleteFile(fileId);
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (fileManagement.selectedFiles.size > 0) {
      if (confirm(`Delete ${fileManagement.selectedFiles.size} file(s)?`)) {
        await fileManagement.deleteSelected();
      }
    }
  };

  // Handle back to files
  const handleBackToFiles = () => {
    setView("files");
    setCsvData(null);
    setFileName(null);
    setCurrentFileId(null);
    csvUpload.resetUpload();
    fileManagement.refetch();
  };

  // Handle processing with custom configuration
  const handleProcessFile = async (config: any) => {
    if (!currentFileId) {
      console.error("No file selected for processing");
      return;
    }

    console.log("Processing file with config:", config);

    // Process the file with the given configuration
    const jobId = await csvProcessing.processFile(currentFileId, config);

    if (jobId) {
      console.log("Processing started with job ID:", jobId);

      // Wait a bit for processing to complete, then reload the preview
      setTimeout(async () => {
        const processedPreview =
          await csvProcessing.loadFilePreview(currentFileId);
        if (processedPreview && processedPreview.rows) {
          setCsvData(processedPreview.rows);
        }
        fileManagement.refetch();
      }, 3000);

      // Additional refetch to ensure file list is updated
      setTimeout(() => fileManagement.refetch(), 5000);
    }
  };

  // Handle new file upload
  const handleFileAccepted = (file: File) => {
    setFileName(file.name);
    csvUpload.uploadFile(file);
  };

  // Render based on view mode
  if (view === "editor" && csvData) {
    return (
      <div className="bg-background min-h-screen">
        <Header />
        <main className="container mx-auto px-4 py-6">
          <CSVEditor
            csvData={csvData}
            fileName={fileName || "Untitled"}
            uploadStatus={csvUpload.uploadStatus}
            onBack={handleBackToFiles}
            onProcess={handleProcessFile}
          />
        </main>
      </div>
    );
  }

  // Files view
  return (
    <div className="bg-background min-h-screen">
      <Header />

      <main className="container mx-auto px-4 py-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-foreground text-2xl font-semibold">
              CSV Files
            </h1>
            <p className="text-muted-foreground">
              Upload and manage your CSV files
            </p>
          </div>

          <div className="flex items-center gap-2">
            {fileManagement.selectedFiles.size > 0 && (
              <>
                <span className="text-muted-foreground text-sm">
                  {fileManagement.selectedFiles.size} selected
                </span>
                <Button
                  onClick={handleBulkDelete}
                  variant="destructive"
                  size="sm"
                  className="flex items-center gap-2"
                  disabled={fileManagement.isDeleting}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Selected
                </Button>
              </>
            )}

            <Button
              onClick={() => setShowDropzone(!showDropzone)}
              variant="default"
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              Upload CSV
            </Button>
          </div>
        </div>

        {/* Dropzone - collapsible */}
        {showDropzone && (
          <div className="mb-6">
            <CSVDropzone onFileAccepted={handleFileAccepted} className="mb-6" />
          </div>
        )}

        {/* Files table or empty state */}
        {fileManagement.isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="border-primary h-8 w-8 animate-spin rounded-full border-b-2"></div>
          </div>
        ) : fileManagement.error ? (
          <div className="py-12 text-center">
            <p className="text-red-500">Failed to load files</p>
          </div>
        ) : fileManagement.files.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed p-12 py-12 text-center">
            <FileText className="mx-auto mb-4 h-12 w-12 text-gray-400" />
            <h3 className="mb-2 text-lg font-medium">No files yet</h3>
            <p className="mb-4 text-gray-500">
              Upload your first CSV file to get started
            </p>
            {!showDropzone && (
              <Button onClick={() => setShowDropzone(true)} variant="default">
                <Upload className="mr-2 h-4 w-4" />
                Upload CSV
              </Button>
            )}
          </div>
        ) : (
          <FilesTable
            files={fileManagement.files}
            selectedFiles={fileManagement.selectedFiles}
            onToggleSelection={fileManagement.toggleFileSelection}
            onSelectAll={
              fileManagement.isAllSelected
                ? fileManagement.clearSelection
                : fileManagement.selectAll
            }
            isAllSelected={fileManagement.isAllSelected}
            onExport={(fileId, fileName) =>
              csvProcessing.exportFile(fileId, fileName)
            }
            onReprocess={handleReprocess}
            onDelete={handleDelete}
            formatFileSize={fileManagement.formatFileSize}
          />
        )}
      </main>
    </div>
  );
}

export default Index;
