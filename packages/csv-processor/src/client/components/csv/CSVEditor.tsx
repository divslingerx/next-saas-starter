import { useState } from "react";
import { DataTable } from "../DataTable";
import { ColumnMappingSidebar } from "../column-mapping";
import { Button } from "@tmcdm/ui/components/ui/button";
import { Settings, ArrowLeft } from "lucide-react";

interface CSVEditorProps {
  csvData: any[][];
  fileName: string;
  uploadStatus: "idle" | "uploading" | "success" | "error";
  onBack: () => void;
  onProcess?: (config: any) => void;
}

export function CSVEditor({
  csvData,
  fileName,
  uploadStatus,
  onBack,
  onProcess,
}: CSVEditorProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedRows, setSelectedRows] = useState<number[]>([]);

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            Editing {fileName}
          </h1>
          <Button
            onClick={onBack}
            variant="ghost"
            size="sm"
            className="flex items-center gap-2 px-0 mt-1"
          >
            <ArrowLeft className="h-4 w-4" />
            {fileName} • {csvData.length - 1} rows • {csvData[0]?.length || 0} columns
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {uploadStatus === "uploading" && (
            <span className="text-sm text-blue-600 flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              Processing...
            </span>
          )}
          {uploadStatus === "success" && (
            <span className="text-sm text-green-600">
              ✓ Ready
            </span>
          )}
          {uploadStatus === "error" && (
            <span className="text-sm text-red-600">✗ Error</span>
          )}

          <Button
            onClick={() => setIsSidebarOpen(true)}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Settings className="h-4 w-4" />
            Map Columns to Properties
          </Button>
        </div>
      </div>

      <DataTable
        data={csvData}
        selectedRows={selectedRows}
        onSelectionChange={setSelectedRows}
      />

      <ColumnMappingSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        csvHeaders={csvData[0] || []}
        onProcess={onProcess}
      />
    </>
  );
}