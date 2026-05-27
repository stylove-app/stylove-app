import type { WardrobeItem, WardrobeProcessingStatus } from '@/lib/outfit-engine';

export function getWardrobeDisplayUri(item: WardrobeItem): string {
  if (item.processingStatus === 'done' && item.cleanedImageUri) {
    return item.cleanedImageUri;
  }
  return item.originalImageUri ?? item.imageUri;
}

export function isWardrobeProcessing(item: WardrobeItem): boolean {
  return item.processingStatus === 'processing' || item.processingStatus === 'pending';
}

export function isWardrobeProcessingFailed(item: WardrobeItem): boolean {
  return item.processingStatus === 'failed';
}

export function isWardrobeCutout(item: WardrobeItem): boolean {
  return item.processingStatus === 'done' && !!item.cleanedImageUri;
}

export function isTerminalProcessingStatus(status: WardrobeProcessingStatus): boolean {
  return status === 'done' || status === 'failed';
}
