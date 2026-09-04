import * as bcrypt from 'bcrypt';
import { createHash, randomBytes, randomUUID, timingSafeEqual } from 'crypto';

export class CryptoHelper {
  static async hash(value: string, salt: number = 10): Promise<string> {
    return bcrypt.hash(value, salt);
  }

  static async compare(value: string, hash: string): Promise<boolean> {
    return bcrypt.compare(value, hash);
  }

  static generateUUID(): string {
    return randomUUID();
  }

  static generateRandomToken(length = 32): string {
    return randomBytes(length).toString('hex');
  }

  static hashToken(value: string): string {
    return createHash('sha256').update(value).digest('hex');
  }

  static hashEquals(left: string, right: string): boolean {
    const leftBuffer = Buffer.from(left, 'utf8');
    const rightBuffer = Buffer.from(right, 'utf8');

    return (
      leftBuffer.length === rightBuffer.length &&
      timingSafeEqual(leftBuffer, rightBuffer)
    );
  }
}
