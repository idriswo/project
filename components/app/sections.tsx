import {
  ArrowLeftRight,
  Bell,
  BellRing,
  ClipboardCheck,
  FileText,
  Gift,
  Heart,
  Printer,
  ReceiptText,
  RotateCcw,
  ScanBarcode,
  ShoppingCart,
  Tags,
  TrendingDown,
  Truck,
  Wallet,
  type LucideIcon,
} from "lucide-react";

import type { SectionKey } from "@/lib/roles";

/**
 * Иконки разделов Этапа 20.
 *
 * Лежат отдельно от `lib/roles.ts`, потому что роли — это правила
 * доступа, а не картинки: список в одном месте, его оформление — в
 * другом. Столб навигации и список на телефоне берут иконки отсюда,
 * поэтому разъехаться они не могут.
 */
export const SECTION_ICONS: Record<SectionKey, LucideIcon> = {
  purchases: Truck,
  stocktake: ClipboardCheck,
  transfer: ArrowLeftRight,
  labels: Tags,
  printQueue: Printer,

  shiftClose: ReceiptText,
  returns: RotateCcw,
  expenses: Wallet,
  suppliers: ShoppingCart,

  shiftAnalytics: TrendingDown,
  losses: TrendingDown,

  loyalty: Heart,
  giftCards: Gift,

  documents: FileText,
  notifications: Bell,
  scanner: ScanBarcode,
  alerts: BellRing,
};
