import * as ExcelJS from 'exceljs';

import { ExcelImportOptions } from '@app/common/services';

export class WorksheetModel {

  constructor(
    private readonly worksheet: ExcelJS.Worksheet,
  ) {}

  /**
   * Native exceljs worksheet.
   */
  native(): ExcelJS.Worksheet {

    return this.worksheet;

  }

  /**
   * Worksheet name.
   */
  get name(): string {

    return this.worksheet.name;

  }

  /**
   * Total rows.
   */
  get rowCount(): number {

    return this.worksheet.rowCount;

  }

  /**
   * Total columns.
   */
  get columnCount(): number {

    return this.worksheet.columnCount;

  }

  headers(headerRow = 1): string[] {

    const row = this.worksheet.getRow(headerRow);

    const values = Array.isArray(row.values)
      ? row.values
      : [];

    return values
      .slice(1)
      .map(value => this.cellValueToString(value));

  }

  row(index: number): ExcelJS.CellValue[] {

    const row = this.worksheet.getRow(index);

    return Array.isArray(row.values)
      ? row.values.slice(1)
      : [];

  }

  rows(): ExcelJS.CellValue[][] {

    const result: ExcelJS.CellValue[][] = [];

    this.worksheet.eachRow(row => {

      result.push(
        Array.isArray(row.values)
          ? row.values.slice(1)
          : [],
      );

    });

    return result;

  }
  /**
   * Returns cell value.
   */
  cell(
    row: number,
    column: number | string,
  ) {

    return this.worksheet
      .getCell(
        row,
        column,
      )
      .value;

  }

  /**
   * Adds row.
   */
  addRow(
    data: any,
  ): this {

    this.worksheet.addRow(
      data,
    );

    return this;

  }

  /**
   * Adds rows.
   */
  addRows(
    rows: any[],
  ): this {

    this.worksheet.addRows(
      rows,
    );

    return this;

  }

  /**
   * Insert row.
   */
  insertRow(
    index: number,
    data: any,
  ): this {

    this.worksheet.insertRow(
      index,
      data,
    );

    return this;

  }

  /**
   * Remove row.
   */
  removeRow(
    index: number,
  ): this {

    this.worksheet.spliceRows(
      index,
      1,
    );

    return this;

  }

  /**
   * Clears worksheet.
   */
  clear(): this {

    while (
      this.worksheet.rowCount > 0
      ) {

      this.worksheet.spliceRows(
        1,
        1,
      );

    }

    return this;

  }

  /**
   * Creates header row.
   */
  setHeaders(
    headers: string[],
  ): this {

    this.worksheet.columns =
      headers.map(header => ({

        header,

        key: header,

      }));

    return this;

  }

  /**
   * Export objects.
   */
  fromObjects<T extends Record<string, unknown>>(
    data: T[],
  ): this {

    if (!data.length) {

      return this;

    }

    const headers = Object.keys(data[0]);

    this.setHeaders(
      headers,
    );

    this.addRows(
      data,
    );

    return this;

  }

  /**
   * Convert worksheet into objects.
   */
  toObjects<T>(
    options: ExcelImportOptions = {},
  ): T[] {

    const {

      headerRow = 1,

      ignoreEmptyRows = true,

      trim = true,

      convertNumbers = true,

      map,

    } = options;

    const headers =
      this.headers(
        headerRow,
      );

    const result: T[] = [];

    for (
      let i = headerRow + 1;
      i <= this.worksheet.rowCount;
      i++
    ) {

      const row =
        this.worksheet
          .getRow(i);

      const object: any = {};

      let hasValue = false;

      headers.forEach(
        (header, index) => {

          const key =
            map
              ? Object.keys(map).find(
              k =>
                map[k] ===
                header,
            ) ?? header
              : header;

          let value: unknown =
            row.getCell(index + 1).value;

          if (
            typeof value ===
            'string' &&
            trim
          ) {

            value =
              value.trim();

          }

          if (
            convertNumbers &&
            typeof value ===
            'string' &&
            !isNaN(Number(value))
          ) {

            value =
              Number(value);

          }

          if (
            value !== null &&
            value !== undefined &&
            value !== ''
          ) {

            hasValue = true;

          }

          object[key] = value;

        },
      );

      if (
        ignoreEmptyRows &&
        !hasValue
      ) {

        continue;

      }

      result.push(
        object,
      );

    }

    return result;

  }

  autoWidth(minimum = 10): this {

    this.worksheet.columns.forEach(column => {

      if (!column) {
        return;
      }

      let max = minimum;

      column.eachCell?.(
        { includeEmpty: true },
        cell => {

          const value =
            this.cellValueToString(
              cell.value,
            );

          max = Math.max(
            max,
            value.length,
          );

        },
      );

      column.width = max + 2;

    });

    return this;

  }

  /**
   * Freeze first row.
   */
  freezeHeader(): this {

    this.worksheet.views = [

      {
        state: 'frozen',

        ySplit: 1,

      },

    ];

    return this;

  }

  /**
   * Merge cells.
   */
  merge(
    start: string,
    end: string,
  ): this {

    this.worksheet.mergeCells(
      `${start}:${end}`,
    );

    return this;

  }

  private cellValueToString(
    value: ExcelJS.CellValue,
  ): string {

    if (value == null) {
      return '';
    }

    if (typeof value === 'string') {
      return value;
    }

    if (typeof value === 'number') {
      return value.toString();
    }

    if (typeof value === 'boolean') {
      return value.toString();
    }

    if (value instanceof Date) {
      return value.toISOString();
    }

    if (typeof value === 'object') {

      if ('text' in value) {
        return value.text;
      }

      if ('result' in value) {
        return String(value.result ?? '');
      }

    }

    return String(value);

  }

}