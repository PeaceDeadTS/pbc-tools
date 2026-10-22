import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IconUpload } from '@/shared/icons';
import { buttonClass } from '@/shared/ui';
import { isAcceptedImage } from './presets';

export function Uploader({ onFile }: { onFile: (file: File) => void }) {
  const { t } = useTranslation('ic');
  const [over, setOver] = useState(false);
  const [rejected, setRejected] = useState(false);

  const take = useCallback((file: File | undefined) => {
    if (!file) return;
    if (!isAcceptedImage(file)) {
      setRejected(true);
      return;
    }
    setRejected(false);
    onFile(file);
  }, [onFile]);

  return (
    <div
      className={over
        ? 'grid min-h-80 place-items-center rounded-lg border-2 border-dashed border-accent p-8 text-center'
        : 'grid min-h-80 place-items-center rounded-lg border-2 border-dashed border-line p-8 text-center'}
      onDragOver={(event) => {
        event.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(event) => {
        event.preventDefault();
        setOver(false);
        take(event.dataTransfer.files[0]);
      }}
    >
      <div className="grid justify-items-center gap-2">
        <IconUpload className="h-10 w-10 text-muted" />
        <h3 className="text-lg font-semibold">{t('upload.title')}</h3>
        <p className="text-sm text-muted">{t('upload.dragDrop')}</p>
        <p className="text-sm text-muted">{t('upload.or')}</p>
        <label className={buttonClass()}>
          {t('upload.browse')}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={(event) => take(event.target.files?.[0])}
          />
        </label>
        <p className="text-xs text-muted">{t('upload.supported')}</p>
        {rejected ? <p className="text-sm text-danger">{t('messages.error')}</p> : null}
      </div>
    </div>
  );
}
