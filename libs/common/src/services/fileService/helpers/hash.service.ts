import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import * as fs from 'fs/promises';
import * as fsSync from 'fs';
import * as crypto from 'crypto';

export type HashAlgorithm =
  | 'md5'
  | 'sha1'
  | 'sha256'
  | 'sha384'
  | 'sha512';

@Injectable()
export class HashService {

  private async exists(path: string): Promise<boolean> {
    try {
      await fs.access(path);
      return true;
    } catch {
      return false;
    }
  }

  async hashString(
    value: string,
    algorithm: HashAlgorithm = 'sha256',
    encoding: BufferEncoding = 'utf8',
  ): Promise<string> {

    return crypto
      .createHash(algorithm)
      .update(value, encoding)
      .digest('hex');

  }

  async hashBuffer(
    buffer: Buffer,
    algorithm: HashAlgorithm = 'sha256',
  ): Promise<string> {

    return crypto
      .createHash(algorithm)
      .update(buffer)
      .digest('hex');

  }

  async hashFile(
    filePath: string,
    algorithm: HashAlgorithm = 'sha256',
  ): Promise<string> {

    if (!(await this.exists(filePath))) {
      throw new NotFoundException(filePath);
    }

    return new Promise((resolve, reject) => {

      const hash = crypto.createHash(algorithm);

      const stream = fsSync.createReadStream(filePath);

      stream.on('data', chunk => {
        hash.update(chunk);
      });

      stream.on('error', err => {
        reject(err);
      });

      stream.on('end', () => {
        resolve(hash.digest('hex'));
      });

    });

  }

  async compareFile(
    filePath: string,
    expectedHash: string,
    algorithm: HashAlgorithm = 'sha256',
  ): Promise<boolean> {

    const actual = await this.hashFile(
      filePath,
      algorithm,
    );

    return actual === expectedHash;

  }

  async compareBuffer(
    buffer: Buffer,
    expectedHash: string,
    algorithm: HashAlgorithm = 'sha256',
  ): Promise<boolean> {

    const actual = await this.hashBuffer(
      buffer,
      algorithm,
    );

    return actual === expectedHash;

  }

  async compareString(
    value: string,
    expectedHash: string,
    algorithm: HashAlgorithm = 'sha256',
    encoding: BufferEncoding = 'utf8',
  ): Promise<boolean> {

    const actual = await this.hashString(
      value,
      algorithm,
      encoding,
    );

    return actual === expectedHash;

  }

}