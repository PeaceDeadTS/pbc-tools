import { useCallback, useEffect, useRef, useState } from 'react';
import type { CropperCanvas, CropperImage, CropperSelection, CropperShade } from 'cropperjs';
import { useTranslation } from 'react-i18next';
import 'cropperjs';
import type { OutputFormat } from './presets';

export type CropResult = {
  url: string;
  width: number;
  height: number;
  exportFull: () => Promise<string>;
};

type CropWorkspaceProps = {
  imageSrc: string;
  imageWidth: number;
  imageHeight: number;
  aspectRatio: number | undefined;
  rotation: number;
  onRotationChange: (rotation: number) => void;
  outputSize: string;
  outputFormat: OutputFormat;
  onCropResultChange: (result: CropResult | null) => void;
};

type Box = {
  left: number;
  top: number;
  right: number;
  bottom: number;
};

const ZOOM_MIN = 1;
const ZOOM_MAX = 3;
const PREVIEW_EDGE = 1440;
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

function normalizedAngle(rotation: number): number {
  return ((rotation % 360) + 360) % 360;
}

function frameSize(width: number, height: number, rotation: number): { width: number; height: number } {
  const quarterTurn = Math.round(normalizedAngle(rotation) / 90) % 2 === 1;
  return quarterTurn ? { width: height, height: width } : { width, height };
}

function limitEdge(size: { width: number; height: number }, maxEdge: number): { width: number; height: number } {
  const edge = Math.max(size.width, size.height);
  if (edge <= maxEdge) return size;
  const scale = maxEdge / edge;
  return {
    width: Math.max(1, Math.round(size.width * scale)),
    height: Math.max(1, Math.round(size.height * scale)),
  };
}

function containBox(maxWidth: number, maxHeight: number, aspect: number): { width: number; height: number } {
  let width = maxWidth;
  let height = width / aspect;
  if (height > maxHeight) {
    height = maxHeight;
    width = height * aspect;
  }
  return { width, height };
}

function canvasToUrl(canvas: HTMLCanvasElement, format: OutputFormat): Promise<string> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('encode failed'));
        return;
      }
      resolve(URL.createObjectURL(blob));
    }, format, format === 'image/png' ? undefined : 0.95);
  });
}

function redraw(canvas: HTMLCanvasElement, size: { width: number; height: number }): HTMLCanvasElement {
  const fixed = document.createElement('canvas');
  fixed.width = size.width;
  fixed.height = size.height;
  const context = fixed.getContext('2d');
  if (!context) return canvas;
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  context.drawImage(canvas, 0, 0, size.width, size.height);
  return fixed;
}

export function CropWorkspace({
  imageSrc,
  imageWidth,
  imageHeight,
  aspectRatio,
  rotation,
  onRotationChange,
  outputSize,
  outputFormat,
  onCropResultChange,
}: CropWorkspaceProps) {
  const { t } = useTranslation('ic');
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<CropperCanvas>(null);
  const imageRef = useRef<CropperImage>(null);
  const selectionRef = useRef<CropperSelection>(null);
  const shadeRef = useRef<CropperShade>(null);
  const debounceRef = useRef<number | null>(null);
  const requestRef = useRef(0);
  const baseScaleRef = useRef(0);
  const appliedRotationRef = useRef(0);
  const readyRef = useRef(false);
  const fittingRef = useRef(false);
  const renderingRef = useRef(false);
  const dirtyRef = useRef(false);
  const closedRef = useRef(false);
  const previewUrlRef = useRef<string | null>(null);
  const canvasSizeRef = useRef({ w: 0, h: 0 });
  const rotationAtSizeRef = useRef(0);
  const aspectRef = useRef(aspectRatio);
  const rotationRef = useRef(rotation);
  const zoomRef = useRef(ZOOM_MIN);
  const outputSizeRef = useRef(outputSize);
  const outputFormatRef = useRef(outputFormat);
  const publishRef = useRef<() => void>(() => {});
  const refitRef = useRef<(mode: 'cover' | 'keep') => void>(() => {});
  const onRotationChangeRef = useRef(onRotationChange);
  const [zoom, setZoom] = useState(ZOOM_MIN);

  aspectRef.current = aspectRatio;
  rotationRef.current = rotation;
  zoomRef.current = zoom;
  outputSizeRef.current = outputSize;
  outputFormatRef.current = outputFormat;
  onRotationChangeRef.current = onRotationChange;

  const selectionNaturalSize = useCallback((): { width: number; height: number } | undefined => {
    const selection = selectionRef.current;
    const image = imageRef.current;
    if (!selection || !image || selection.width <= 0 || selection.height <= 0) return undefined;
    const scale = matrixScale(image.$getTransform());
    if (scale <= 0) return undefined;
    return {
      width: Math.max(1, Math.round(selection.width / scale)),
      height: Math.max(1, Math.round(selection.height / scale)),
    };
  }, []);

  const outputPixels = useCallback((): { width: number; height: number } | undefined => {
    return targetSize(outputSizeRef.current) ?? selectionNaturalSize();
  }, [selectionNaturalSize]);

  const exportFull = useCallback(async (): Promise<string> => {
    const selection = selectionRef.current;
    const full = outputPixels();
    if (!selection || !full) throw new Error('empty selection');
    let drawn = await selection.$toCanvas(full);
    const size = targetSize(outputSizeRef.current);
    if (size && (drawn.width !== size.width || drawn.height !== size.height)) {
      drawn = redraw(drawn, size);
    }
    return canvasToUrl(drawn, outputFormatRef.current);
  }, [outputPixels]);

  const publish = useCallback(() => {
    if (closedRef.current) return;
    if (renderingRef.current) {
      dirtyRef.current = true;
      return;
    }
    const selection = selectionRef.current;
    const full = outputPixels();
    if (!selection || !full) return;
    const request = ++requestRef.current;
    const preview = limitEdge(full, PREVIEW_EDGE);

    const finish = () => {
      renderingRef.current = false;
      if (closedRef.current) return;
      if (dirtyRef.current) {
        dirtyRef.current = false;
        publishRef.current();
      }
    };

    renderingRef.current = true;

    void selection.$toCanvas(preview).then(async (canvas) => {
      if (closedRef.current || request !== requestRef.current) return;
      const url = await canvasToUrl(canvas, outputFormatRef.current);
      if (closedRef.current || request !== requestRef.current) {
        URL.revokeObjectURL(url);
        return;
      }
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = url;
      onCropResultChange({
        url,
        width: full.width,
        height: full.height,
        exportFull,
      });
    }).catch(() => {
      if (request === requestRef.current) onCropResultChange(null);
    }).finally(finish);
  }, [exportFull, onCropResultChange, outputPixels]);

  const publishNow = useCallback(() => {
    if (debounceRef.current !== null) {
      window.clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    publish();
  }, [publish]);

  publishRef.current = publishNow;

  function allowedBox(): Box | null {
    const image = imageRef.current;
    const canvas = canvasRef.current;
    if (!image || !canvas) return null;
    const imageRect = image.getBoundingClientRect();
    const canvasRect = canvas.getBoundingClientRect();
    if (canvasRect.width <= 0 || canvasRect.height <= 0) return null;
    const top = Math.max(0, Math.ceil(imageRect.top - canvasRect.top - 0.01));
    const left = Math.max(0, Math.ceil(imageRect.left - canvasRect.left - 0.01));
    const rightGap = Math.max(0, Math.ceil(canvasRect.right - imageRect.right - 0.01));
    const bottomGap = Math.max(0, Math.ceil(canvasRect.bottom - imageRect.bottom - 0.01));
    const right = canvasRect.width - rightGap;
    const bottom = canvasRect.height - bottomGap;
    if (right - left < 1 || bottom - top < 1) return null;
    return { left, top, right, bottom };
  }

  function syncSelectionInset() {
    const selection = selectionRef.current;
    const box = allowedBox();
    const canvas = canvasRef.current;
    if (!selection || !box || !canvas) return;
    const canvasRect = canvas.getBoundingClientRect();
    const top = box.top;
    const left = box.left;
    const right = Math.max(0, canvasRect.width - box.right);
    const bottom = Math.max(0, canvasRect.height - box.bottom);
    selection.minInset = `${top}px ${right}px ${bottom}px ${left}px`;
  }

  function clampSelection() {
    const selection = selectionRef.current;
    const box = allowedBox();
    if (!selection || !box || selection.width <= 0 || selection.height <= 0) return;
    const maxWidth = box.right - box.left;
    const maxHeight = box.bottom - box.top;
    let { x, y, width, height } = selection;
    const aspect = aspectValue(aspectRef.current);
    if (width > maxWidth || height > maxHeight) {
      if (aspect > 0) {
        const fitted = containBox(maxWidth, maxHeight, aspect);
        width = fitted.width;
        height = fitted.height;
      } else {
        width = Math.min(width, maxWidth);
        height = Math.min(height, maxHeight);
      }
    }
    x = Math.min(Math.max(box.left, x), box.right - width);
    y = Math.min(Math.max(box.top, y), box.bottom - height);
    if (
      Math.abs(x - selection.x) < 0.5
      && Math.abs(y - selection.y) < 0.5
      && Math.abs(width - selection.width) < 0.5
      && Math.abs(height - selection.height) < 0.5
    ) {
      return;
    }
    selection.$change(x, y, width, height);
  }

  function fitSelectionToImage() {
    const selection = selectionRef.current;
    const box = allowedBox();
    if (!selection || !box) return;
    syncSelectionInset();
    const maxWidth = box.right - box.left;
    const maxHeight = box.bottom - box.top;
    const aspect = aspectValue(aspectRef.current);
    const fitted = aspect > 0 ? containBox(maxWidth, maxHeight, aspect) : { width: maxWidth, height: maxHeight };
    const x = box.left + (maxWidth - fitted.width) / 2;
    const y = box.top + (maxHeight - fitted.height) / 2;
    selection.$change(x, y, fitted.width, fitted.height, aspect > 0 ? aspect : undefined);
  }

  function refitToStage(mode: 'cover' | 'keep') {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    const selection = selectionRef.current;
    if (!canvas || !image || !selection || !readyRef.current) return;
    const prev = canvasSizeRef.current;
    const rel = prev.w > 0 && prev.h > 0
      ? {
          x: selection.x / prev.w,
          y: selection.y / prev.h,
          w: selection.width / prev.w,
          h: selection.height / prev.h,
        }
      : null;

    fittingRef.current = true;
    try {
      image.$resetTransform();
      const angle = normalizedAngle(rotationRef.current);
      if (angle > 0.05) image.$rotate(`${angle}deg`);
      image.$center('contain');
      const settled = matrixScale(image.$getTransform());
      baseScaleRef.current = settled > 0 ? settled : 1;
      appliedRotationRef.current = matrixRotation(image.$getTransform());
      const nextZoom = mode === 'cover' ? ZOOM_MIN : zoomRef.current;
      if (Math.abs(nextZoom - ZOOM_MIN) > 0.001) image.$zoom(nextZoom - 1);
      zoomRef.current = nextZoom;
      setZoom(nextZoom);
    } finally {
      fittingRef.current = false;
    }

    const rect = canvas.getBoundingClientRect();
    canvasSizeRef.current = { w: rect.width, h: rect.height };
    syncSelectionInset();
    if (mode === 'cover' || !rel) {
      fitSelectionToImage();
    } else {
      selection.$change(rel.x * rect.width, rel.y * rect.height, rel.w * rect.width, rel.h * rect.height);
      clampSelection();
    }
    publishRef.current();
  }

  refitRef.current = refitToStage;

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
    syncSelectionInset();
    clampSelection();
  }

  useEffect(() => {
    const shade = shadeRef.current;
    if (shade && shade.width === 0 && shade.height === 0) shade.hidden = true;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    const stage = stageRef.current;
    if (!canvas || !image || !stage) return;
    const selection = selectionRef.current;
    if (selection) selection.minInset = '0';

    const queuePublish = () => {
      if (debounceRef.current !== null) return;
      debounceRef.current = window.setTimeout(() => {
        debounceRef.current = null;
        publishRef.current();
      }, 80);
    };

    const onTransform = (event: Event) => {
      if (fittingRef.current) return;
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
      syncSelectionInset();
    };

    const onActionStart = () => syncSelectionInset();
    const onActionEnd = () => {
      clampSelection();
      publishRef.current();
    };
    canvas.addEventListener('transform', onTransform);
    canvas.addEventListener('change', queuePublish);
    canvas.addEventListener('actionstart', onActionStart);
    canvas.addEventListener('actionend', onActionEnd);

    const observer = new ResizeObserver(() => {
      if (!readyRef.current) return;
      if (normalizedAngle(rotationRef.current) !== normalizedAngle(rotationAtSizeRef.current)) return;
      const rect = canvas.getBoundingClientRect();
      const prev = canvasSizeRef.current;
      if (Math.abs(rect.width - prev.w) < 0.5 && Math.abs(rect.height - prev.h) < 0.5) return;
      refitRef.current('keep');
    });
    observer.observe(stage);

    let cancelled = false;
    void image.$ready().then(() => {
      if (cancelled) return;
      const settled = matrixScale(image.$getTransform());
      baseScaleRef.current = settled > 0 ? settled : 1;
      appliedRotationRef.current = matrixRotation(image.$getTransform());
      const rect = canvas.getBoundingClientRect();
      canvasSizeRef.current = { w: rect.width, h: rect.height };
      rotationAtSizeRef.current = rotationRef.current;
      readyRef.current = true;
      syncSelectionInset();
      clampSelection();
      if (Math.abs(zoomRef.current - ZOOM_MIN) > 0.001) applyZoom(zoomRef.current);
      publishRef.current();
    }).catch(() => {
      if (!cancelled) onCropResultChange(null);
    });

    return () => {
      cancelled = true;
      closedRef.current = true;
      readyRef.current = false;
      observer.disconnect();
      canvas.removeEventListener('transform', onTransform);
      canvas.removeEventListener('change', queuePublish);
      canvas.removeEventListener('actionstart', onActionStart);
      canvas.removeEventListener('actionend', onActionEnd);
      if (debounceRef.current !== null) {
        window.clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = null;
      }
    };
    // The cropper instance is recreated with the component when the file changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!readyRef.current) return;
    const selection = selectionRef.current;
    if (!selection) return;
    const next = aspectValue(aspectRatio);
    selection.aspectRatio = next;
    const timer = window.setTimeout(() => fitSelectionToImage(), 0);
    return () => window.clearTimeout(timer);
    // fitSelectionToImage reads the latest cropper nodes through refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aspectRatio]);

  useEffect(() => {
    if (!readyRef.current) return;
    if (normalizedAngle(rotation) === normalizedAngle(rotationAtSizeRef.current)) return;
    rotationAtSizeRef.current = rotation;
    refitRef.current('cover');
  }, [rotation]);

  useEffect(() => {
    if (!readyRef.current) return;
    publishNow();
  }, [outputFormat, outputSize, publishNow]);

  const lockedAspect = aspectValue(aspectRatio);
  const frame = frameSize(Math.max(imageWidth, 1), Math.max(imageHeight, 1), rotation);

  return (
    <div className="grid gap-4">
      <div
        ref={stageRef}
        className="mx-auto overflow-hidden rounded-lg bg-ink [--stage-max:28rem] lg:[--stage-max:34rem]"
        style={{
          aspectRatio: `${frame.width} / ${frame.height}`,
          width: `min(100%, calc(var(--stage-max) * ${frame.width} / ${frame.height}))`,
        }}
      >
        <cropper-canvas
          ref={canvasRef}
          className="block h-full w-full"
          style={{ minWidth: 0, minHeight: 0 }}
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
