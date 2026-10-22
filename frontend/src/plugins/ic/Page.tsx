import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IconDownload } from '@/shared/icons';
import { useStatus } from '@/shared/status';
import { Button, Panel, TextInput } from '@/shared/ui';
import { Controls } from './Controls';
import { CropWorkspace, type CropResult } from './CropWorkspace';
import { isAcceptedImage, OUTPUT_EXTENSION, PBC_RATIO, readImageFile } from './presets';
import { Uploader } from './Uploader';

export function Page() {
  const { t } = useTranslation('ic');
  const { status, flash } = useStatus();
  const [token, setToken] = useState(0);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [cropped, setCropped] = useState<CropResult | null>(null);
  const [aspectRatio, setAspectRatio] = useState(PBC_RATIO);
  const [rotation, setRotation] = useState(0);
  const [outputSize, setOutputSize] = useState('original');
  const [filename, setFilename] = useState('Cropped');
  const [originalSize, setOriginalSize] = useState<{ width: number; height: number } | null>(null);
  const imageUrlRef = useRef<string | null>(null);

  useEffect(() => () => {
    if (imageUrlRef.current) URL.revokeObjectURL(imageUrlRef.current);
  }, []);

  const onFile = useCallback(async (file: File) => {
    if (!isAcceptedImage(file)) return;
    try {
      const image = await readImageFile(file);
      if (imageUrlRef.current) URL.revokeObjectURL(imageUrlRef.current);
      imageUrlRef.current = image.src;
      setImageSrc(image.src);
      setOriginalSize({ width: image.width, height: image.height });
      setCropped(null);
      setToken((value) => value + 1);
      flash(t('messages.uploadSuccess'));
    } catch {
      flash(t('messages.error'));
    }
  }, [flash, t]);

  function changeAspect(next: number) {
    setAspectRatio(next);
    if (next !== PBC_RATIO) setOutputSize('original');
  }

  function reset() {
    if (imageUrlRef.current) URL.revokeObjectURL(imageUrlRef.current);
    imageUrlRef.current = null;
    setImageSrc(null);
    setCropped(null);
    setAspectRatio(PBC_RATIO);
    setRotation(0);
    setOutputSize('original');
    setFilename('Cropped');
    setOriginalSize(null);
  }

  async function save() {
    if (!cropped) {
      flash(t('messages.selectImage'));
      return;
    }
    try {
      const href = await cropped.exportFull();
      const link = document.createElement('a');
      link.download = `${filename}${OUTPUT_EXTENSION}`;
      link.href = href;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(href), 2000);
      flash(t('messages.saveSuccess'));
    } catch {
      flash(t('messages.error'));
    }
  }

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted">{t('app.subtitle')}</p>
        <div className="flex items-center gap-3">
          {status ? <span className="text-sm text-muted">{status}</span> : null}
          {imageSrc ? (
            <Button tone="ghost" onClick={reset}>
              {t('actions.reset')}
            </Button>
          ) : null}
        </div>
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <Panel title={t('cropper.original')}>
            {imageSrc ? (
              <CropWorkspace
                key={token}
                imageSrc={imageSrc}
                imageWidth={originalSize?.width ?? 0}
                imageHeight={originalSize?.height ?? 0}
                aspectRatio={aspectRatio === 0 ? undefined : aspectRatio}
                rotation={rotation}
                onRotationChange={setRotation}
                outputSize={outputSize}
                onCropResultChange={setCropped}
              />
            ) : (
              <Uploader onFile={(file) => void onFile(file)} />
            )}
          </Panel>
        </div>

        <div className="grid gap-4 lg:col-span-2">
          <Panel title={t('cropper.preview')}>
            {cropped ? (
              <img
                src={cropped.url}
                alt={t('cropper.preview')}
                className="mx-auto max-h-[34rem] max-w-full rounded-lg object-contain"
              />
            ) : (
              <p className="py-16 text-center text-sm text-muted">{t('messages.selectImage')}</p>
            )}
            {cropped ? (
              <p className="mt-3 text-right text-xs text-muted">
                {t('size.current')}: {cropped.width} x {cropped.height} {t('size.pixels')}
              </p>
            ) : null}
          </Panel>
          {imageSrc ? (
            <div className="grid gap-2">
              <label className="grid gap-1.5 text-sm">
                <span className="font-medium">{t('actions.filename')}</span>
                <div className="flex items-center gap-2">
                  <TextInput id="filename" value={filename} onChange={setFilename} />
                  <span className="text-sm text-muted">{OUTPUT_EXTENSION}</span>
                </div>
              </label>
              <Button onClick={() => void save()}>
                <IconDownload />
                {t('actions.save')}
              </Button>
            </div>
          ) : null}
        </div>

        <div className="lg:col-span-1">
          <Controls
            aspectRatio={aspectRatio}
            onAspectRatioChange={changeAspect}
            rotation={rotation}
            onRotationChange={setRotation}
            outputSize={outputSize}
            onOutputSizeChange={setOutputSize}
            originalImageHeight={originalSize?.height ?? null}
          />
        </div>
      </div>
    </div>
  );
}
