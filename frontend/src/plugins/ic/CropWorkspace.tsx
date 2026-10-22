import { useCallback, useEffect, useRef, useState } from 'react';
import Cropper, { type ReactCropperElement } from 'react-cropper';
import type CropperJs from 'cropperjs';
import { useTranslation } from 'react-i18next';
import 'cropperjs/dist/cropper.css';
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
  outputSize: string;
  outputFormat: OutputFormat;
  onCropResultChange: (result: CropResult | null) => void;
};

function targetSize(outputSize: string): { width: number; height: number } | undefined {
  if (outputSize === 'original') return undefined;
  const [widthText, heightText] = outputSize.split('x');
  const width = Number(widthText);
  const height = Number(heightText);
  if (!Number.isFinite(width) || !Number.isFinite(height)) return undefined;
  return { width, height };
}

export function CropWorkspace({
  imageSrc,
  aspectRatio,
  rotation,
  outputSize,
  outputFormat,
  onCropResultChange,
}: CropWorkspaceProps) {
  const { t } = useTranslation('ic');
  const cropperRef = useRef<ReactCropperElement>(null);
  const debounceRef = useRef<number | null>(null);
  const [zoom, setZoom] = useState(1);
  const [baseZoom, setBaseZoom] = useState(1);
  const [ready, setReady] = useState(false);

  const cropper = useCallback((): CropperJs | null => cropperRef.current?.cropper ?? null, []);

  const publish = useCallback(() => {
    const instance = cropper();
    if (!instance) {
      onCropResultChange(null);
      return;
    }

    const size = targetSize(outputSize);
    const canvas = instance.getCroppedCanvas(size);
    if (!canvas) {
      onCropResultChange(null);
      return;
    }

    let output = canvas;
    if (size && (canvas.width !== size.width || canvas.height !== size.height)) {
      const fixed = document.createElement('canvas');
      fixed.width = size.width;
      fixed.height = size.height;
      const context = fixed.getContext('2d');
      if (context) {
        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = 'high';
        context.drawImage(canvas, 0, 0, size.width, size.height);
        output = fixed;
      }
    }

    const url = outputFormat === 'image/png'
      ? output.toDataURL(outputFormat)
      : output.toDataURL(outputFormat, 0.95);

    onCropResultChange({ url, width: output.width, height: output.height });
  }, [cropper, onCropResultChange, outputFormat, outputSize]);

  const queuePublish = useCallback(() => {
    if (debounceRef.current !== null) return;
    debounceRef.current = window.setTimeout(() => {
      debounceRef.current = null;
      publish();
    }, 80);
  }, [publish]);

  const publishNow = useCallback(() => {
    if (debounceRef.current !== null) {
      window.clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    publish();
  }, [publish]);

  useEffect(() => {
    return () => {
      if (debounceRef.current !== null) window.clearTimeout(debounceRef.current);
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    cropper()?.rotateTo(rotation);
  }, [cropper, ready, rotation]);

  useEffect(() => {
    if (!ready) return;
    const instance = cropper();
    if (!instance) return;
    instance.setAspectRatio(aspectRatio && aspectRatio > 0 ? aspectRatio : Number.NaN);
    publish();
  }, [aspectRatio, cropper, publish, ready]);

  useEffect(() => {
    if (!ready) return;
    cropper()?.zoomTo(baseZoom * zoom);
  }, [baseZoom, cropper, ready, zoom]);

  useEffect(() => {
    if (!ready) return;
    publishNow();
  }, [outputSize, publishNow, ready]);

  return (
    <div className="grid gap-4">
      <div className="relative h-[28rem] overflow-hidden rounded-lg bg-ink lg:h-[34rem]">
        <Cropper
          src={imageSrc}
          ref={cropperRef}
          style={{ height: '100%', width: '100%' }}
          aspectRatio={aspectRatio}
          viewMode={1}
          guides
          background={false}
          responsive
          autoCropArea={1}
          checkOrientation={false}
          dragMode="move"
          zoomOnWheel
          ready={() => {
            const instance = cropperRef.current?.cropper;
            if (instance) {
              const container = instance.getContainerData();
              const image = instance.getImageData();
              const initial = image.naturalHeight > 0 ? container.height / image.naturalHeight : 1;
              instance.zoomTo(initial);
              setBaseZoom(initial);
              setZoom(1);
            }
            setReady(true);
          }}
          crop={queuePublish}
          cropend={publishNow}
        />
      </div>
      <label className="grid gap-2 text-sm">
        <span className="font-medium">{t('cropper.zoom')}</span>
        <input
          type="range"
          min={1}
          max={3}
          step={0.1}
          value={zoom}
          onChange={(event) => setZoom(Number(event.target.value))}
          className="w-full accent-accent"
        />
      </label>
    </div>
  );
}
