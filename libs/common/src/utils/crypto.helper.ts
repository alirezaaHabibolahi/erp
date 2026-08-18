import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { v4 as uuid } from 'uuid';

export class CryptoHelper {
    static async hash(value: string, salt: number = 10): Promise<string> {
        return bcrypt.hash(value, salt);
    }

    static async compare(value: string, hash: string): Promise<boolean> {
        return bcrypt.compare(value, hash);
    }

    static generateUUID(): string {
        return uuid();
    }

    static generateRandomToken(length = 32): string {
        return randomBytes(length).toString('hex');
    }
}
