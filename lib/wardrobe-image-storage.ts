import {
  copyAsync,
  documentDirectory,
  EncodingType,
  getInfoAsync,
  makeDirectoryAsync,
  writeAsStringAsync,
} from 'expo-file-system/legacy';

const WARDROBE_DIR = `${documentDirectory ?? ''}wardrobe/`;

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chunk = 0x8000;
  let binary = '';
  for (let i = 0; i < bytes.length; i += chunk) {
    const slice = bytes.subarray(i, i + chunk);
    binary += String.fromCharCode(...slice);
  }
  if (typeof globalThis.btoa === 'function') {
    return globalThis.btoa(binary);
  }
  throw new Error('Base64 encoding is not available');
}

async function ensureWardrobeDir(slug: string): Promise<string> {
  const dir = `${WARDROBE_DIR}${slug}/`;
  const info = await getInfoAsync(dir);
  if (!info.exists) {
    await makeDirectoryAsync(dir, { intermediates: true });
  }
  return dir;
}

function extensionFromUri(uri: string): string {
  const match = /\.(\w+)(?:\?|$)/i.exec(uri);
  const ext = match?.[1]?.toLowerCase();
  if (ext === 'png' || ext === 'jpg' || ext === 'jpeg' || ext === 'webp' || ext === 'heic') {
    return ext === 'jpeg' ? 'jpg' : ext;
  }
  return 'jpg';
}

/** Copies the original upload into app storage (backup). */
export async function persistOriginalWardrobeImage(
  sourceUri: string,
  slug: string,
): Promise<string> {
  const dir = await ensureWardrobeDir(slug);
  const ext = extensionFromUri(sourceUri);
  const dest = `${dir}original.${ext}`;
  await copyAsync({ from: sourceUri, to: dest });
  return dest;
}

/** Writes a cleaned PNG (transparent background) into app storage. */
export async function persistCleanedWardrobePng(
  pngBytes: ArrayBuffer,
  slug: string,
): Promise<string> {
  const dir = await ensureWardrobeDir(slug);
  const dest = `${dir}cleaned.png`;
  const base64 = arrayBufferToBase64(pngBytes);
  await writeAsStringAsync(dest, base64, {
    encoding: EncodingType.Base64,
  });
  return dest;
}

/** Copies a cleaned file URI (e.g. from native ML) into the wardrobe folder. */
export async function persistCleanedWardrobeFromUri(
  sourceUri: string,
  slug: string,
): Promise<string> {
  const dir = await ensureWardrobeDir(slug);
  const dest = `${dir}cleaned.png`;
  await copyAsync({ from: sourceUri, to: dest });
  return dest;
}

export function createWardrobeImageSlug(): string {
  return `piece-${Date.now()}`;
}
