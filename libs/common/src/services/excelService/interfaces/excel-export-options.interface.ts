export interface ExcelExportOptions {

  /**
   * Automatically resize columns.
   */
  autoWidth?: boolean;

  /**
   * Freeze first row.
   */
  freezeHeader?: boolean;

  /**
   * Generate header row from object keys.
   */
  createHeader?: boolean;

}