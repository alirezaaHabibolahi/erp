export interface ZipAddFileOptions {

  /**
   * File on disk.
   */
  source: string;

  /**
   * Destination inside zip.
   *
   * Example:
   * reports/users.xlsx
   */
  destination: string;

}