export interface FileInfo {
  name: string;

  path: string;

  extension: string;

  size: number;

  createdAt: Date;

  modifiedAt: Date;

  isFile: boolean;

  isDirectory: boolean;
}

export enum FileCategory {
  Image = 'image',
  Video = 'video',
  Audio = 'audio',
  Document = 'document',
  Excel = 'excel',
  Zip = 'zip',
  Pdf = 'pdf',
  Unknown = 'unknown',
}

export interface UploadFileInfo {

  extension?: string;

  mimeType?: string;

  category: FileCategory;

}