export class EmptyReadyWardrobeError extends Error {
  constructor() {
    super('EMPTY_READY_WARDROBE');
    this.name = 'EmptyReadyWardrobeError';
  }
}

export function isEmptyReadyWardrobeError(error: unknown): error is EmptyReadyWardrobeError {
  return error instanceof EmptyReadyWardrobeError;
}
