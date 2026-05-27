import type { ImagePickerOptions } from 'expo-image-picker';

/** Shared wardrobe upload options — full photo, no forced crop. */
export const WARDROBE_IMAGE_PICKER_OPTIONS: ImagePickerOptions = {
  mediaTypes: ['images'],
  quality: 0.9,
  allowsEditing: false,
};
