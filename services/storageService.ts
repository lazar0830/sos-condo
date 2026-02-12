import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebaseConfig';

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const COMPRESS_THRESHOLD_BYTES = 300 * 1024; // Compress images over 300KB
const MAX_DIMENSION = 1200; // Max width/height in pixels
const JPEG_QUALITY = 0.82;

/** Compress image client-side for faster uploads. Uses Canvas API. */
async function compressImage(file: File): Promise<File> {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type) || file.size <= COMPRESS_THRESHOLD_BYTES) {
    return file;
  }
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        if (width > height) {
          height = Math.round((height * MAX_DIMENSION) / width);
          width = MAX_DIMENSION;
        } else {
          width = Math.round((width * MAX_DIMENSION) / height);
          height = MAX_DIMENSION;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(file);
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file);
            return;
          }
          const baseName = file.name.replace(/\.[^.]+$/, '');
          const compressed = new File([blob], `${baseName}.jpg`, { type: 'image/jpeg', lastModified: Date.now() });
          resolve(compressed);
        },
        'image/jpeg',
        JPEG_QUALITY
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };
    img.src = url;
  });
}

const MAX_DOCUMENT_SIZE_BYTES = 10 * 1024 * 1024; // 10MB for documents
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_DOCUMENT_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];

export function validateImageFile(file: File): { valid: boolean; error?: string } {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return { valid: false, error: 'imageTypeInvalid' };
  }
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return { valid: false, error: 'imageSizeTooLarge' };
  }
  return { valid: true };
}

export function validateDocumentFile(file: File): { valid: boolean; error?: string } {
  if (!ALLOWED_DOCUMENT_TYPES.includes(file.type)) {
    return { valid: false, error: 'documentTypeInvalid' };
  }
  if (file.size > MAX_DOCUMENT_SIZE_BYTES) {
    return { valid: false, error: 'documentSizeTooLarge' };
  }
  return { valid: true };
}

async function uploadFile(file: File, path: string): Promise<string> {
  if (!storage) throw new Error('Firebase Storage is not configured');
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}

export async function uploadBuildingImage(file: File, buildingId?: string): Promise<string> {
  const validation = validateImageFile(file);
  if (!validation.valid) throw new Error(validation.error);
  const toUpload = await compressImage(file);
  const ext = toUpload.name.split('.').pop() || 'jpg';
  const path = `buildings/${buildingId || crypto.randomUUID()}/image_${Date.now()}.${ext}`;
  return uploadFile(toUpload, path);
}

export async function uploadUnitImage(file: File, unitId: string): Promise<string> {
  const validation = validateImageFile(file);
  if (!validation.valid) throw new Error(validation.error);
  const toUpload = await compressImage(file);
  const ext = toUpload.name.split('.').pop() || 'jpg';
  const path = `units/${unitId}/image_${Date.now()}.${ext}`;
  return uploadFile(toUpload, path);
}

export async function uploadComponentImage(file: File, componentId?: string): Promise<string> {
  const validation = validateImageFile(file);
  if (!validation.valid) throw new Error(validation.error);
  const toUpload = await compressImage(file);
  const ext = toUpload.name.split('.').pop() || 'jpg';
  const id = componentId || `new/${crypto.randomUUID()}`;
  const path = `components/${id}/image_${Date.now()}.${ext}`;
  return uploadFile(toUpload, path);
}

export async function uploadRequestDocument(file: File, requestId: string): Promise<string> {
  const validation = validateDocumentFile(file);
  if (!validation.valid) throw new Error(validation.error);
  const toUpload = ALLOWED_IMAGE_TYPES.includes(file.type) ? await compressImage(file) : file;
  const path = `requests/${requestId}/doc_${Date.now()}_${toUpload.name}`;
  return uploadFile(toUpload, path);
}

export async function uploadContingencyDocument(file: File): Promise<string> {
  const validation = validateDocumentFile(file);
  if (!validation.valid) throw new Error(validation.error);
  const toUpload = ALLOWED_IMAGE_TYPES.includes(file.type) ? await compressImage(file) : file;
  const path = `contingency_docs/doc_${Date.now()}_${toUpload.name}`;
  return uploadFile(toUpload, path);
}

export async function uploadProviderLogo(file: File, providerId: string): Promise<string> {
  const validation = validateImageFile(file);
  if (!validation.valid) throw new Error(validation.error);
  const toUpload = await compressImage(file);
  const ext = toUpload.name.split('.').pop() || 'jpg';
  const path = `providers/${providerId}/logo_${Date.now()}.${ext}`;
  return uploadFile(toUpload, path);
}
