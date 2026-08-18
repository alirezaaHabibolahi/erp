export interface ExcelImportOptions {

  /**
   * Worksheet name.
   */
  sheet?: string;

  /**
   * Worksheet index.
   */
  sheetIndex?: number;

  /**
   * Header row number.
   */
  headerRow?: number;

  /**
   * Ignore empty rows.
   */
  ignoreEmptyRows?: boolean;

  /**
   * Trim string values.
   */
  trim?: boolean;

  /**
   * Convert numeric strings.
   */
  convertNumbers?: boolean;

  /**
   * Convert Excel dates.
   */
  convertDates?: boolean;

  /**
   * Column mapping.
   *
   * Example:
   * {
   *    name: 'نام',
   *    age: 'سن'
   * }
   */
  map?: Record<string, string>;

}