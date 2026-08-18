import { Injectable, Logger } from '@nestjs/common';
import {
  ApiGraphqlService, DateHelper,
  DownloadService,
  ExcelService,
  ZipService,
} from '@app/common';
import { ConfigService } from '@nestjs/config';
import * as ExcelJS from 'exceljs';
import { parse } from 'csv-parse';
import { Readable } from 'stream';

import { QUERY_STUFFID_FILES_COUNT } from '@app/common/services/apiService/graphql-requests';
import { generalConfig } from '../config/general';
import { IProductDoc } from '@/types/product';
import { StuffidRepository } from './stuffid.repository';
import { FileItem, FilesCountResponse, ImportStats, FileImportResult } from '../types/stuffid.type';

@Injectable()
export class StuffidService {
  private readonly logger = new Logger(StuffidService.name);

  private readonly downloadFileUrl = generalConfig().STUFFID_DOWNLOAD_FILE_URL;
  private readonly fileListUrl = generalConfig().STUFFID_FILE_LIST_URL;

  private readonly DB_BATCH_SIZE = generalConfig().DB_BATCH_SIZE;
  private isProcessing = false;

  constructor(
    private readonly graphqlService: ApiGraphqlService,
    private readonly configService: ConfigService,
    private readonly downloadService: DownloadService,
    private readonly excelService: ExcelService,
    private readonly zipService: ZipService,
    private readonly stuffidRepositroy: StuffidRepository,
  ) {}

  private createColumnMap(headers: any[]): Map<string, number> {
    const map = new Map<string, number>();

    const columnMappings: Record<string, string[]> = {
      ID: ['ID'],
      DescriptionOfID: ['DescriptionOfID'],
      VAT: ['VAT', 'Vat'],
      Taxable: ['Taxable'],
      RunDate: ['RunDate'],
      ExpirationDate: ['ExpirationDate'],
      Type: ['Type'],
      CreateDate: ['CreateDate'],
      LastEditDate: ['LastEditDate'],
    };

    const persianMappings: Record<string, string[]> = {
      ID: ['شناسه', 'شناسه یکتای رکوردهای جدول'],
      DescriptionOfID: ['شرح', 'شرح شناسه اختصاصی کالا یا خدمت'],
      VAT: ['مالیات', 'نرخ مالیات بر ارزش افزوده'],
      Taxable: ['مشمول', 'وضعیت مشمول یا معاف بودن'],
      RunDate: ['تاریخ اعمال', 'تاریخ اعمال شناسه اختصاصی'],
      ExpirationDate: ['پایان اعتبار', 'تاریخ پایان اعتبار شناسه'],
      Type: ['نوع', 'نوع شناسه'],
      CreateDate: ['ایجاد', 'تاریخ ایجاد'],
      LastEditDate: ['آخرین', 'زمان آخرین تغییر'],
    };

    headers.forEach((header, index) => {
      if (!header) return;
      const normalizedHeader = String(header).trim();

      for (const [key, patterns] of Object.entries(columnMappings)) {
        if (patterns.some((p) => normalizedHeader === p)) {
          map.set(key, index);
          return;
        }
      }
      for (const [key, patterns] of Object.entries(persianMappings)) {
        if (patterns.some((p) => normalizedHeader.includes(p))) {
          map.set(key, index);
          return;
        }
      }
    });

    return map;
  }

  private mapRowToProduct(
    row: any[],
    columnMap: Map<string, number>,
    batchId: string,
    sourceFile: string,
    parseDate: (v: unknown) => Date | null,
    now: Date,
  ): Partial<IProductDoc> {
    const getValue = (key: string): any => {
      const index = columnMap.get(key);
      if (index === undefined || index >= row.length) return null;
      const value = row[index];
      return value === '' || value === undefined || value === null
        ? null
        : value;
    };

    const idValue = getValue('ID');
    const descValue = getValue('DescriptionOfID');
    const vatValue = getValue('VAT');
    const taxableValue = getValue('Taxable');
    const typeValue = getValue('Type');

    let vat =
      vatValue !== null && vatValue !== undefined ? Number(vatValue) : 0;
    if (isNaN(vat) || vat < 0 || vat > 100) vat = 0;

    return {
      ID: idValue ? String(idValue).trim() : '',
      DescriptionOfID: descValue ? String(descValue).trim() : 'بدون شرح',
      VAT: vat,
      Taxable: taxableValue ? String(taxableValue).trim() : 'نامشخص',
      Type: typeValue ? String(typeValue).trim() : 'نامشخص',
      RunDate: parseDate(getValue('RunDate')) || now,
      ExpirationDate: parseDate(getValue('ExpirationDate')),
      CreateDate: parseDate(getValue('CreateDate')) || now,
      LastEditDate: parseDate(getValue('LastEditDate')) || now,
      importBatch: batchId,
      importDate: now,
      sourceFile,
    } as Partial<IProductDoc>;
  }

  private isEmptyRow(values: any[]): boolean {
    if (!values || values.length === 0) return true;
    return values.every(
      (v) => v === null || v === undefined || String(v).trim() === '',
    );
  }

  private async parseAndSaveExcelStreaming(
    excelBuffer: Buffer,
    batchId: string,
    sourceFile: string,
  ): Promise<FileImportResult> {
    const { parseDate, clear } = DateHelper.createDateParser();
    const now = new Date();

    const stream = Readable.from(excelBuffer);
    const workbookReader = new (ExcelJS as any).stream.xlsx.WorkbookReader(
      stream,
      {
        entries: 'emit',
        sharedStrings: 'cache',
        styles: 'ignore',
        hyperlinks: 'ignore',
      },
    );

    let columnMap: Map<string, number> | null = null;
    let batch: Partial<IProductDoc>[] = [];
    let totalRows = 0;
    let inserted = 0;
    let failed = 0;

    const flush = async () => {
      if (batch.length === 0) return;
      const toSave = batch;
      batch = []; // release reference before awaiting, so GC can reclaim during the DB call

      const result = await this.saveBatchWithRetry(toSave);
      inserted += result.inserted;
      failed += result.failed;

      if (totalRows % 100000 < this.DB_BATCH_SIZE) {
        this.logger.log(
          `Excel progress: ${totalRows} rows read, ${inserted} inserted, ${failed} failed`,
        );
      }
    };

    for await (const worksheetReader of workbookReader) {
      let isFirstRow = true;

      for await (const row of worksheetReader) {
        const values = this.extractRowValues(row);

        if (isFirstRow) {
          columnMap = this.createColumnMap(values);
          this.logger.log(`Headers: ${JSON.stringify(values)}`);
          isFirstRow = false;
          continue;
        }

        if (this.isEmptyRow(values)) continue;

        totalRows++;
        const product = this.mapRowToProduct(
          values,
          columnMap!,
          batchId,
          sourceFile,
          parseDate,
          now,
        );
        batch.push(product);

        if (batch.length >= this.DB_BATCH_SIZE) {
          await flush();
        }
      }
    }

    await flush();
    clear();

    this.logger.log(
      `Excel parsing complete: ${totalRows} rows, ${inserted} inserted, ${failed} failed`,
    );

    return { totalRows, inserted, failed };
  }

  private extractRowValues(row: ExcelJS.Row): any[] {
    const raw = row.values as any;
    const values: any[] = [];
    if (Array.isArray(raw)) {
      for (let i = 1; i < raw.length; i++)
        values.push(this.extractCellValue(raw[i]));
    } else if (raw && typeof raw === 'object') {
      let index = 1;
      while (raw[index] !== undefined) {
        values.push(this.extractCellValue(raw[index]));
        index++;
      }
    }
    return values;
  }

  private extractCellValue(cell: any): any {
    if (cell === null || cell === undefined) return null;
    if (typeof cell !== 'object') return cell;
    if (cell.text !== undefined) return cell.text;
    if (cell.result !== undefined) return cell.result;
    if (cell.richText && Array.isArray(cell.richText)) {
      return cell.richText.map((rt: any) => rt.text || '').join('');
    }
    if (cell.formula) return cell.result || cell.text || null;
    return cell;
  }

  private async parseAndSaveCsvStreaming(
    csvBuffer: Buffer,
    batchId: string,
    sourceFile: string,
  ): Promise<FileImportResult> {
    const { parseDate, clear } = DateHelper.createDateParser();
    const now = new Date();

    const delimiter = this.detectDelimiterWithQuotes(
      csvBuffer.subarray(0, 10 * 1024).toString('utf8'),
    );
    this.logger.log(
      `Using delimiter: "${delimiter === '\t' ? 'TAB' : delimiter}"`,
    );

    const inputStream = this.bufferToChunkedStream(csvBuffer);
    const parser = parse({
      delimiter,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true,
      relax_quotes: true,
      escape: '"',
      quote: '"',
      columns: false,
    });
    inputStream.pipe(parser);

    let columnMap: Map<string, number> | null = null;
    let isFirstRow = true;
    let batch: Partial<IProductDoc>[] = [];
    let totalRows = 0;
    let inserted = 0;
    let failed = 0;

    const flush = async () => {
      if (batch.length === 0) return;
      const toSave = batch;
      batch = [];

      const result = await this.saveBatchWithRetry(toSave);
      inserted += result.inserted;
      failed += result.failed;

      if (totalRows % 100000 < this.DB_BATCH_SIZE) {
        this.logger.log(
          `CSV progress: ${totalRows} rows read, ${inserted} inserted, ${failed} failed`,
        );
      }
    };

    for await (const record of parser) {
      const values = record as any[];

      if (isFirstRow) {
        columnMap = this.createColumnMap(values.map((v) => String(v).trim()));
        this.logger.log(`Headers: ${JSON.stringify(values)}`);
        isFirstRow = false;
        continue;
      }

      if (this.isEmptyRow(values)) continue;

      totalRows++;
      const product = this.mapRowToProduct(
        values,
        columnMap!,
        batchId,
        sourceFile,
        parseDate,
        now,
      );
      batch.push(product);

      if (batch.length >= this.DB_BATCH_SIZE) {
        inputStream.pause();
        await flush();
        inputStream.resume();
      }
    }

    await flush();
    clear();

    this.logger.log(
      `CSV parsing complete: ${totalRows} rows, ${inserted} inserted, ${failed} failed`,
    );

    return { totalRows, inserted, failed };
  }

  private bufferToChunkedStream(
    buffer: Buffer,
    chunkSize = 64 * 1024,
  ): Readable {
    let offset = 0;
    return new Readable({
      read() {
        if (offset >= buffer.length) {
          this.push(null);
          return;
        }
        const end = Math.min(offset + chunkSize, buffer.length);
        this.push(buffer.subarray(offset, end));
        offset = end;
      },
    });
  }

  private detectDelimiterWithQuotes(sample: string): string {
    const lines = sample.split('\n').filter((line) => line.trim());
    if (lines.length === 0) return ',';

    const firstLine = lines[0];
    const delimiters = ['\t', ',', ';', '|'];
    let bestDelimiter = ',';
    let bestCount = 0;

    for (const delim of delimiters) {
      let count = 0;
      let inQuotes = false;

      for (let i = 0; i < firstLine.length; i++) {
        const char = firstLine[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === delim && !inQuotes) {
          count++;
        }
      }

      if (count > bestCount) {
        bestCount = count;
        bestDelimiter = delim;
      }
    }

    return bestDelimiter;
  }

  async extractAndParseExcel(
    zipFilePath: string,
    batchId: string,
  ): Promise<FileImportResult> {
    this.logger.log(`Processing ZIP file: ${zipFilePath}, Batch: ${batchId}`);

    const zip = await this.zipService.open({ path: zipFilePath });
    const entries = await this.zipService.entries(zip);

    const supportedExtensions = ['.xlsx', '.xls', '.xlsm', '.xlsb', '.csv'];
    let dataEntry = entries.find(
      (entry) =>
        !entry.isDirectory &&
        supportedExtensions.some(
          (ext) =>
            entry.name.toLowerCase().endsWith(ext) ||
            entry.extension.toLowerCase() === ext.toLowerCase(),
        ),
    );

    if (!dataEntry) {
      dataEntry = entries.find((entry) => !entry.isDirectory);
    }
    if (!dataEntry) {
      throw new Error('No file found in ZIP archive');
    }

    this.logger.log(`Found data file: ${dataEntry.name}`);

    if (dataEntry.extension.toLowerCase() === '.csv') {
      this.logger.log('Processing CSV file (streaming)...');
      const csvBuffer = await this.zipService.readBuffer(zip, dataEntry.name);
      return this.parseAndSaveCsvStreaming(csvBuffer, batchId, dataEntry.name);
    }

    this.logger.log('Processing Excel file (streaming)...');
    const excelBuffer = await this.zipService.readBuffer(zip, dataEntry.name);
    return this.parseAndSaveExcelStreaming(
      excelBuffer,
      batchId,
      dataEntry.name,
    );
  }


  private async saveBatchWithRetry(
    batch: Partial<IProductDoc>[],
  ): Promise<{ inserted: number; failed: number }> {
    if (batch.length === 0) return { inserted: 0, failed: 0 };

    try {
      const result = await this.stuffidRepositroy.saveProducts(batch);
      return { inserted: result.inserted, failed: result.failed || 0 };
    } catch (error) {
      if (batch.length === 1) {
        this.logger.warn(
          `Failed to save product ${batch[0].ID}: ${error.message}`,
        );
        return { inserted: 0, failed: 1 };
      }

      this.logger.warn(
        `Batch of ${batch.length} failed (${error.message}), retrying as two halves`,
      );
      const mid = Math.floor(batch.length / 2);
      const [a, b] = await Promise.all([
        this.saveBatchWithRetry(batch.slice(0, mid)),
        this.saveBatchWithRetry(batch.slice(mid)),
      ]);
      return { inserted: a.inserted + b.inserted, failed: a.failed + b.failed };
    }
  }

  async getFilesList(): Promise<FileItem[]> {
    const url = generalConfig().STUFFID_URL + this.fileListUrl;

    const response: any = await this.graphqlService.callGraphApi(
      url,
      QUERY_STUFFID_FILES_COUNT,
      {
        input: {
          exportType: 0,
          isService: 2,
        },
      },
    );
    const convertedData: FilesCountResponse = response;
    const items = convertedData?.FilesCount?.data?.items || [];
    return items.filter((item) => item.fileGuid !== 'all');
  }

  async downloadProductFile(
    fileGuid: string,
    fileName: string,
    mimeType: string = 'zip',
  ): Promise<string> {
    const downloadUrl = `${generalConfig().STUFFID_URL}${this.downloadFileUrl}${fileGuid}`;
    const localFileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${mimeType}`;
    return this.downloadService.downloadFile(
      downloadUrl,
      localFileName,
      600000,
      5,
    );
  }

  async importAllProducts(batchId: string, files: FileItem[] = []): Promise<{
    success: boolean;
    message: string;
    stats: ImportStats;
  }> {
    if (this.isProcessing) {
      return {
        success: false,
        message: 'Import is already in progress',
        stats: {
          totalFiles: 0,
          filesProcessed: 0,
          totalProducts: 0,
          productsInserted: 0,
          productsFailed: 0,
          errors: ['Import already in progress'],
          processingTime: 0,
        },
      };
    }

    this.isProcessing = true;
    const startTime = Date.now();

    const stats: ImportStats = {
      totalFiles: 0,
      filesProcessed: 0,
      totalProducts: 0,
      productsInserted: 0,
      productsFailed: 0,
      errors: [],
      processingTime: 0,
    };

    try {
      this.logger.log('Step 1: Fetching file list from API...');
      if(!files.length){
        files = await this.getFilesList();
      }
      stats.totalFiles = files.length;
      this.logger.log(`Found ${files.length} files to process`);
      if (files.length === 0) {
        return { success: true, message: 'No files found to process', stats };
      }

      const downloadPromises = files.map((file) =>
        this.downloadProductFile(file.fileGuid, file.fileTitle),
      );
      const downloadPaths = await Promise.all(downloadPromises);

      // const downloadPaths = [
      //   path.join(process.cwd(), "downloads", "1784836800480_cml8yw.zip"),
      //   path.join(process.cwd(), "downloads", "1784836800491_91j9a9.zip"),
      //   path.join(process.cwd(), "downloads", "1784836800495_feqmkc.zip"),
      //   path.join(process.cwd(), "downloads", "1784836800499_mha7uh.zip"),
      //   path.join(process.cwd(), "downloads", "1784836800503_locopd.zip"),
      //   path.join(process.cwd(), "downloads", "1784836800506_zuaz.zip"),
      // ]

      for (const index in files) {
        let downloadedPath: string | null = null;
        const file = files[index];

        try {
          const fileStartTime = Date.now();
          this.logger.log(
            `Processing file: ${file.fileTitle} (${file.fileGuid})`,
          );

          downloadedPath = downloadPaths[index];
          if (!downloadedPath) continue;

          this.logger.log(`Extracting and parsing data file from ZIP...`);
          const result = await this.extractAndParseExcel(
            downloadedPath,
            batchId,
          );

          stats.totalProducts += result.totalRows;
          stats.productsInserted += result.inserted;
          stats.productsFailed += result.failed;

          const fileDuration = ((Date.now() - fileStartTime) / 1000).toFixed(2);
          this.logger.log(
            `File ${file.fileTitle} completed in ${fileDuration}s: ` +
              `Inserted ${result.inserted}, Failed ${result.failed}`,
          );

          stats.filesProcessed++;
        } catch (error) {
          stats.errors.push(`${file.fileTitle}: ${error.message}`);
          this.logger.error(
            `Failed processing ${file.fileTitle}: ${error.message}`,
            error.stack,
          );
        } finally {
          if (downloadedPath) {
            this.downloadService.cleanupFile(downloadedPath).then().catch(err=> this.logger.error(err));
          }
          this.logger.log(`Cleaned up downloaded file: ${file.fileTitle}`);
        }
      }

      stats.processingTime = (Date.now() - startTime) / 1000;

      const message =
        stats.errors.length > 0
          ? `Processed ${stats.filesProcessed}/${stats.totalFiles} files with ${stats.errors.length} errors`
          : `Successfully processed ${stats.filesProcessed}/${stats.totalFiles} files`;

      this.logger.log(
        `Import completed in ${stats.processingTime.toFixed(2)}s: ${message}`,
      );

      return { success: true, message, stats };
    } catch (error) {
      stats.processingTime = (Date.now() - startTime) / 1000;
      this.logger.error(`Import failed: ${error.message}`, error.stack);
      return {
        success: false,
        message: `Import failed: ${error.message}`,
        stats,
      };
    } finally {
      this.isProcessing = false;
    }
  }


  async cleanUpBatch(batchId: string) {
    return this.stuffidRepositroy.cleanupBatch(batchId);
  }

  isImportRunning(): boolean {
    return this.isProcessing;
  }

  //  async importSingleFile(
  //   fileGuid: string,
  //   batchId: string,
  // ): Promise<{
  //   success: boolean;
  //   message: string;
  //   stats: {
  //     totalProducts: number;
  //     productsInserted: number;
  //     productsFailed: number;
  //     processingTime: number;
  //   };
  // }> {
  //   const startTime = Date.now();
  //
  //   try {
  //     const files = await this.getFilesList();
  //     const file = files.find((f) => f.fileGuid === fileGuid);
  //
  //     if (!file) {
  //       throw new Error(`File with GUID ${fileGuid} not found`);
  //     }
  //
  //     this.logger.log(`Processing single file: ${file.fileTitle}`);
  //
  //     const downloadedPath = await this.downloadProductFile(file.fileGuid, file.fileTitle);
  //
  //     try {
  //       const result = await this.extractAndParseExcel(downloadedPath, batchId);
  //       const processingTime = (Date.now() - startTime) / 1000;
  //
  //       return {
  //         success: true,
  //         message: `Successfully imported file ${file.fileTitle} in ${processingTime.toFixed(2)}s`,
  //         stats: {
  //           totalProducts: result.totalRows,
  //           productsInserted: result.inserted,
  //           productsFailed: result.failed,
  //           processingTime,
  //         },
  //       };
  //     } finally {
  //       await this.downloadService.cleanupFile(downloadedPath);
  //     }
  //   } catch (error) {
  //     const processingTime = (Date.now() - startTime) / 1000;
  //
  //     return {
  //       success: false,
  //       message: error.message,
  //       stats: {
  //         totalProducts: 0,
  //         productsInserted: 0,
  //         productsFailed: 0,
  //         processingTime,
  //       },
  //     };
  //   }
  // }
  //
  // private async cleanupDownloadDirectory(cleanupPath: string): Promise<void> {
  //   try {
  //     if (fs.existsSync(cleanupPath)) {
  //       const files = await fs.promises.readdir(cleanupPath);
  //
  //       this.logger.log(`Cleaning download directory: ${files.length} files found`);
  //
  //       for (const file of files) {
  //         const filePath = path.join(cleanupPath, file);
  //         try {
  //           const stat = await fs.promises.stat(filePath);
  //
  //           if (stat.isDirectory()) {
  //             await fs.promises.rm(filePath, { recursive: true, force: true });
  //           } else {
  //             await fs.promises.unlink(filePath);
  //           }
  //
  //           this.logger.log(`Removed: ${file}`);
  //         } catch (error) {
  //           this.logger.error(`Failed to remove ${file}: ${error.message}`);
  //         }
  //       }
  //
  //       this.logger.log('Download directory cleaned successfully');
  //     }
  //   } catch (error) {
  //     this.logger.error(`Failed to clean download directory: ${error.message}`);
  //   }
  // }
}
