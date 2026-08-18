export interface FileItem {
  fileTitle: string;
  fileGuid: string;
}

export interface FilesCountResponse {
  FilesCount: {
    data: {
      items: FileItem[];
      bottomItems: FileItem[] | null;
      hasNext: boolean;
      totalCount: number | null;
      pageCount: number | null;
    };
    message: string;
    statusCode: number;
  };
}

export interface ImportStats {
  totalFiles: number;
  filesProcessed: number;
  totalProducts: number;
  productsInserted: number;
  productsFailed: number;
  errors: string[];
  processingTime: number;
}

export interface FileImportResult {
  totalRows: number;
  inserted: number;
  failed: number;
}