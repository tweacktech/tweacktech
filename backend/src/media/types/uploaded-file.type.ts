/**
 * Shape of a file populated by Multer (FileInterceptor).
 * Defined locally so the build does not depend on the global
 * `Express.Multer` namespace from @types/multer being loaded.
 */
export interface UploadedFileData {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
  path?: string;
  filename?: string;
  destination?: string;
}
