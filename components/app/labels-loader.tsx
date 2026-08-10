"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { LabelPreviewView } from "@/components/app/label-preview-view";
import { ListSkeleton } from "@/components/ui/skeleton";
import { fetchApi } from "@/lib/apiClient";
import type { LabelData } from "@/lib/labels";

/**
 * Что печатаем.
 *
 * Экран открывают из карточки товара (`/labels?product=…&variant=…`) и
 * из приёмки. Если параметров нет — показываем этикетку-образец, а не
 * пустой экран: человек, зашедший «посмотреть, как это выглядит»,
 * должен увидеть, как это выглядит.
 */

type Variant = {
  id: string;
  size?: string | null;
  barcode?: string | null;
};

type Product = {
  name: string;
  price: number;
  variants?: Variant[];
};

const SAMPLE: LabelData = {
  productName: "Джинсы Slim Fit",
  size: "XL/42",
  barcode: "4600001234567",
  price: 2450,
};

export function LabelsLoader() {
  const params = useSearchParams();
  const productId = params.get("product");
  const variantId = params.get("variant");

  // `key` перемонтирует загрузчик при смене товара: иначе на экране
  // на мгновение оставалась бы этикетка предыдущего, а её печатают.
  return (
    <LabelsFor
      key={`${productId ?? ""}:${variantId ?? ""}`}
      productId={productId}
      variantId={variantId}
    />
  );
}

function LabelsFor({
  productId,
  variantId,
}: {
  productId: string | null;
  variantId: string | null;
}) {
  const [data, setData] = useState<LabelData | null>(() =>
    productId ? null : SAMPLE,
  );

  useEffect(() => {
    if (!productId) return;
    let alive = true;

    fetchApi(`/inventory/products/${productId}`)
      .then((product: Product) => {
        if (!alive) return;
        const variant =
          product.variants?.find((item) => item.id === variantId) ??
          product.variants?.[0];

        setData({
          productName: product.name,
          size: variant?.size ?? null,
          barcode: variant?.barcode ?? null,
          price: Number(product.price) || 0,
        });
      })
      // Товар мог быть удалён, пока вкладка висела открытой. Образец
      // лучше пустого экрана: настройки печати всё равно нужно видеть.
      .catch(() => alive && setData(SAMPLE));

    return () => {
      alive = false;
    };
  }, [productId, variantId]);

  if (!data) return <ListSkeleton rows={1} />;

  return <LabelPreviewView data={data} />;
}
