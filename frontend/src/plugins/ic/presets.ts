export const PBC_RATIO = 2 / 3;

export const ASPECT_RATIOS = [
  { value: PBC_RATIO, labelKey: 'cropper.pbcStandard' },
  { value: 0, labelKey: 'cropper.freeform' },
  { value: 16 / 9, labelKey: 'cropper.preset16-9' },
  { value: 4 / 3, labelKey: 'cropper.preset4-3' },
  { value: 1, labelKey: 'cropper.preset1-1' },
] as const;

export const OUTPUT_SIZES = [
  { value: 'original', labelKey: 'size.original' },
  { value: '533x800', labelKey: 'size.533x800' },
  { value: '600x900', labelKey: 'size.600x900' },
  { value: '667x1000', labelKey: 'size.667x1000' },
  { value: '800x1200', labelKey: 'size.800x1200' },
  { value: '1000x1500', labelKey: 'size.1000x1500' },
  { value: '1200x1800', labelKey: 'size.1200x1800' },
  { value: '1280x1920', labelKey: 'size.1280x1920' },
  { value: '1333x2000', labelKey: 'size.1333x2000' },
  { value: '1400x2100', labelKey: 'size.1400x2100' },
  { value: '1600x2400', labelKey: 'size.1600x2400' },
] as const;

export type OutputFormat = 'image/jpeg' | 'image/png' | 'image/webp';

const ACCEPTED = new Set<string>(['image/jpeg', 'image/png', 'image/webp']);

export function isAcceptedImage(file: File): boolean {
  return ACCEPTED.has(file.type);
}

export function formatForFile(file: File): { format: OutputFormat; extension: string } {
  if (file.type === 'image/png') return { format: 'image/png', extension: '.png' };
  if (file.type === 'image/webp') return { format: 'image/webp', extension: '.webp' };
  return { format: 'image/jpeg', extension: '.jpg' };
}

export function readImageFile(file: File): Promise<{ src: string; width: number; height: number }> {
  const src = URL.createObjectURL(file);
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve({ src, width: image.width, height: image.height });
    image.onerror = () => {
      URL.revokeObjectURL(src);
      reject(new Error('decode failed'));
    };
    image.src = src;
  });
}
