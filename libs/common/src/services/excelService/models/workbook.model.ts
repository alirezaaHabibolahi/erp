import * as ExcelJS from 'exceljs';
import * as fs from 'fs/promises';

import { Writable } from 'stream';

import { WorksheetModel } from './worksheet.model';
import { ExcelSaveOptions } from '../interfaces/excel-save-options.interface';

export class WorkbookModel {

  constructor(
    private readonly workbook: ExcelJS.Workbook,
  ) {}

  /**
   * Returns native exceljs workbook.
   * Use only for advanced scenarios.
   */
  native(): ExcelJS.Workbook {

    return this.workbook;

  }

  /**
   * Returns worksheet by name.
   */
  sheet(
    name: string,
  ): WorksheetModel {

    const worksheet =
      this.workbook.getWorksheet(name);

    if (!worksheet) {

      throw new Error(
        `Worksheet "${name}" not found.`,
      );

    }

    return new WorksheetModel(
      worksheet,
    );

  }

  /**
   * Returns worksheet by index.
   */
  sheetAt(
    index: number,
  ): WorksheetModel {

    const worksheet =
      this.workbook.worksheets[index];

    if (!worksheet) {

      throw new Error(
        `Worksheet index "${index}" not found.`,
      );

    }

    return new WorksheetModel(
      worksheet,
    );

  }

  /**
   * Returns every worksheet.
   */
  worksheets(): WorksheetModel[] {

    return this.workbook.worksheets.map(
      worksheet =>
        new WorksheetModel(
          worksheet,
        ),
    );

  }

  /**
   * Returns worksheet names.
   */
  sheetNames(): string[] {

    return this.workbook.worksheets.map(
      worksheet => worksheet.name,
    );

  }

  /**
   * Adds worksheet.
   */
  addSheet(
    name: string,
  ): WorksheetModel {

    const worksheet =
      this.workbook.addWorksheet(
        name,
      );

    return new WorksheetModel(
      worksheet,
    );

  }

  /**
   * Removes worksheet.
   */
  removeSheet(
    name: string,
  ): this {

    const worksheet =
      this.workbook.getWorksheet(
        name,
      );

    if (!worksheet) {

      return this;

    }

    this.workbook.removeWorksheet(
      worksheet.id,
    );

    return this;

  }

  /**
   * Rename worksheet.
   */
  renameSheet(
    oldName: string,
    newName: string,
  ): this {

    const worksheet =
      this.workbook.getWorksheet(
        oldName,
      );

    if (!worksheet) {

      throw new Error(
        `Worksheet "${oldName}" not found.`,
      );

    }

    worksheet.name = newName;

    return this;

  }

  /**
   * Save workbook.
   */
  async save(
    options: ExcelSaveOptions,
  ): Promise<void> {

    if (options.path) {

      await fs.mkdir(
        require('path').dirname(
          options.path,
        ),
        {
          recursive: true,
        },
      );

      await this.workbook.xlsx.writeFile(
        options.path,
      );

      return;

    }

    if (options.stream) {

      await this.workbook.xlsx.write(
        options.stream as Writable,
      );

      return;

    }

    throw new Error(
      'Path or stream is required.',
    );

  }

  /**
   * Returns workbook buffer.
   */
  async toBuffer(): Promise<Buffer> {

    const buffer =
      await this.workbook.xlsx.writeBuffer();

    return Buffer.from(
      buffer,
    );

  }

}