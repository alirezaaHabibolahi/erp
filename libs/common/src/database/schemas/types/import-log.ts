
export interface IImportLogDoc {
  _id?: string;

  // Job Information
  jobType: string; // 'midnight', 'daily', 'periodic', 'weekly-full-sync', 'manual'
  status: 'success' | 'failed' | 'partial' | 'in_progress';

  // Timing
  startTime: Date;
  endTime: Date;
  duration: number; // in seconds

  // File Statistics
  totalFiles: number;
  filesProcessed: number;
  filesFailed: number;

  // Record Statistics
  totalRecords: number;
  recordsInserted: number;
  recordsFailed: number;
  // File Details
  files: Array<{
    fileName: string;
    fileGuid: string;
    fileSize: number; // in bytes
    fileSizeMB: number;
    recordsCount: number;
    status: 'success' | 'failed';
    error?: string;
    processingTime: number; // in seconds
  }>;

  // Performance
  processingTime: number; // total in seconds
  recordsPerSecond: number;
  memoryUsageMB: number;

  // Errors
  hasErrors: boolean;
  errorDetails: Array<{
    file: string;
    message: string;
    timestamp: Date;
  }>;
  totalErrors: number;

  // Additional Info
  batchId: string;
  serverInfo: {
    hostname: string;
    platform: string;
    nodeVersion: string;
    memory: {
      total: number;
      free: number;
      used: number;
    };
  };

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}
