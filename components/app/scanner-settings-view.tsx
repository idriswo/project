"use client";

import { useTranslations } from "next-intl";
import { useRef, useState, useSyncExternalStore } from "react";

import { Button } from "@/components/ui/button";
import { Field, TextInput } from "@/components/ui/field";
import { DataCard, Eyebrow, PageHead } from "@/components/ui/stat";
import { StatusPill } from "@/components/ui/status";
import { Toggle } from "@/components/ui/toggle";
import { cn } from "@/lib/cn";
import {
  readScannerConfig,
  type ScannerConfig,
  writeScannerConfig,
} from "@/lib/labels";

/**
 * Настройка сканера (Э-04).
 *
 * Бекенд тут не участвует: сканер — это клавиатура, воткнутая в
 * конкретный компьютер, и настройки принадлежат рабочему месту, а не
 * магазину. Поэтому всё лежит в `localStorage`.
 *
 * Главное на экране — зона тестирования. Вопрос «работает ли сканер»
 * решается не галочками, а тем, что человек направляет его на коробку
 * и видит, что считалось.
 */
/** Пустая подписка: состояние «смонтированы ли мы» не меняется никогда. */
const noopSubscribe = () => () => {};

export function ScannerSettingsView() {
  /**
   * Настройки лежат в `localStorage`, которого на сервере нет, а страница
   * статическая. Поэтому сначала узнаём, что мы уже в браузере, и только
   * потом читаем — иначе разметка сервера и клиента разъедутся.
   */
  const mounted = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );

  if (!mounted) return null;

  return <ScannerForm initial={readScannerConfig()} />;
}

function ScannerForm({ initial }: { initial: ScannerConfig }) {
  const t = useTranslations("app.scanner");
  const [config, setConfig] = useState<ScannerConfig>(initial);
  const [saved, setSaved] = useState(false);

  function patch(next: Partial<ScannerConfig>) {
    setConfig((prev) => ({ ...prev, ...next }));
    setSaved(false);
  }

  function handleSave() {
    writeScannerConfig(config);
    setSaved(true);
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHead eyebrow={t("eyebrow")} title={t("title")}>
        <Button type="button" onClick={handleSave}>
          {t("save")}
        </Button>
      </PageHead>

      {saved ? (
        <p role="status" className="text-[13.5px] font-semibold text-app-ok">
          {t("saved")}
        </p>
      ) : null}

      <div className="grid gap-5 desktop:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-5">
          <DataCard className="p-5">
            <Eyebrow>{t("device")}</Eyebrow>
            <p className="mt-3 flex flex-wrap items-center gap-3 text-[17px] font-extrabold text-app-ink">
              {t("deviceName")}
              <StatusPill tone="ok">{t("connected")}</StatusPill>
            </p>
            <p className="mt-2 text-[13px] leading-snug text-app-dim">
              {t("deviceHint")}
            </p>
          </DataCard>

          <TestZone config={config} />
        </div>

        <div className="flex flex-col gap-5">
          <DataCard className="flex flex-col gap-4 p-5">
            <h2 className="text-[17px] font-extrabold tracking-[-0.015em] text-app-ink">
              {t("behaviour")}
            </h2>
            <Toggle
              label={t("enterAfterScan")}
              hint={t("enterHint")}
              checked={config.enterAfterScan}
              onChange={(value) => patch({ enterAfterScan: value })}
            />
            <Toggle
              label={t("allowQr")}
              checked={config.allowQr}
              onChange={(value) => patch({ allowQr: value })}
            />
            <Toggle
              label={t("sound")}
              checked={config.sound}
              onChange={(value) => patch({ sound: value })}
            />
          </DataCard>

          <DataCard className="flex flex-col gap-4 p-5">
            <h2 className="text-[17px] font-extrabold tracking-[-0.015em] text-app-ink">
              {t("affixes")}
            </h2>
            <p className="text-[13px] leading-snug text-app-dim">
              {t("affixesHint")}
            </p>
            <div className="grid gap-4 tablet:grid-cols-2">
              <Field label={t("prefix")}>
                {(props) => (
                  <TextInput
                    {...props}
                    className="h-12 font-mono"
                    value={config.prefix}
                    onChange={(event) => patch({ prefix: event.target.value })}
                  />
                )}
              </Field>
              <Field label={t("suffix")}>
                {(props) => (
                  <TextInput
                    {...props}
                    className="h-12 font-mono"
                    value={config.suffix}
                    onChange={(event) => patch({ suffix: event.target.value })}
                  />
                )}
              </Field>
            </div>
          </DataCard>
        </div>
      </div>
    </div>
  );
}

/**
 * Зона тестирования.
 *
 * Сканер печатает символы очень быстро и заканчивает Enter — этим он и
 * отличается от человека за клавиатурой. Ловим последовательность
 * между Enter'ами: так же, как её будет ловить касса.
 */
function TestZone({ config }: { config: ScannerConfig }) {
  const t = useTranslations("app.scanner");
  const [value, setValue] = useState("");
  const [scans, setScans] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter") return;
    event.preventDefault();
    if (!event.currentTarget.value.trim()) return;
    setScans((n) => n + 1);
  }

  const cleaned = stripAffixes(value, config);

  return (
    <div
      onClick={() => inputRef.current?.focus()}
      className={cn(
        "rounded-frame border-[1.5px] border-app-sapphire bg-app-sapphire-soft p-5",
        "cursor-text focus-within:shadow-[0_0_0_4px_rgb(15_82_186/0.10)]",
      )}
    >
      <Eyebrow className="text-app-sapphire">{t("testZone")}</Eyebrow>

      <div className="mt-4 rounded-card border-2 border-dashed border-app-sapphire/35 px-4 py-8 text-center">
        <p className="text-[13.5px] font-semibold text-app-dim">
          {t("testHint")}
        </p>

        <input
          ref={inputRef}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={handleKeyDown}
          aria-label={t("testZone")}
          className="mt-4 h-12 w-full rounded-card bg-white/70 text-center font-mono text-[20px] font-extrabold tracking-[0.02em] text-app-ink num outline-none placeholder:text-app-dim-2"
          placeholder={t("testPlaceholder")}
        />

        {cleaned && cleaned !== value ? (
          <p className="mt-3 text-[12.5px] text-app-dim">
            {t("afterAffixes")}{" "}
            <span className="font-mono font-bold text-app-ink num">
              {cleaned}
            </span>
          </p>
        ) : null}

        <p className="mt-3 text-[12.5px] font-semibold text-app-dim">
          {t("scanCount", { count: scans })}
        </p>
      </div>
    </div>
  );
}

/**
 * Убираем то, что сканер дописывает сам. Настроенный на `#` префикс
 * приходит в поле как часть кода, и без чистки товар не найдётся.
 */
function stripAffixes(raw: string, config: ScannerConfig): string {
  let out = raw;
  if (config.prefix && out.startsWith(config.prefix)) {
    out = out.slice(config.prefix.length);
  }
  // Суффикс `\n` записан двумя символами: это то, что человек видит в
  // настройках сканера, а не настоящий перевод строки.
  const suffix = config.suffix.replace(/\\n/g, "");
  if (suffix && out.endsWith(suffix)) {
    out = out.slice(0, -suffix.length);
  }
  return out.trim();
}
