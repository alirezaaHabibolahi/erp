import { memoryStorage } from 'multer';
import { StorageEngine } from 'multer';

export class MemoryStorageFactory {

  static create(): StorageEngine {

    return memoryStorage();

  }

}