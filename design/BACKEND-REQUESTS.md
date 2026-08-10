# Запросы к бекенду для экранов Stitch

**Составлено:** 2026-08-09 по 22 новым экранам из `design/STITCH-SCREENS.md`.
**Проверено по коду бекенда** (`C:\Users\USER\Desktop\ideya project  backend`):
все существующие роуты вычитаны из `src/modules/**/*.routes.ts`, модели —
из `prisma/schema.prisma`. Это не догадки.

Все ответы бекенда завёрнуты в `{ success, data, error }` —
`lib/apiClient.ts` разворачивает конверт сам, поэтому ниже описан **только
полезный груз (`data`)**.

---

## 1. Что уже есть — трогать не нужно

| Метод  | Путь                                | Кому нужен                      |
| ------ | ----------------------------------- | ------------------------------- |
| GET    | `/me`                               | все экраны                      |
| GET    | `/auth/accounts`                    | настройки                       |
| POST   | `/auth/link-account`                | настройки                       |
| DELETE | `/auth/accounts/:id`                | настройки                       |
| POST   | `/tenants`                          | онбординг                       |
| GET    | `/tenants/me`                       | шапка, документы (реквизиты)    |
| PATCH  | `/tenants/me`                       | настройки                       |
| GET    | `/users`                            | Э-06 (сотрудники-лидеры), штат  |
| PATCH  | `/users/:id/role`                   | штат                            |
| PATCH  | `/users/:id/active`                 | штат                            |
| GET    | `/inventory/products`               | Э-09, Э-10, Э-11, Э-02          |
| GET    | `/inventory/products/:id`           | Э-02                            |
| POST   | `/inventory/products`               | Э-01                            |
| PATCH  | `/inventory/products/:id`           | Э-01                            |
| DELETE | `/inventory/products/:id`           | склад                           |
| GET    | `/inventory/products/:id/variants`  | Э-01, Э-02                      |
| POST   | `/inventory/products/:id/variants`  | Э-01                            |
| PATCH  | `/inventory/variants/:id`           | Э-01                            |
| DELETE | `/inventory/variants/:id`           | Э-01                            |
| POST   | `/inventory/products/:id/image`     | Э-01                            |
| DELETE | `/inventory/products/:id/image`     | Э-01                            |
| POST   | `/inventory/stock`                  | ручная правка остатка           |
| GET    | `/inventory/stock/movements`        | Э-14 (частично), история        |
| GET    | `/inventory/categories`             | Э-01, Э-10, Э-16                |
| POST   | `/inventory/categories`             | Э-01                            |
| GET    | `/customers`                        | Э-20 (поиск), CRM               |
| GET    | `/customers/:id`                    | CRM                             |
| POST   | `/customers`                        | CRM                             |
| PATCH  | `/customers/:id`                    | CRM                             |
| GET    | `/sales`                            | Э-21 (поиск чека)               |
| GET    | `/sales/:id`                        | Э-21                            |
| POST   | `/sales`                            | касса                           |
| GET    | `/promotions`                       | Э-19                            |
| POST   | `/promotions`                       | Э-19                            |
| PATCH  | `/promotions/:id`                   | Э-19                            |
| POST   | `/promotions/validate`              | касса                           |
| POST   | `/segments/preview`                 | Э-19                            |
| GET    | `/campaigns`, `/campaigns/:id`      | маркетинг                       |
| POST   | `/campaigns`, `/campaigns/:id/send` | маркетинг                       |
| GET    | `/loyalty/settings`                 | Э-18                            |
| PATCH  | `/loyalty/settings`                 | Э-18                            |
| GET    | `/customers/:id/loyalty`            | Э-18                            |
| POST   | `/customers/:id/loyalty/adjust`     | Э-18                            |
| GET    | `/debts`, POST `/debts`             | CRM, Э-08 (как образец)         |
| PATCH  | `/debts/:id/pay`                    | CRM                             |
| GET    | `/reports/overview`                 | дашборд                         |
| GET    | `/reports/sales`                    | отчёты                          |
| GET    | `/reports/sales-by-day`             | дашборд                         |
| GET    | `/reports/top-products`             | отчёты                          |
| GET    | `/reports/dead-stock`               | отчёты                          |
| GET    | `/reports/profit`                   | отчёты                          |
| GET    | `/reports/low-stock`                | Э-16 (чтение)                   |
| GET    | `/reports/size-analysis`            | склад                           |
| GET    | `/billing/plans`, `/my-modules`     | тарифы                          |
| POST   | `/billing/subscribe`                | тарифы                          |

**Итого 58 роутов.** На них закрываются экраны Э-01, Э-02 (кроме очереди),
Э-04 и частично Э-18, Э-19, Э-21.

---

## 2. Чего не хватает — список для реализации

Сгруппировано по модулям. В каждом блоке: **новые модели Prisma** →
**эндпоинты**. Пути даны без префикса `/api/v1`.

---

### Модуль 1. Смены кассы — `shifts` 🔴 критично

**Закрывает экраны:** Э-05 (закрытие смены + Z-отчёт), Э-06 (анализ смен),
Э-07 (остаток в кассе), Э-14 (Z-отчёты в архиве).
**Сейчас нет ничего:** у `Sale` нет привязки к смене, поэтому «выручка за
смену» и сверка кассы посчитать невозможно.

**Модели:**

```prisma
enum ShiftStatus { OPEN CLOSED }

model Shift {
  id            String      @id @default(uuid())
  tenantId      String
  number        Int         // сквозной номер по тенанту: «Смена №842»
  openedById    String
  closedById    String?
  status        ShiftStatus @default(OPEN)
  openingCash   Decimal     @db.Decimal(12,2)  // сколько было в кассе на старте
  countedCash   Decimal?    @db.Decimal(12,2)  // фактически посчитали при закрытии
  expectedCash  Decimal?    @db.Decimal(12,2)  // сколько должно быть по системе
  difference    Decimal?    @db.Decimal(12,2)  // countedCash − expectedCash
  openedAt      DateTime    @default(now())
  closedAt      DateTime?
  note          String?
}
```

Плюс поле `shiftId String?` в моделях `Sale`, `Expense`, `Return`.

**Эндпоинты:**

| Метод | Путь                   | Тело / параметры                    | Ответ                                            |
| ----- | ---------------------- | ----------------------------------- | ------------------------------------------------ |
| GET   | `/shifts/current`      | —                                   | текущая открытая смена или `null`                |
| POST  | `/shifts/open`         | `{ openingCash }`                   | созданная смена                                  |
| GET   | `/shifts/:id/summary`  | —                                   | сводка для экрана закрытия (ниже)                |
| POST  | `/shifts/:id/close`    | `{ countedCash, note? }`            | закрытая смена + `difference`                    |
| GET   | `/shifts`              | `?from&to&page&limit`               | список смен                                      |
| GET   | `/shifts/:id/z-report` | —                                   | данные Z-отчёта для печати                       |

`GET /shifts/:id/summary` — форма ответа под Э-05:

```jsonc
{
  "id": "…", "number": 842, "status": "OPEN",
  "openedAt": "…", "openedBy": { "id": "…", "name": "Иван П." },
  "revenue": 1245678.5,        // выручка за смену
  "cash": 543210,              // из них наличными
  "card": 702468.5,
  "transfer": 0,
  "returns": -12345,           // сумма возвратов
  "expenses": 1200,            // расходы из кассы за смену
  "openingCash": 10000,
  "expectedCash": 543210,      // openingCash + cash − returns(cash) − expenses
  "salesCount": 45,
  "byCategory": [              // свод по категориям
    { "categoryId": "…", "name": "Одежда", "sales": 850000, "vat": 170000, "total": 1020000 }
  ]
}
```

> **Вопрос по НДС.** В макете есть колонка «НДС». В схеме ставки НДС нет
> нигде. Нужно решить: (а) добавить `vatRate` в `Category` или `Tenant`,
> (б) убрать колонку. Пока фронт колонку рисует, но при `vat === null`
> прячет её целиком.

---

### Модуль 2. Расходы из кассы — `expenses` 🔴 критично

**Закрывает:** Э-07, а также «расходы» в чистой прибыли дашборда.

```prisma
enum ExpenseCategory { SUPPLIES RENT FOOD TRANSPORT SALARY OTHER }

model Expense {
  id          String          @id @default(uuid())
  tenantId    String
  shiftId     String?
  category    ExpenseCategory
  amount      Decimal         @db.Decimal(12,2)
  comment     String?
  receiptUrl  String?         // файл чека в Supabase Storage
  createdById String
  createdAt   DateTime        @default(now())
}
```

| Метод  | Путь                       | Тело / параметры                              | Ответ                              |
| ------ | -------------------------- | --------------------------------------------- | ---------------------------------- |
| GET    | `/expenses`                | `?from&to&category&page&limit`                | `{ items, total, page }`           |
| GET    | `/expenses/summary`        | `?from&to`                                    | `{ cashBalance, todayTotal, pendingReceipts }` |
| POST   | `/expenses`                | `{ category, amount, comment?, receiptUrl? }` | созданный расход                   |
| POST   | `/expenses/:id/receipt`    | `multipart/form-data`                         | `{ receiptUrl }`                   |
| DELETE | `/expenses/:id`            | —                                             | `204`                              |

> Загрузка файла — по образцу уже работающего
> `POST /inventory/products/:id/image` (`storage.plugin.ts`).

---

### Модуль 3. Поставщики и закупки — `suppliers`, `purchases` 🔴 критично

**Закрывает:** Э-08 (взаиморасчёты), Э-09 (приёмка), Э-14 (закупки в архиве),
Э-17 (себестоимость потерь).

```prisma
model Supplier {
  id        String   @id @default(uuid())
  tenantId  String
  name      String
  phone     String?
  note      String?
  createdAt DateTime @default(now())
}

enum PurchaseStatus { DRAFT EXPECTED RECEIVED CANCELLED }

model PurchaseOrder {
  id           String         @id @default(uuid())
  tenantId     String
  supplierId   String
  number       Int
  status       PurchaseStatus @default(DRAFT)
  expectedAt   DateTime?
  receivedAt   DateTime?
  receivedById String?
  totalCost    Decimal        @db.Decimal(12,2)
  items        PurchaseItem[]
}

model PurchaseItem {
  id              String  @id @default(uuid())
  purchaseOrderId String
  variantId       String
  expectedQty     Int
  receivedQty     Int?     // заполняется при приёмке
  unitCost        Decimal  @db.Decimal(12,2)
}

enum SupplierPaymentMethod { TRANSFER CASH }

model SupplierPayment {
  id         String                @id @default(uuid())
  tenantId   String
  supplierId String
  amount     Decimal               @db.Decimal(12,2)
  method     SupplierPaymentMethod
  // какие закупки гасит этот платёж
  purchaseIds String[]
  createdAt  DateTime              @default(now())
}
```

| Метод | Путь                        | Тело / параметры                                   | Ответ                                     |
| ----- | --------------------------- | -------------------------------------------------- | ----------------------------------------- |
| GET   | `/suppliers`                | `?search`                                           | список + `balance` (долг) по каждому      |
| POST  | `/suppliers`                | `{ name, phone?, note? }`                           | поставщик                                 |
| PATCH | `/suppliers/:id`            | частичное                                           | поставщик                                 |
| GET   | `/suppliers/summary`        | —                                                   | `{ totalDebt, dueThisWeek, lastPayment }` |
| GET   | `/suppliers/:id/purchases`  | `?status`                                           | закупки поставщика (для модалки оплаты)   |
| POST  | `/suppliers/:id/payments`   | `{ amount, method, purchaseIds[] }`                 | платёж + новый баланс                     |
| GET   | `/purchases`                | `?status&supplierId&from&to`                        | список закупок                            |
| POST  | `/purchases`                | `{ supplierId, expectedAt?, items[] }`              | закупка                                   |
| GET   | `/purchases/:id`            | —                                                   | закупка с позициями (для Э-09)            |
| POST  | `/purchases/:id/receive`    | `{ items: [{ itemId, receivedQty }], note? }`       | **проводит остатки** `StockReason.PURCHASE` |

> `POST /purchases/:id/receive` должен в одной транзакции: записать
> `receivedQty`, создать `StockMovement` на каждую позицию, обновить
> `ProductVariant.quantity`, поставить статус `RECEIVED`.

---

### Модуль 4. Инвентаризация — `stocktakes` 🔴 критично

**Закрывает:** Э-10, Э-17 (расхождения), Э-14.

```prisma
enum StocktakeStatus { OPEN COMPLETED CANCELLED }
enum StockLocation { WAREHOUSE SALES_FLOOR }

model Stocktake {
  id         String          @id @default(uuid())
  tenantId   String
  number     Int
  location   StockLocation
  status     StocktakeStatus @default(OPEN)
  startedById String
  startedAt  DateTime        @default(now())
  completedAt DateTime?
  items      StocktakeItem[]
}

model StocktakeItem {
  id          String @id @default(uuid())
  stocktakeId String
  variantId   String
  systemQty   Int     // остаток по системе на момент старта
  countedQty  Int?    // фактический
  // difference = countedQty − systemQty, считается на лету
}
```

| Метод | Путь                       | Тело / параметры                          | Ответ                                        |
| ----- | -------------------------- | ----------------------------------------- | -------------------------------------------- |
| POST  | `/stocktakes`              | `{ location, categoryIds? }`              | создаёт инвентаризацию и **снимок остатков** |
| GET   | `/stocktakes`              | `?status`                                 | список                                       |
| GET   | `/stocktakes/:id`          | `?search&categoryId&page`                 | позиции с `systemQty` / `countedQty`         |
| PATCH | `/stocktakes/:id/items`    | `{ items: [{ variantId, countedQty }] }`  | пакетное сохранение (автосейв по мере ввода) |
| POST  | `/stocktakes/:id/complete` | —                                         | проводит `ADJUSTMENT` по расхождениям        |
| GET   | `/stocktakes/:id/summary`  | —                                         | `{ positions, units, differenceUnits, differenceAmount }` |

---

### Модуль 5. Локации и перемещения — `transfers` 🟡

**Закрывает:** Э-11, переключатель «Склад / Торговый зал» в Э-10, счётчики
на дашборде.

> **Это самое большое изменение схемы.** Сейчас у варианта одно поле
> `quantity` — «сколько всего». Чтобы разделить склад и зал, остаток должен
> стать разрезом по локации.
>
> Предлагаемый путь без ломки существующего кода: добавить таблицу
> `VariantStock (variantId, location, quantity)`, а `ProductVariant.quantity`
> оставить как сумму (её пересчитывает тот же сервис). Тогда весь текущий код
> продолжает работать, а новые экраны читают разрез.

```prisma
model VariantStock {
  variantId String
  location  StockLocation
  quantity  Int           @default(0)
  @@id([variantId, location])
}

model Transfer {
  id         String   @id @default(uuid())
  tenantId   String
  number     Int
  fromLoc    StockLocation
  toLoc      StockLocation
  createdById String
  createdAt  DateTime @default(now())
  items      TransferItem[]
}

model TransferItem {
  id         String @id @default(uuid())
  transferId String
  variantId  String
  quantity   Int
}
```

Плюс поле `location StockLocation?` в `StockMovement`.

| Метод | Путь                        | Тело / параметры                                | Ответ                                   |
| ----- | --------------------------- | ----------------------------------------------- | --------------------------------------- |
| GET   | `/stock/by-location`        | `?location&search&categoryId`                    | товары с остатком в разрезе локации     |
| GET   | `/stock/location-summary`   | —                                                | `{ warehouse: 3450, salesFloor: 1200 }` |
| POST  | `/transfers`                | `{ fromLoc, toLoc, items: [{variantId, qty}] }`  | проводит перемещение                    |
| GET   | `/transfers`                | `?from&to`                                       | список (для архива Э-14)                |
| GET   | `/transfers/:id`            | —                                                | документ перемещения                    |

---

### Модуль 6. Списания и согласования — `write-offs` 🔴 критично

**Закрывает:** Э-12 (акт), Э-13 (согласование), Э-14, Э-17.
Сейчас есть только `StockReason.WRITE_OFF` в движениях — но нет **документа**,
причины по позиции, ответственного и статуса согласования.

```prisma
enum WriteOffStatus { DRAFT PENDING APPROVED REJECTED }
enum WriteOffReason { DEFECT DAMAGE_TRANSPORT EXPIRED CUSTOMER_RETURN SHORTAGE MARKDOWN OTHER }

model WriteOff {
  id           String         @id @default(uuid())
  tenantId     String
  number       Int
  location     StockLocation
  status       WriteOffStatus @default(DRAFT)
  totalCost    Decimal        @db.Decimal(12,2)
  createdById  String
  approvedById String?
  managerNote  String?
  createdAt    DateTime       @default(now())
  approvedAt   DateTime?
  items        WriteOffItem[]
}

model WriteOffItem {
  id         String         @id @default(uuid())
  writeOffId String
  variantId  String
  quantity   Int
  unitCost   Decimal        @db.Decimal(12,2)
  reason     WriteOffReason
  note       String?
}
```

| Метод | Путь                       | Тело / параметры                     | Ответ                                    |
| ----- | -------------------------- | ------------------------------------ | ---------------------------------------- |
| GET   | `/write-offs`              | `?status&from&to`                    | список                                   |
| POST  | `/write-offs`              | `{ location, items[] }`              | черновик; если сумма > порога → `PENDING` |
| GET   | `/write-offs/:id`          | —                                    | документ для печати (Э-12)               |
| PATCH | `/write-offs/:id`          | частичное                            | правка черновика                         |
| POST  | `/write-offs/:id/approve`  | `{ managerNote? }`                   | **проводит списание** + `WRITE_OFF`      |
| POST  | `/write-offs/:id/reject`   | `{ managerNote }`                    | отклоняет, остатки не трогает            |
| GET   | `/write-offs/pending`      | —                                    | очередь согласования для Э-13            |

> **Нужно решение заказчика:** с какой суммы списание уходит на согласование
> менеджеру. В макете Э-13 — 4 500 TJS. Предлагаю хранить порог в
> `Tenant.writeOffApprovalThreshold` (по умолчанию 1 000 TJS, `0` = всегда).

---

### Модуль 7. Возвраты и обмены — `returns` 🔴 критично

**Закрывает:** Э-21, «Возвраты» в Э-05 и Э-06.

```prisma
enum ReturnReason { WRONG_SIZE DEFECT CHANGED_MIND OTHER }

model SaleReturn {
  id         String   @id @default(uuid())
  tenantId   String
  saleId     String
  shiftId    String?
  total      Decimal  @db.Decimal(12,2)
  createdById String
  createdAt  DateTime @default(now())
  items      SaleReturnItem[]
  /// если это обмен — сюда пишем id новой продажи
  exchangeSaleId String?
}

model SaleReturnItem {
  id          String       @id @default(uuid())
  returnId    String
  saleItemId  String
  quantity    Int
  amount      Decimal      @db.Decimal(12,2)
  reason      ReturnReason
}
```

| Метод | Путь               | Тело / параметры                                       | Ответ                          |
| ----- | ------------------ | ------------------------------------------------------ | ------------------------------ |
| GET   | `/sales/lookup`    | `?receipt=CHK-…` или `?phone=…`                        | чек с позициями и уже возвращённым |
| POST  | `/returns`         | `{ saleId, items: [{ saleItemId, quantity, reason }] }` | возврат + вернуть остаток      |
| POST  | `/returns/exchange`| `{ saleId, returnItems[], newItems[] }`                 | возврат + новая продажа        |
| GET   | `/returns`         | `?from&to`                                             | список (Э-06, Э-14)            |

> `GET /sales/lookup` нужен отдельно от `GET /sales/:id`, потому что кассир
> вводит **номер чека**, а не UUID. Значит `Sale` нужен человекочитаемый
> `receiptNumber String @unique` — сейчас его нет.

---

### Модуль 8. Уведомления — `notifications` 🟡

**Закрывает:** Э-15, Э-22 (колокольчик), правая панель в Э-13.

```prisma
enum NotificationKind { CRITICAL ORDER SYSTEM STOCK }

model Notification {
  id        String           @id @default(uuid())
  tenantId  String
  userId    String?          // null = всем в тенанте
  kind      NotificationKind
  title     String
  body      String
  actionUrl String?          // «Пополнить», «Посмотреть заказ»
  actionLabel String?
  readAt    DateTime?
  createdAt DateTime         @default(now())
}
```

| Метод | Путь                          | Тело / параметры        | Ответ                          |
| ----- | ----------------------------- | ----------------------- | ------------------------------ |
| GET   | `/notifications`              | `?kind&unread&limit`    | `{ items, unreadCount }`       |
| GET   | `/notifications/unread-count` | —                       | `{ count }` — для колокольчика |
| POST  | `/notifications/:id/read`     | —                       | `204`                          |
| POST  | `/notifications/read-all`     | —                       | `204`                          |
| DELETE| `/notifications/:id`          | —                       | `204`                          |

> Кто их создаёт: сервисы низкого остатка, согласования списаний, крупных
> заказов. Первый источник — модуль 9 (пороги).

---

### Модуль 9. Пороги низкого остатка — `alerts` 🟡

**Закрывает:** Э-16.

```prisma
model StockAlertRule {
  id         String  @id @default(uuid())
  tenantId   String
  categoryId String
  threshold  Int
}

model AlertSettings {
  tenantId       String  @id
  enabled        Boolean @default(true)
  channelInApp   Boolean @default(true)
  channelTelegram Boolean @default(false)
  channelEmail   Boolean @default(false)
  telegramChatId String?
}
```

| Метод | Путь                    | Тело / параметры                              | Ответ                               |
| ----- | ----------------------- | --------------------------------------------- | ----------------------------------- |
| GET   | `/alerts/settings`      | —                                             | настройки + правила по категориям   |
| PUT   | `/alerts/settings`      | `{ enabled, channels{}, rules[] }`            | сохранённые настройки               |
| GET   | `/alerts/suggestions`   | —                                             | «умная подсказка»: рекомендованный порог по динамике продаж |

---

### Модуль 10. Печать этикеток — `labels` 🟢 можно позже

**Закрывает:** Э-03 (очередь). Сама этикетка (Э-02) рисуется на клиенте.

```prisma
enum PrintJobStatus { QUEUED PRINTING DONE CANCELLED FAILED }
enum LabelType { STANDARD DISCOUNT }

model PrintJob {
  id        String         @id @default(uuid())
  tenantId  String
  variantId String
  labelType LabelType
  quantity  Int
  printed   Int            @default(0)
  status    PrintJobStatus @default(QUEUED)
  createdAt DateTime       @default(now())
}
```

| Метод | Путь                    | Тело / параметры                              | Ответ                                  |
| ----- | ----------------------- | --------------------------------------------- | -------------------------------------- |
| GET   | `/print-jobs`           | `?status`                                     | очередь + `{ activeCount, printedToday }` |
| POST  | `/print-jobs`           | `{ variantId, labelType, quantity }`          | задание                                |
| POST  | `/print-jobs/:id/pause` | —                                             | пауза                                  |
| DELETE| `/print-jobs/:id`       | —                                             | отмена                                 |
| DELETE| `/print-jobs`           | —                                             | очистить очередь                       |

> Статус принтера («Xprinter XP-370B — Online») бекенд знать не может:
> принтер подключён к компьютеру кассира. Это состояние клиента.

---

### Модуль 11. Подарочные карты — `gift-cards` 🟢 можно позже

**Закрывает:** Э-20.

```prisma
enum GiftCardKind { PHYSICAL DIGITAL }
enum GiftCardStatus { ACTIVE USED EXPIRED CANCELLED }

model GiftCard {
  id         String         @id @default(uuid())
  tenantId   String
  code       String         @unique   // TIM-GC-1928-4502-9981
  kind       GiftCardKind
  status     GiftCardStatus @default(ACTIVE)
  initialAmount Decimal     @db.Decimal(12,2)
  balance    Decimal        @db.Decimal(12,2)
  customerId String?
  expiresAt  DateTime?
  createdAt  DateTime       @default(now())
}
```

| Метод | Путь                     | Тело / параметры                                   | Ответ                     |
| ----- | ------------------------ | -------------------------------------------------- | ------------------------- |
| GET   | `/gift-cards`            | `?status&search`                                   | список                    |
| POST  | `/gift-cards`            | `{ kind, amount, customerId?, expiresAt? }`        | карта с кодом             |
| GET   | `/gift-cards/generate-code` | —                                               | `{ code }` — «сгенерировать заново» |
| GET   | `/gift-cards/:code`      | —                                                  | баланс (проверка на кассе)|
| POST  | `/gift-cards/:code/redeem` | `{ amount, saleId }`                             | списание с карты          |

---

### Модуль 12. Лояльность: уровни и аналитика — дополнение к существующему 🟡

**Закрывает:** Э-18. `/loyalty/settings` уже есть, уровней и агрегатов — нет.

```prisma
model LoyaltyTier {
  id         String  @id @default(uuid())
  tenantId   String
  name       String   // Bronze / Silver / Gold
  minPoints  Int
  discountPercent Decimal @db.Decimal(5,2)
  perks      String?
}
```

| Метод | Путь                    | Ответ                                                              |
| ----- | ----------------------- | ------------------------------------------------------------------ |
| GET   | `/loyalty/overview`     | `{ members, pointsIssued, pointsRedeemed, revenueFromLoyal }`      |
| GET   | `/loyalty/tiers`        | список уровней                                                     |
| PUT   | `/loyalty/tiers`        | пакетное сохранение уровней                                        |
| GET   | `/loyalty/top-customers`| `?limit=10` → `[{ name, points, ltv }]`                            |
| GET   | `/loyalty/repeat-rate`  | `?months=6` → помесячный коэффициент + отметки периодов акций      |

---

### Модуль 13. Архив документов — `documents` 🟡

**Закрывает:** Э-14. Это **витрина поверх** модулей 3, 4, 6, 7, 1 — отдельных
таблиц не нужно, нужен один агрегирующий запрос.

| Метод | Путь                       | Параметры                                                   | Ответ                                                                |
| ----- | -------------------------- | ----------------------------------------------------------- | -------------------------------------------------------------------- |
| GET   | `/documents`               | `?type=WRITE_OFF\|PURCHASE\|Z_REPORT\|TRANSFER\|RETURN&from&to&search&page` | `[{ type, id, number, createdAt, responsible, amount, status }]` |
| GET   | `/documents/:type/:id/pdf` | —                                                            | `application/pdf` (или ссылка на файл)                               |
| GET   | `/documents/export`        | `?type&from&to&format=xlsx`                                  | файл списка                                                          |

> Если PDF на бекенде делать не хочется — фронт печатает через `window.print()`
> из готового вида документа (Э-12), и тогда нужен только `GET /documents`.
> **Решение за вами:** PDF на сервере (единый вид, можно слать почтой) или
> печать из браузера (быстрее сделать).

---

### Модуль 14. Отчёт о потерях — дополнение к `reports` 🟡

**Закрывает:** Э-17.

| Метод | Путь                     | Параметры  | Ответ                                                                     |
| ----- | ------------------------ | ---------- | ------------------------------------------------------------------------- |
| GET   | `/reports/losses`        | `?from&to` | `{ totalAmount, percentOfRevenue, deltaPercent, topCategory }`            |
| GET   | `/reports/losses-by-day` | `?from&to` | `[{ date, amount, reason }]` — для графика                                |
| GET   | `/reports/loss-reasons`  | `?from&to` | `[{ reason, amount, share, trend: 'up'\|'down'\|'flat' }]`                |
| GET   | `/reports/loss-items`    | `?from&to&limit` | `[{ productName, sku, image, diffQty, diffAmount }]`                |

---

### Модуль 15. Анализ смен — дополнение к `reports` 🟡

**Закрывает:** Э-06.

| Метод | Путь                       | Параметры       | Ответ                                                                |
| ----- | -------------------------- | --------------- | -------------------------------------------------------------------- |
| GET   | `/reports/shifts`          | `?from&to`      | `{ bestShift, avgRevenuePerHour, returnsCount }` + дельты к прошлому  |
| GET   | `/reports/shifts-by-day`   | `?from&to`      | `[{ date, revenue, avgCheck }]` — столбцы + линия                     |
| GET   | `/reports/staff-ranking`   | `?from&to`      | `[{ rank, userId, name, shift, revenue, avgCheck }]`                  |

---

## 3. Сводка: что мокаем на фронте

Пока эндпоинта нет, экран работает на моках из `lib/mock/`. Каждый мок помечен
`// MOCK: <метод> <путь>` — по этой метке потом ищется всё, что надо переключить.

| Экран                          | Мок до появления            | Приоритет |
| ------------------------------ | --------------------------- | --------- |
| Э-03 очередь печати            | модуль 10                   | 🟢        |
| Э-05 закрытие смены            | модуль 1                    | 🔴        |
| Э-06 анализ смен               | модули 1, 15                | 🟡        |
| Э-07 расходы                   | модуль 2                    | 🔴        |
| Э-08 поставщики                | модуль 3                    | 🔴        |
| Э-09 приёмка                   | модуль 3                    | 🔴        |
| Э-10 инвентаризация            | модуль 4                    | 🔴        |
| Э-11 перемещение               | модуль 5                    | 🟡        |
| Э-12 акт списания              | модуль 6                    | 🔴        |
| Э-13 согласование              | модули 6, 8                 | 🔴        |
| Э-14 архив документов          | модуль 13                   | 🟡        |
| Э-15 уведомления               | модуль 8                    | 🟡        |
| Э-16 пороги остатков           | модуль 9                    | 🟡        |
| Э-17 отчёт о потерях           | модуль 14                   | 🟡        |
| Э-18 лояльность (частично)     | модуль 12                   | 🟡        |
| Э-20 подарочные карты          | модуль 11                   | 🟢        |
| Э-21 возвраты                  | модуль 7                    | 🔴        |

Работают на живом API сразу: Э-01, Э-02, Э-04, Э-19 (кроме сегментов по уровням).

---

## 4. Вопросы, на которые нужен ваш ответ

1. **НДС.** Есть ли он в вашей отчётности? Если да — где хранить ставку:
   в категории или в магазине. Если нет — убираем колонку из Z-отчёта.
2. **Порог согласования списаний.** С какой суммы списание уходит менеджеру?
3. **PDF документов.** Генерировать на бекенде или печатать из браузера?
4. **Локации.** Сейчас остаток один. Разделять склад и торговый зал по-настоящему
   (модуль 5) или «зал» — это просто отдельный магазин (tenant)?
5. **Номер чека.** Нужен человекочитаемый `receiptNumber` в `Sale` — сейчас
   только UUID, а кассир на возврате вводит номер с бумажного чека.
