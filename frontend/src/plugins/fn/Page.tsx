import type { FormEvent } from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ApiError, postJson } from '@/shared/api';
import { useStatus } from '@/shared/status';
import { Button, CodeBlock, Field, NumberInput, SelectInput, TextInput } from '@/shared/ui';

type Mode = 'first' | 'additional';

type FormState = {
  base_name: string;
  start_num: string;
  end_num: string;
  num_length: string;
  tabber_title: string;
  tabber_mode: Mode;
};

const emptyForm: FormState = {
  base_name: '',
  start_num: '',
  end_num: '',
  num_length: '',
  tabber_title: '',
  tabber_mode: 'first',
};

export function Page() {
  const { t } = useTranslation(['fn', 'shell']);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [wikitext, setWikitext] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const { status, flash } = useStatus();

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setWikitext(null);
    setPending(true);
    try {
      const result = await postJson<{ wikitext: string }>('/api/fn/gallery', {
        base_name: form.base_name,
        start_num: Number(form.start_num),
        end_num: Number(form.end_num),
        num_length: Number(form.num_length),
        tabber_title: form.tabber_title,
        tabber_mode: form.tabber_mode,
      });
      setWikitext(result.wikitext);
    } catch (caught) {
      if (caught instanceof ApiError && caught.code !== 'request_failed' && caught.code !== 'invalid_request') {
        setError(t(caught.code, caught.params));
      } else if (caught instanceof ApiError && caught.code === 'invalid_request') {
        setError(t('shell:invalidRequest'));
      } else {
        setError(t('shell:requestFailed'));
      }
    } finally {
      setPending(false);
    }
  }

  async function copy() {
    if (!wikitext) return;
    try {
      await navigator.clipboard.writeText(wikitext);
      flash(t('code_copied'));
    } catch {
      flash(t('copy_failed'));
    }
  }

  return (
    <form className="grid max-w-4xl gap-4" onSubmit={(event) => void onSubmit(event)}>
      <div className="grid gap-4 md:grid-cols-4">
        <div className="md:col-span-2">
          <Field id="base_name" label={t('file_name')} hint={t('base_name_help')}>
            <TextInput id="base_name" required value={form.base_name} onChange={(value) => update('base_name', value)} />
          </Field>
        </div>
        <Field id="start_num" label={t('start_number')} hint={t('start_num_help')}>
          <NumberInput id="start_num" required value={form.start_num} onChange={(value) => update('start_num', value)} />
        </Field>
        <Field id="end_num" label={t('end_number')} hint={t('end_num_help')}>
          <NumberInput id="end_num" required value={form.end_num} onChange={(value) => update('end_num', value)} />
        </Field>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Field id="num_length" label={t('num_length')} hint={t('num_length_help')}>
          <NumberInput id="num_length" required value={form.num_length} onChange={(value) => update('num_length', value)} />
        </Field>
        <div className="md:col-span-2">
          <Field id="tabber_title" label={t('gallery_name')} hint={t('tabber_title_help')}>
            <TextInput id="tabber_title" required value={form.tabber_title} onChange={(value) => update('tabber_title', value)} />
          </Field>
        </div>
        <Field id="tabber_mode" label={t('gallery_mode')} hint={t('tabber_mode_help')}>
          <SelectInput id="tabber_mode" value={form.tabber_mode} onChange={(value) => update('tabber_mode', value as Mode)}>
            <option value="first">{t('first_gallery')}</option>
            <option value="additional">{t('additional_gallery')}</option>
          </SelectInput>
        </Field>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={pending}>
          {t('generate')}
        </Button>
        <Button
          tone="ghost"
          onClick={() => {
            setForm(emptyForm);
            setWikitext(null);
            setError(null);
          }}
        >
          {t('clear_fields')}
        </Button>
      </div>

      {error ? (
        <p role="alert" className="rounded-lg border border-danger/30 bg-danger-bg px-3 py-2 text-sm text-danger">
          {error}
        </p>
      ) : null}

      {wikitext ? (
        <div className="grid gap-2">
          <h2 className="text-sm font-semibold">{t('generated_code')}</h2>
          <CodeBlock code={wikitext} />
          <div className="flex items-center gap-3">
            <Button tone="ghost" onClick={() => void copy()}>
              {t('copy_code')}
            </Button>
            {status ? <span className="text-sm text-muted">{status}</span> : null}
          </div>
        </div>
      ) : null}
    </form>
  );
}
