import { format } from "date-fns";
import { Trash2, Download, RefreshCw, FileText, MoreHorizontal } from "lucide-react";
import { Button } from "@tmcdm/ui/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@tmcdm/ui/components/ui/dropdown-menu";
import { Checkbox } from "@tmcdm/ui/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@tmcdm/ui/components/ui/table";
import type { ProcessedFile } from "../../hooks/useFileManagement";

interface FilesTableProps {
  files: ProcessedFile[];
  selectedFiles: Set<string>;
  onToggleSelection: (fileId: string) => void;
  onSelectAll: () => void;
  isAllSelected: boolean;
  onExport: (fileId: string, fileName: string) => void;
  onReprocess: (fileId: string, fileName: string, isOriginal: boolean) => void;
  onDelete: (fileId: string) => void;
  formatFileSize: (bytes: number) => string;
}

export function FilesTable({
  files,
  selectedFiles,
  onToggleSelection,
  onSelectAll,
  isAllSelected,
  onExport,
  onReprocess,
  onDelete,
  formatFileSize,
}: FilesTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={isAllSelected && files.length > 0}
                onCheckedChange={onSelectAll}
              />
            </TableHead>
            <TableHead>File Name</TableHead>
            <TableHead>Size</TableHead>
            <TableHead>Rows</TableHead>
            <TableHead>Columns</TableHead>
            <TableHead>Processed</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {files.map((file) => (
            <TableRow key={file.id}>
              <TableCell>
                <Checkbox
                  checked={selectedFiles.has(file.id)}
                  onCheckedChange={() => onToggleSelection(file.id)}
                />
              </TableCell>
              <TableCell className="font-medium">{file.name}</TableCell>
              <TableCell>{formatFileSize(file.size)}</TableCell>
              <TableCell>
                {file.processingJob?.processedRowCount || "-"}
              </TableCell>
              <TableCell>
                {file.processingJob?.processedColumnCount || "-"}
              </TableCell>
              <TableCell>
                {file.processingJob?.processingCompletedAt
                  ? format(new Date(file.processingJob.processingCompletedAt), "MMM d, yyyy")
                  : "-"}
              </TableCell>
              <TableCell>
                <span
                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    file.processingJob?.status === "completed"
                      ? "bg-green-100 text-green-700"
                      : file.processingJob?.status === "processing"
                      ? "bg-blue-100 text-blue-700"
                      : file.processingJob?.status === "failed"
                      ? "bg-red-100 text-red-700"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {file.processingJob?.status || "pending"}
                </span>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => onExport(file.id, file.name)}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Export
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onReprocess(file.id, file.name, false)}
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Reprocess
                    </DropdownMenuItem>
                    {file.processingJob?.originalFileId && (
                      <DropdownMenuItem
                        onClick={() => onReprocess(file.processingJob!.originalFileId, file.name, true)}
                      >
                        <FileText className="mr-2 h-4 w-4" />
                        Reprocess Original
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => {
                        if (confirm("Delete this file?")) {
                          onDelete(file.id);
                        }
                      }}
                      className="text-red-600"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}