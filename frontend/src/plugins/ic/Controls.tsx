import { useTranslation } from 'react-i18next';
import { IconRotate } from '@/shared/icons';
import { Button, Panel, SelectInput } from '@/shared/ui';
import { ASPECT_RATIOS, OUTPUT_SIZES, PBC_RATIO } from './presets';

type ControlsProps = {
  aspectRatio: number;
  onAspectRatioChange: (ratio: number) => void;
  rotation: number;
  onRotationChange: (rotation: number) => void;
  outputSize: string;
  onOutputSizeChange: (size: string) => void;
  originalImageHeight: number | null;
};

export function Controls({
  aspectRatio,
  onAspectRatioChange,
  rotation,
  onRotationChange,
  outputSize,
  onOutputSizeChange,
  originalImageHeight,
}: ControlsProps) {
  const { t } = useTranslation('ic');
  const pbc = aspectRatio === PBC_RATIO;

  return (
    <Panel title={t('settings.title')}>
      <div className="grid gap-4">
        <label className="grid gap-1.5 text-sm">
          <span className="font-medium">{t('cropper.aspectRatio')}</span>
          <SelectInput
            value={String(aspectRatio)}
            onChange={(value) => {
              const next = ASPECT_RATIOS.find((item) => String(item.value) === value);
              if (next) onAspectRatioChange(next.value);
            }}
          >
            {ASPECT_RATIOS.map((ratio) => (
              <option key={ratio.labelKey} value={String(ratio.value)}>
                {t(ratio.labelKey)}
              </option>
            ))}
          </SelectInput>
        </label>

        <label className="grid gap-1.5 text-sm">
          <span className="font-medium">{t('size.title')}</span>
          <SelectInput value={outputSize} disabled={!pbc} onChange={onOutputSizeChange}>
            {OUTPUT_SIZES.map((size) => {
              if (size.value === 'original') {
                return (
                  <option key={size.value} value={size.value}>
                    {t(size.labelKey)}
                  </option>
                );
              }
              const height = Number(size.value.split('x')[1]);
              const tooTall = originalImageHeight !== null && height > originalImageHeight;
              return (
                <option key={size.value} value={size.value} disabled={!pbc || tooTall}>
                  {tooTall ? `${t(size.labelKey)} ${t('size.unavailable')}` : t(size.labelKey)}
                </option>
              );
            })}
          </SelectInput>
        </label>

        <div className="grid gap-1.5 text-sm">
          <span className="font-medium">{t('cropper.rotate')}</span>
          <Button tone="ghost" onClick={() => onRotationChange((rotation + 90) % 360)}>
            <IconRotate />
            {Math.round(rotation) % 360}°
          </Button>
        </div>
      </div>
    </Panel>
  );
}
