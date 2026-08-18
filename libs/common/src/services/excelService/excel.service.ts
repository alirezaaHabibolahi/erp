import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';

import * as ExcelJS from 'exceljs';
import { Readable } from 'stream';

import { WorkbookModel } from '@app/common/services';
import { ExcelReadOptions } from '@app/common/services';

@Injectable()
export class ExcelService {

  /**
   * Creates a new workbook.
   */
  create(): WorkbookModel {

    return new WorkbookModel(
      new ExcelJS.Workbook(),
    );

  }

  /**
   * Reads an excel workbook.
   */
  async read(
    options: ExcelReadOptions,
  ): Promise<WorkbookModel> {

    const workbook =
      new ExcelJS.Workbook();

    if (options.path) {

      await workbook.xlsx.readFile(
        options.path,
      );

      return new WorkbookModel(
        workbook,
      );

    }

    if (options.buffer) {

      await workbook.xlsx.load(
        options.buffer,
      );

      return new WorkbookModel(
        workbook,
      );

    }

    if (options.stream) {

      await workbook.xlsx.read(
        options.stream as Readable,
      );

      return new WorkbookModel(
        workbook,
      );

    }

    throw new BadRequestException(
      'path, buffer or stream is required.',
    );

  }

  /**
   * Checks whether the source is a valid excel file.
   */
  async isExcel(
    options: ExcelReadOptions,
  ): Promise<boolean> {

    try {

      await this.read(
        options,
      );

      return true;

    } catch {

      return false;

    }

  }

  fromObjects<T extends Record<string, unknown>>(
    data: T[],
    sheetName = 'Sheet1',
  ): WorkbookModel {

    const workbook =
      this.create();

    workbook
      .addSheet(sheetName)
      .fromObjects(data)
      .autoWidth()
      .freezeHeader();

    return workbook;
  }
}