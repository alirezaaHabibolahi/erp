export const FILE_TYPES = {
  images: {
    destination: 'storage/images',
    mimeTypes: [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'image/gif',
    ],
  },

  videos: {
    destination: 'storage/videos',
    mimeTypes: [
      'video/mp4',
      'video/webm',
      'video/quicktime',
      'video/x-msvideo',
    ],
  },

  audios: {
    destination: 'storage/audios',
    mimeTypes: [
      'audio/mpeg',
      'audio/wav',
      'audio/ogg',
      'application/octet-stream',
    ],
  },

  excel: {
    destination: 'storage/excel',
    mimeTypes: [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ],
  },

  documents: {
    destination: 'storage/documents',
    mimeTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
  },

  archives: {
    destination: 'storage/files',
    mimeTypes: [
      'application/zip',
      'application/x-rar-compressed',
      'application/x-zip-compressed',
    ],
  },

  others: {
    destination: 'storage/others',
    mimeTypes: [],
  },
};