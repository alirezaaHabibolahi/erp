
import { Connection, Schema } from 'mongoose';
import { ModelParent } from '@/models/Base/baseModelParent';
import { IImportLogDoc } from '@/types/import-log';

export class ImportLogSchema extends ModelParent<IImportLogDoc> {
  constructor(connection: Connection) {
    const schema = new Schema<Partial<IImportLogDoc>>(
      {
        jobType: {
          type: String,
          required: true,
          enum: ['midnight','daily', 'periodic', 'weekly-full-sync', 'manual'],
          index: true,
        },
        status: {
          type: String,
          required: true,
          enum: ['success', 'failed', 'partial', 'in_progress'],
          index: true,
        },

        startTime: { type: Date, required: true, index: true },
        endTime: { type: Date, required: true },
        duration: { type: Number, required: true },

        totalFiles: { type: Number, default: 0 },
        filesProcessed: { type: Number, default: 0 },
        filesFailed: { type: Number, default: 0 },

        totalRecords: { type: Number, default: 0 },
        recordsInserted: { type: Number, default: 0 },
        recordsFailed: { type: Number, default: 0 },

        files: [{
          fileName: { type: String, required: true },
          fileGuid: { type: String, required: true },
          fileSize: { type: Number, required: true },
          fileSizeMB: { type: Number, required: true },
          recordsCount: { type: Number, default: 0 },
          status: {
            type: String,
            enum: ['success', 'failed'],
            required: true,
          },
          error: { type: String },
          processingTime: { type: Number, required: true },
        }],

        processingTime: { type: Number, required: true },
        recordsPerSecond: { type: Number, default: 0 },
        memoryUsageMB: { type: Number, default: 0 },

        hasErrors: { type: Boolean, default: false },
        errorDetails: [{
          file: { type: String },
          message: { type: String },
          timestamp: { type: Date, default: Date.now },
        }],
        totalErrors: { type: Number, default: 0 },

        batchId: { type: String, required: true },
        serverInfo: {
          hostname: { type: String },
          platform: { type: String },
          nodeVersion: { type: String },
          memory: {
            total: { type: Number },
            free: { type: Number },
            used: { type: Number },
          },
        },

        deletedAt: { type: Date, default: null },
      },
      {
        timestamps: true,
      },
    );

    // Create indexes
    schema.index({ startTime: -1 });
    schema.index({ status: 1, startTime: -1 });
    schema.index({ jobType: 1, startTime: -1 });
    schema.index({ createdAt: -1 });

    super(connection, 'import_log', 'import_logs', schema);
  }
}
