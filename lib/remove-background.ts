import { Platform } from 'react-native';

const REMOVE_BG_URL = 'https://api.remove.bg/v1.0/removebg';
const CLIPDROP_URL = 'https://clipdrop-api.co/remove-background/v1';

function mimeFromUri(uri: string): string {
  const ext = uri.split('.').pop()?.split('?')[0]?.toLowerCase();
  if (ext === 'png') return 'image/png';
  if (ext === 'webp') return 'image/webp';
  if (ext === 'heic') return 'image/heic';
  return 'image/jpeg';
}

function filenameFromUri(uri: string): string {
  const segment = uri.split('/').pop()?.split('?')[0];
  return segment && segment.includes('.') ? segment : 'wardrobe.jpg';
}

async function fetchRemovedPngBytes(imageUri: string, apiKey: string, provider: 'removebg' | 'clipdrop'): Promise<ArrayBuffer> {
  const formData = new FormData();
  const name = filenameFromUri(imageUri);
  const type = mimeFromUri(imageUri);

  if (provider === 'removebg') {
    formData.append('image_file', { uri: imageUri, name, type } as unknown as Blob);
    formData.append('size', 'auto');
    formData.append('type', 'product');
  } else {
    formData.append('image_file', { uri: imageUri, name, type } as unknown as Blob);
  }

  const response = await fetch(provider === 'removebg' ? REMOVE_BG_URL : CLIPDROP_URL, {
    method: 'POST',
    headers: provider === 'removebg' ? { 'X-Api-Key': apiKey } : { 'x-api-key': apiKey },
    body: formData,
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`${provider} failed (${response.status}): ${detail.slice(0, 120)}`);
  }

  return response.arrayBuffer();
}

async function tryNativeBackgroundRemoval(imageUri: string): Promise<string | null> {
  if (Platform.OS === 'web') return null;

  try {
    const native = await import('@six33/react-native-bg-removal');
    const supported = await native.isNativeBackgroundRemovalSupported();
    if (!supported) return null;
    return await native.removeBackground(imageUri);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes('REQUIRES_API_FALLBACK')) return null;
    return null;
  }
}

async function tryApiBackgroundRemoval(imageUri: string): Promise<ArrayBuffer | null> {
  const removeBgKey = process.env.EXPO_PUBLIC_REMOVE_BG_API_KEY;
  if (removeBgKey) {
    try {
      return await fetchRemovedPngBytes(imageUri, removeBgKey, 'removebg');
    } catch {
      // try next provider
    }
  }

  const clipdropKey = process.env.EXPO_PUBLIC_CLIPDROP_API_KEY;
  if (clipdropKey) {
    try {
      return await fetchRemovedPngBytes(imageUri, clipdropKey, 'clipdrop');
    } catch {
      // try proxy
    }
  }

  const proxyBase = process.env.EXPO_PUBLIC_STYLOVE_IMAGE_API?.replace(/\/$/, '');
  if (proxyBase) {
    const formData = new FormData();
    formData.append('image', { uri: imageUri, name: 'piece.jpg', type: mimeFromUri(imageUri) } as unknown as Blob);
    const response = await fetch(`${proxyBase}/remove-background`, { method: 'POST', body: formData });
    if (response.ok) return response.arrayBuffer();
  }

  return null;
}

/**
 * Removes the background from a wardrobe photo.
 * Returns PNG bytes when successful, or null to keep the original photo.
 */
export async function removeClothingBackground(imageUri: string): Promise<ArrayBuffer | string | null> {
  const nativeUri = await tryNativeBackgroundRemoval(imageUri);
  if (nativeUri) return nativeUri;

  const apiBytes = await tryApiBackgroundRemoval(imageUri);
  if (apiBytes) return apiBytes;

  return null;
}
