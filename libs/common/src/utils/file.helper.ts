import * as path from 'path';
import * as fs from 'fs';

export class FileHelper {
    static ensureDir(dir: string): void {
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    }

    static getFileExtension(filename: string): string {
        return path.extname(filename).replace('.', '');
    }

    static renameFile(originalName: string): string {
        const timestamp = Date.now();
        const ext = path.extname(originalName);
        const base = path.basename(originalName, ext);
        return `${base}_${timestamp}${ext}`;
    }
}
