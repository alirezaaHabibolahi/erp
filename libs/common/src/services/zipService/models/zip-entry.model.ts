export class ZipEntry {

  constructor(
    public readonly path: string,
    public readonly name: string,
    public readonly extension: string,
    public readonly directory: string,
    public readonly size: number,
    public readonly compressedSize: number,
    public readonly isDirectory: boolean,
    public readonly modifiedAt: Date | undefined,
  ) {}

}