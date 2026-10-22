import { useCallback, useEffect, useRef, useState } from 'react';
import type { CropperCanvas, CropperImage, CropperSelection, CropperShade } from 'cropperjs';
import { useTranslation } from 'react-i18next';
import 'cropperjs';
import type { OutputFormat } from './presets';

export type CropResult = {
  url: string;
  width: number;
  height: number;
};

type CropWorkspaceProps = {
  imageSrc: string;
  aspectRatio: number | undefined;
  rotation: number;
  onRotationChange: (rotation: number) => void;
  outputSize: string;
  outputFormat: OutputFormat;
  onCropResultChange: (result: CropResult | null) => void;
};

const ZOOM_MIN = 1;
const ZOOM_MAX = 3;
const HANDLE_COLOR = '#1d4f3e';
const OUTLINE_COLOR = '#f6f3ec';
const RESIZE_ACTIONS = [
  'n-resize',
  'e-resize',
  's-resize',
  'w-resize',
  'ne-resize',
  'nw-resize',
  'se-resize',
  'sw-resize',
] as const;

function targetSize(outputSize: string): { width: number; height: number } | undefined {
  if (outputSize === 'original') return undefined;
  const [widthText, heightText] = outputSize.split('x');
  const width = Number(widthText);
  const height = Number(heightText);
  if (!Number.isFinite(width) || !Number.isFinite(height)) return undefined;
  return { width, height };
}

function matrixScale(matrix: number[]): number {
  const [a = 0, b = 0] = matrix;
  return Math.hypot(a, b);
}

function matrixRotation(matrix: number[]): number {
  const [a = 1, b = 0] = matrix;
  const degrees = (Math.atan2(b, a) * 180) / Math.PI;
  return (degrees % 360 + 360) % 360;
}

function aspectValue(aspectRatio: number | undefined): number {
  return aspectRatio && aspectRatio > 0 ? aspectRatio : 0;
}

export function CropWorkspace({
  imageSrc,
  aspectRatio,
  rotation,
  onRotationChange,
  outputSize,
  outputFormat,
  onCropResultChange,
}: CropWorkspaceProps) {
  const { t } = useTranslation('ic');
  const canvasRef = useRef<CropperCanvas>(null);
  const imageRef = useRef<CropperImage>(null);
  const selectionRef = useRef<CropperSelection>(null);
  const shadeRef = useRef<CropperShade>(null);
  const debounceRef = useRef<number | null>(null);
  const requestRef = useRef(0);
  const baseScaleRef = useRef(0);
  const appliedRotationRef = useRef(0);
  const readyRef = useRef(false);
  const aspectRef = useRef(aspectRatio);
  const rotationRef = useRef(rotation);
  const zoomRef = useRef(ZOOM_MIN);
  const publishRef = useRef<() => void>(() => {});
  const onRotationChangeRef = useRef(onRotationChange);
  const [zoom, setZoom] = useState(ZOOM_MIN);

  const publish = useCallback(() => {
    const selection = selectionRef.current;
    const image = imageRef.current;
    const request = ++requestRef.current;
    if (!selection || !image || selection.width <= 0 || selection.height <= 0) return;

    const size = targetSize(outputSize);
    const scale = matrixScale(image.$getTransform());
    const natural = scale > 0
      ? {
          width: Math.max(1, Math.round(selection.width / scale)),
          height: Math.max(1, Math.round(selection.height / scale)),
        }
      : undefined;
    const output = size ?? natural;

    void selection.$toCanvas(output).then((canvas) => {
      if (request !== requestRef.current) return;

      let drawn = canvas;
      if (size && (canvas.width !== size.width || canvas.height !== size.height)) {
        const fixed = document.createElement('canvas');
        fixed.width = size.width;
        fixed.height = size.height;
        const context = fixed.getContext('2d');
        if (context) {
          context.imageSmoothingEnabled = true;
          context.imageSmoothingQuality = 'high';
          context.drawImage(canvas, 0, 0, size.width, size.height);
          drawn = fixed;
        }
      }

      const url = outputFormat === 'image/png'
        ? drawn.toDataURL(outputFormat)
        : drawn.toDataURL(outputFormat, 0.95);
      onCropResultChange({ url, width: drawn.width, height: drawn.height });
    }).catch(() => {
      if (request === requestRef.current) onCropResultChange(null);
    });
  }, [onCropResultChange, outputFormat, outputSize]);

  const publishNow = useCallback(() => {
    if (debounceRef.current !== null) {
      window.clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    publish();
  }, [publish]);

  useEffect(() => {
    aspectRef.current = aspectRatio;
    rotationRef.current = rotation;
    zoomRef.current = zoom;
    onRotationChangeRef.current = onRotationChange;
    publishRef.current = publishNow;
  });

  function applyAspect() {
    const selection = selectionRef.current;
    if (!selection) return;
    selection.aspectRatio = aspectValue(aspectRef.current);
  }

  function applyRotation() {
    const image = imageRef.current;
    if (!image) return;
    const delta = rotationRef.current - appliedRotationRef.current;
    appliedRotationRef.current = rotationRef.current;
    if (Math.abs(delta) < 0.05) return;
    image.$rotate(`${delta}deg`);
  }

  function applyZoom(next: number) {
    const image = imageRef.current;
    const base = baseScaleRef.current;
    if (!image || base <= 0) {
      setZoom(next);
      return;
    }
    const current = matrixScale(image.$getTransform());
    const factor = current > 0 ? (base * next) / current - 1 : 0;
    if (Math.abs(factor) > 0.001) image.$zoom(factor);
    const measured = matrixScale(image.$getTransform()) / base;
    const clamped = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, measured));
    setZoom(clamped);
  }

  useEffect(() => {
    const shade = shadeRef.current;
    if (shade && shade.width === 0 && shade.height === 0) shade.hidden = true;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (!canvas || !image) return;

    const queuePublish = () => {
      if (debounceRef.current !== null) return;
      debounceRef.current = window.setTimeout(() => {
        debounceRef.current = null;
        publishRef.current();
      }, 80);
    };

    const onTransform = (event: Event) => {
      const detail = (event as CustomEvent<{ matrix?: number[] }>).detail;
      const matrix = detail?.matrix;
      const base = baseScaleRef.current;
      if (!matrix || base <= 0) return;
      const ratio = matrixScale(matrix) / base;
      if (ratio < ZOOM_MIN - 0.001 || ratio > ZOOM_MAX + 0.001) {
        event.preventDefault();
        return;
      }
      setZoom((current) => (Math.abs(current - ratio) < 0.01 ? current : ratio));
      const nextRotation = matrixRotation(matrix);
      const gap = Math.abs(nextRotation - appliedRotationRef.current);
      const wrapped = Math.min(gap, 360 - gap);
      if (wrapped > 0.5) {
        appliedRotationRef.current = nextRotation;
        onRotationChangeRef.current(nextRotation);
      }
    };

    const onActionEnd = () => publishRef.current();
    canvas.addEventListener('transform', onTransform);
    canvas.addEventListener('change', queuePublish);
    canvas.addEventListener('actionend', onActionEnd);

    let cancelled = false;
    void image.$ready().then(() => {
      if (cancelled) return;
      const settled = matrixScale(image.$getTransform());
      baseScaleRef.current = settled > 0 ? settled : 1;
      readyRef.current = true;
      applyAspect();
      applyRotation();
      if (Math.abs(zoomRef.current - ZOOM_MIN) > 0.001) applyZoom(zoomRef.current);
      publishRef.current();
    }).catch(() => {
      if (!cancelled) onCropResultChange(null);
    });

    return () => {
      cancelled = true;
      canvas.removeEventListener('transform', onTransform);
      canvas.removeEventListener('change', queuePublish);
      canvas.removeEventListener('actionend', onActionEnd);
      if (debounceRef.current !== null) {
        window.clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
    };
    // The cropper instance is recreated with the component when the file changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!readyRef.current) return;
    applyAspect();
  }, [aspectRatio]);

  useEffect(() => {
    if (!readyRef.current) return;
    applyRotation();
  }, [rotation]);

  useEffect(() => {
    if (!readyRef.current) return;
    publishNow();
  }, [outputFormat, outputSize, publishNow]);

  const lockedAspect = aspectValue(aspectRatio);

  return (
    <div className="grid gap-4">
      <div className="relative h-[28rem] overflow-hidden rounded-lg bg-ink lg:h-[34rem]">
        <cropper-canvas
          ref={canvasRef}
          className="h-full w-full"
          scaleStep={0.1}
          themeColor={HANDLE_COLOR}
        >
          <cropper-image
            ref={imageRef}
            src={imageSrc}
            alt=""
            // Zoom stays within 1x–3x of this fit. minFit would also reject a 90° turn.
            initialFit="contain"
            rotatable
            scalable
            skewable
            translatable
          />
          <cropper-shade ref={shadeRef} />
          <cropper-handle action="select" plain />
          <cropper-selection
            ref={selectionRef}
            aspectRatio={lockedAspect}
            initialAspectRatio={lockedAspect}
            initialCoverage={1}
            movable
            outlined
            precise
            resizable
            themeColor={OUTLINE_COLOR}
          >
            <cropper-grid role="grid" bordered covered />
            <cropper-crosshair centered />
            <cropper-handle action="move" themeColor="rgba(255, 255, 255, 0.35)" />
            {RESIZE_ACTIONS.map((action) => (
              <cropper-handle key={action} action={action} themeColor={HANDLE_COLOR} />
            ))}
          </cropper-selection>
        </cropper-canvas>
      </div>
      <label className="grid gap-2 text-sm">
        <span className="font-medium">{t('cropper.zoom')}</span>
        <input
          type="range"
          min={ZOOM_MIN}
          max={ZOOM_MAX}
          step={0.1}
          value={zoom}
          onChange={(event) => applyZoom(Number(event.target.value))}
          className="w-full accent-accent"
        />
      </label>
    </div>
  );
}
