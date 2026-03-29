export interface SessionStoragePort {
  delete(filePath: string): Promise<void>;
}
