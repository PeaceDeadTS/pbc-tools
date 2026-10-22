import type {
  CropperCanvas,
  CropperCrosshair,
  CropperGrid,
  CropperHandle,
  CropperImage,
  CropperSelection,
  CropperShade,
} from 'cropperjs';

type CropperProps<T extends HTMLElement> = React.DetailedHTMLProps<React.HTMLAttributes<T>, T>;

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'cropper-canvas': CropperProps<CropperCanvas> & {
        background?: boolean;
        disabled?: boolean;
        scaleStep?: number;
        themeColor?: string;
      };
      'cropper-image': CropperProps<CropperImage> & {
        alt?: string;
        src?: string;
        initialFit?: string;
        minFit?: string;
        maxFit?: string;
        rotatable?: boolean;
        scalable?: boolean;
        skewable?: boolean;
        translatable?: boolean;
        zoomAroundCenter?: boolean;
      };
      'cropper-shade': CropperProps<CropperShade>;
      'cropper-handle': CropperProps<CropperHandle> & {
        action?: string;
        plain?: boolean;
        themeColor?: string;
      };
      'cropper-selection': CropperProps<CropperSelection> & {
        aspectRatio?: number;
        initialAspectRatio?: number;
        initialCoverage?: number;
        keyboard?: boolean;
        movable?: boolean;
        outlined?: boolean;
        precise?: boolean;
        resizable?: boolean;
        themeColor?: string;
      };
      'cropper-grid': CropperProps<CropperGrid> & {
        bordered?: boolean;
        covered?: boolean;
        themeColor?: string;
      };
      'cropper-crosshair': CropperProps<CropperCrosshair> & {
        centered?: boolean;
        themeColor?: string;
      };
    }
  }
}
