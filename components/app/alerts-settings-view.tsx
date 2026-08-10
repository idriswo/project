"use client";

import { Lightbulb } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { MockNotice } from "@/components/ui/mock-notice";
import { ListSkeleton } from "@/components/ui/skeleton";
import { PageHead } from "@/components/ui/stat";
import { DataTable, Td, Th } from "@/components/ui/table";
import { Toggle } from "@/components/ui/toggle";
import {
  type AlertSettings,
  fetchAlertSettings,
  saveAlertSettings,
} from "@/lib/api/notifications";

/**
 * Настройка критических остатков (Э-16).
 *
 * Порог задаётся по категории, а не по товару: следить за тысячей
 * артикулов вручную невозможно, а «джинсов меньше пятнадцати» —
 * правило, которое владелец может держать в голове.
 */
export function AlertsSettingsView() {
  const t = useTranslations("app.alerts");
  const [settings, setSettings] = useState<AlertSettings | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let alive = true;
    fetchAlertSettings()
      .then((data) => alive && setSettings(data))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  if (!settings) return <ListSkeleton rows={4} />;

  function patch(next: Partial<AlertSettings>) {
    setSettings((prev) => (prev ? { ...prev, ...next } : prev));
    setSaved(false);
  }

  function setThreshold(categoryId: string, value: number) {
    patch({
      rules: settings!.rules.map((rule) =>
        rule.categoryId === categoryId ? { ...rule, threshold: value } : rule,
      ),
    });
  }

  async function handleSave() {
    await saveAlertSettings(settings!);
    setSaved(true);
  }

  const off = !settings.enabled;

  return (
    <div className="flex flex-col gap-6">
      <PageHead eyebrow={t("eyebrow")} title={t("title")}>
        <Toggle
          label={t("enable")}
          checked={settings.enabled}
          onChange={(value) => patch({ enabled: value })}
        />
        <Button type="button" onClick={handleSave}>
          {t("save")}
        </Button>
      </PageHead>

      <MockNotice text={t("mock")} />

      {saved ? (
        <p role="status" className="text-[13.5px] font-semibold text-app-ok">
          {t("saved")}
        </p>
      ) : null}

      <div className={off ? "pointer-events-none opacity-45" : undefined}>
        <h2 className="mb-3 text-[17px] font-extrabold tracking-[-0.015em] text-app-ink">
          {t("thresholds")}
        </h2>
        <DataTable
          caption={t("thresholds")}
          head={
            <>
              <Th>{t("category")}</Th>
              <Th align="right">{t("threshold")}</Th>
            </>
          }
        >
          {settings.rules.map((rule) => (
            <tr key={rule.categoryId}>
              <Td className="font-semibold">{rule.categoryName}</Td>
              <Td align="right">
                <input
                  inputMode="numeric"
                  aria-label={`${rule.categoryName} — ${t("threshold")}`}
                  value={rule.threshold}
                  onChange={(event) =>
                    setThreshold(
                      rule.categoryId,
                      Number(event.target.value.replace(/\D/g, "")) || 0,
                    )
                  }
                  className="h-11 w-24 rounded-card border-[1.5px] border-app-line-strong bg-app-card text-center font-mono font-bold text-app-ink num transition-[border-color,box-shadow] duration-150 outline-none focus:border-app-sapphire focus:shadow-[0_0_0_4px_rgb(15_82_186/0.10)]"
                />
              </Td>
            </tr>
          ))}
        </DataTable>

        <h2 className="mt-7 mb-3 text-[17px] font-extrabold tracking-[-0.015em] text-app-ink">
          {t("channels")}
        </h2>
        <div className="flex flex-wrap gap-x-10 gap-y-4 rounded-frame border border-app-line bg-app-card p-5">
          <Toggle
            label={t("channelInApp")}
            checked={settings.channelInApp}
            onChange={(value) => patch({ channelInApp: value })}
          />
          <Toggle
            label={t("channelTelegram")}
            checked={settings.channelTelegram}
            onChange={(value) => patch({ channelTelegram: value })}
          />
          <Toggle
            label={t("channelEmail")}
            checked={settings.channelEmail}
            onChange={(value) => patch({ channelEmail: value })}
          />
        </div>

        {settings.suggestion ? (
          <div className="mt-5 flex items-start gap-3 rounded-frame border border-app-sapphire/25 bg-app-sapphire-soft p-5">
            <Lightbulb
              className="mt-0.5 size-5 shrink-0 text-app-sapphire"
              aria-hidden
            />
            <div>
              <p className="font-extrabold text-app-ink">{t("suggestion")}</p>
              <p className="mt-1 text-[13.5px] leading-snug text-app-dim">
                {t("suggestionBody", {
                  category: settings.suggestion.categoryName,
                  threshold: settings.suggestion.threshold,
                  sold: settings.suggestion.soldLastMonth,
                })}
              </p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
