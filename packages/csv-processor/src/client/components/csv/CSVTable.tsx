import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@tmcdm/ui/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@tmcdm/ui/components/ui/card";
import { Badge } from "@tmcdm/ui/components/ui/badge";

interface CSVTableProps {
  data: any[][];
  maxRows?: number;
  title?: string;
  description?: string;
}

export function CSVTable({ data, maxRows = 25, title, description }: CSVTableProps) {
  if (data.length === 0) return null;
  
  const headers = data[0];
  const rows = data.slice(1, maxRows + 1);
  const totalRows = data.length - 1;
  const showingRows = Math.min(maxRows, totalRows);
  
  return (
    <Card className="w-full">
      {(title || description) && (
        <CardHeader>
          {title && <CardTitle>{title}</CardTitle>}
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      )}
      <CardContent className="p-0">
        <div className="relative overflow-auto max-h-[600px]">
          <Table className="min-w-full">
            <TableHeader className="sticky top-0 z-10 bg-background">
              <TableRow>
                <TableHead className="sticky left-0 z-20 bg-background w-[50px] border-r">#</TableHead>
                {headers && headers.map((header, index) => (
                  <TableHead key={index} className="px-4 py-3 text-left">
                    <div className="whitespace-nowrap">
                      {header || `Column ${index + 1}`}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, rowIndex) => (
                <TableRow key={rowIndex}>
                  <TableCell className="sticky left-0 z-10 bg-background font-medium text-muted-foreground w-[50px] border-r">
                    {rowIndex + 1}
                  </TableCell>
                  {headers && headers.map((_, cellIndex) => (
                    <TableCell key={cellIndex} className="px-4 py-2">
                      <div className="whitespace-nowrap">
                        {row[cellIndex] ? (
                          <span>{row[cellIndex]}</span>
                        ) : (
                          <span className="text-muted-foreground/50">—</span>
                        )}
                      </div>
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {totalRows > maxRows && (
          <div className="border-t px-6 py-4">
            <div className="flex items-center justify-center gap-2">
              <span className="text-sm text-muted-foreground">
                Showing {showingRows} of {totalRows} rows
              </span>
              <Badge variant="secondary">
                {totalRows - showingRows} more rows
              </Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}