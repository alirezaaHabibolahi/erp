import { Injectable } from '@nestjs/common';
import { fileTypeFromBuffer } from 'file-type';

import { ListOptions } from '@app/common/services';
import { FileInfo } from '@app/common/services';
import { FileCategory, UploadFileInfo } from '@app/common/services';
import {
  DirectoryService,
  FinderService,
  HashAlgorithm,
  HashService,
  ReaderService,
  TempService,
  WriterService,
} from '@app/common/services/fileService/helpers';

@Injectable()
export class FileService {
  constructor(
    private readonly reader: ReaderService,
    private readonly writer: WriterService,
    private readonly directory: DirectoryService,
    private readonly finder: FinderService,
    private readonly hash: HashService,
    private readonly temp: TempService,
  ) {}

  /* -------------------------------------------------------------------------- */
  /*                                  Reader                                    */
  /* -------------------------------------------------------------------------- */

  read(path: string, encoding?: BufferEncoding) {
    return this.reader.read(path, encoding);
  }

  readBuffer(path: string) {
    return this.reader.readBuffer(path);
  }

  readJson<T>(path: string) {
    return this.reader.readJson<T>(path);
  }

  exists(path: string) {
    return this.reader.exists(path);
  }

  isFile(path: string) {
    return this.reader.isFile(path);
  }

  isDirectory(path: string) {
    return this.reader.isDirectory(path);
  }

  stat(path: string) {
    return this.reader.stat(path);
  }

  size(path: string) {
    return this.reader.size(path);
  }

  /* -------------------------------------------------------------------------- */
  /*                                  Writer                                    */
  /* -------------------------------------------------------------------------- */

  write(
    path: string,
    data: string | Buffer,
    options?: {
      overwrite?: boolean;
      encoding?: BufferEncoding;
      createDirectory?: boolean;
    },
  ) {
    return this.writer.write(path, data, options);
  }

  writeJson(path: string, data: unknown, indent = 4) {
    return this.writer.writeJson(path, data, indent);
  }

  append(path: string, data: string | Buffer) {
    return this.writer.append(path, data);
  }

  touch(path: string) {
    return this.writer.touch(path);
  }

  truncate(path: string) {
    return this.writer.truncate(path);
  }

  copy(source: string, destination: string, overwrite = true) {
    return this.writer.copy(source, destination, overwrite);
  }

  move(source: string, destination: string, overwrite = true) {
    return this.writer.move(source, destination, overwrite);
  }

  rename(path: string, newName: string) {
    return this.writer.rename(path, newName);
  }

  delete(path: string, force = true) {
    return this.writer.delete(path, force);
  }

  /* -------------------------------------------------------------------------- */
  /*                               Directories                                  */
  /* -------------------------------------------------------------------------- */

  createDirectory(path: string) {
    return this.directory.create(path);
  }

  ensureDirectory(path: string) {
    return this.directory.ensure(path);
  }

  deleteDirectory(path: string) {
    return this.directory.delete(path);
  }

  emptyDirectory(path: string) {
    return this.directory.empty(path);
  }

  listDirectory(path: string) {
    return this.directory.list(path);
  }

  listDirectoryAbsolute(path: string) {
    return this.directory.listAbsolute(path);
  }

  directoryCount(path: string) {
    return this.directory.count(path);
  }

  directorySize(path: string) {
    return this.directory.directorySize(path);
  }

  isDirectoryEmpty(path: string) {
    return this.directory.isEmpty(path);
  }

  /* -------------------------------------------------------------------------- */
  /*                                  Finder                                    */
  /* -------------------------------------------------------------------------- */

  list(options: ListOptions): Promise<FileInfo[]> {
    return this.finder.list(options);
  }

  find(options: ListOptions): Promise<FileInfo[]> {
    return this.finder.find(options);
  }

  findFirst(options: ListOptions): Promise<FileInfo | null> {
    return this.finder.findFirst(options);
  }

  count(options: ListOptions) {
    return this.finder.count(options);
  }

  /* -------------------------------------------------------------------------- */
  /*                                   Hash                                     */
  /* -------------------------------------------------------------------------- */

  hashFile(path: string, algorithm: HashAlgorithm = 'sha256') {
    return this.hash.hashFile(path, algorithm);
  }

  hashBuffer(buffer: Buffer, algorithm: HashAlgorithm = 'sha256') {
    return this.hash.hashBuffer(buffer, algorithm);
  }

  hashString(
    value: string,
    algorithm: HashAlgorithm = 'sha256',
    encoding: BufferEncoding = 'utf8',
  ) {
    return this.hash.hashString(value, algorithm, encoding);
  }

  compareFile(path: string, hash: string, algorithm: HashAlgorithm = 'sha256') {
    return this.hash.compareFile(path, hash, algorithm);
  }

  compareBuffer(
    buffer: Buffer,
    hash: string,
    algorithm: HashAlgorithm = 'sha256',
  ) {
    return this.hash.compareBuffer(buffer, hash, algorithm);
  }

  compareString(
    value: string,
    hash: string,
    algorithm: HashAlgorithm = 'sha256',
    encoding: BufferEncoding = 'utf8',
  ) {
    return this.hash.compareString(value, hash, algorithm, encoding);
  }

  /* -------------------------------------------------------------------------- */
  /*                                   Temp                                     */
  /* -------------------------------------------------------------------------- */

  getTempDirectory() {
    return this.temp.getTempDirectory();
  }

  createTempDirectory(prefix?: string) {
    return this.temp.createTempDirectory(prefix);
  }

  createTempFile(extension?: string) {
    return this.temp.createTempFile(extension);
  }

  removeTempFile(path: string) {
    return this.temp.removeTempFile(path);
  }

  removeTempDirectory(path: string) {
    return this.temp.removeTempDirectory(path);
  }

  generateTempFilePath(extension?: string) {
    return this.temp.generateTempFilePath(extension);
  }

  generateTempDirectoryPath() {
    return this.temp.generateTempDirectoryPath();
  }

  // other stuff


  async isImage(buffer: Buffer): Promise<boolean> {
    return (await this.getInfo(buffer)).category === FileCategory.Image;
  }

  async isVideo(buffer: Buffer): Promise<boolean> {
    return (await this.getInfo(buffer)).category === FileCategory.Video;
  }

  async isAudio(buffer: Buffer): Promise<boolean> {
    return (await this.getInfo(buffer)).category === FileCategory.Audio;
  }

  async isExcel(buffer: Buffer): Promise<boolean> {
    return (await this.getInfo(buffer)).category === FileCategory.Excel;
  }

  async isZip(buffer: Buffer): Promise<boolean> {
    return (await this.getInfo(buffer)).category === FileCategory.Zip;
  }

  async isPdf(buffer: Buffer): Promise<boolean> {
    return (await this.getInfo(buffer)).category === FileCategory.Pdf;
  }

  async getInfo(buffer: Buffer): Promise<UploadFileInfo> {
    const type = await fileTypeFromBuffer(buffer);

    if (!type) {
      return {
        category: FileCategory.Unknown,
      };
    }

    return {
      extension: type.ext,

      mimeType: type.mime,

      category: this.detectCategory(type.mime),
    };
  }

  private detectCategory(mime: string): FileCategory {
    if (mime.startsWith('image/')) {
      return FileCategory.Image;
    }

    if (mime.startsWith('video/')) {
      return FileCategory.Video;
    }

    if (mime.startsWith('audio/')) {
      return FileCategory.Audio;
    }

    if (
      mime ===
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      mime === 'application/vnd.ms-excel'
    ) {
      return FileCategory.Excel;
    }

    if (mime === 'application/pdf') {
      return FileCategory.Pdf;
    }

    if (mime === 'application/zip' || mime === 'application/x-zip-compressed') {
      return FileCategory.Zip;
    }

    return FileCategory.Document;
  }
}
