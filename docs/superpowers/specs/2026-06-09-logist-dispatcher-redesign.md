# Design: Logist & Dispatcher Redesign

**Date:** 2026-06-09  
**Status:** Approved

---

## Problem

The logist has no way to plan driver assignments for the next day. The dispatcher has no dedicated view to handle driver substitutions when the medic suspends a driver. Waybills support only one tech operation. There is no end-of-day Excel export.

---

## Solution

Four interconnected improvements using Approach A (planned status on Waybill):

1. Logist creates next-day assignments as `'planned'` waybills
2. Dispatcher gets a "На сьогодні" view with medical statuses and driver substitution
3. Waybill supports one main + up to 2 additional tech operations
4. Excel export with date range selection via SheetJS (client-side)

---

## Data Model (`types.ts`)

### Modified: `WaybillStatus`
```ts
export type WaybillStatus = 'open' | 'closed' | 'approved' | 'planned';
```

### Modified: `Waybill`
Add one new field:
```ts
additionalTechOps?: { id: string; name: string }[];  // max 2 entries
```

`openTime` doubles as the planned date/shift for `'planned'` waybills (e.g. `2026-06-10T08:00:00`). On driver confirmation it is overwritten with the actual current time.

### Modified: `ManagerView`
```ts
export type ManagerView =
  'dashboard' | 'waybills' | 'vehicles' | 'users' | 'assignments' | 'today';
```

- `'assignments'` — logist's narad planning view
- `'today'` — dispatcher's today view

---

## Backend (`services/backend.ts`)

No new localStorage keys. Planned waybills live in the existing `mhp_waybills` store.

New methods on `Backend.waybills`:

| Method | Description |
|---|---|
| `getPlanned(date: Date)` | Returns all `status === 'planned'` waybills whose `openTime` falls on `date` (by `toDateString()`) |
| `getPlannedForDriver(driverId, shift, date)` | Returns a single planned waybill for the given driver + shift + date, or `null` |
| `getTodayAssignments()` | Returns all waybills for today with status `'planned'` or `'open'` (openTime date = today) — used by TodayView to show the full picture of today's shifts |
| `confirm(waybillId, actualOpenTime, odometerStart, examId?)` | Sets `status → 'open'`, overwrites `openTime` and `odometerStart`, attaches `examId` |

Export does not require a new backend method — `getAll()` is filtered on the UI side.

---

## ManagerApp (`components/ManagerApp.tsx`)

### Role-gated navigation

| Role | Nav tabs |
|---|---|
| logist | Dashboard · **Наряди** · ШЛ · ТЗ · Водії |
| dispatcher | Dashboard · **На сьогодні** · ШЛ · ТЗ · Водії |
| admin | Dashboard · **Наряди** · **На сьогодні** · ШЛ · ТЗ · Водії |
| mechanic | Dashboard · ШЛ · ТЗ |

The `NAV` constant becomes a function `getNav(role)` that returns the appropriate array of nav items.

---

## AssignmentsView (`components/AssignmentsView.tsx`)

New component. Rendered when `view === 'assignments'`.

### Layout
- Date selector at top (default: tomorrow; min: today)
- Table of planned waybills for selected date: Водій · ТЗ · Зміна · Статус медогляду · Дії
- Medical status in this table is read from `Backend.exams.getShiftExam()` — same logic as TodayView
- "+ Додати наряд" button → `CreateAssignmentModal`

### CreateAssignmentModal
Fields:
- Driver select (from `Backend.users.getDrivers()`)
- Vehicle select (grouped regular / reserve)
- Shift radio: I · II · III · Факт
- Date picker (min = today, default = tomorrow)

On save: creates `Waybill` with:
- `status: 'planned'`
- `openTime` = selected date + shift center time (I→08:00, II→17:00, III→20:00, actual→current time)
- `odometerStart: 0` (placeholder; overwritten on confirmation)
- No `closeTime`, no `techOperationId`, no `odometerEnd`

### Row actions
- **Edit** — reopens modal pre-filled (driver, vehicle, shift, date)
- **Delete** — removes the planned waybill; confirmation dialog
- Rows where `status !== 'planned'` (already confirmed) are **read-only** — shown with a "На зміні" badge, no action buttons

---

## TodayView (`components/TodayView.tsx`)

New component. Rendered when `view === 'today'`.

Calls `Backend.waybills.getTodayAssignments()` — returns all waybills for today with status `'planned'` or `'open'`. Shows the full picture: unconfirmed assignments and already active shifts.

### Medical status indicators

| Badge | Condition |
|---|---|
| 🟢 Допущений | `getShiftExam` returns `result: 'cleared'` |
| 🔴 Відсторонений | `getShiftExam` returns `result: 'suspended'` |
| 🟡 Не проходив | No exam for this driver + shift + today |
| ⚫ На зміні | Waybill already `status === 'open'` |

### Driver substitution
Button **"Замінити водія"** visible when status is 🔴 or 🟡 and waybill is still `'planned'`.

Click → `SubstituteDriverModal`:
- Dropdown of all drivers
- Drivers with a 🔴 suspended exam today are shown with a warning indicator but remain selectable (dispatcher decides)
- Confirm → updates `driverId` / `driverName` on the planned waybill via `Backend.waybills.save()`
- Toast: "Водія замінено: Іваненко → Коваленко"

---

## DriverApp Changes (`components/DriverApp.tsx`)

### HomeView — planned waybill confirmation

After the existing medical clearance check, when the driver is cleared:

1. Call `Backend.waybills.getPlannedForDriver(user.id, currentShift, today)`
2. **If planned waybill found** → show assignment block:

```
📋  Ваш наряд на сьогодні
    ТЗ: № 101 · ПАЗ-3205        Зміна: I зміна
    Одометр: 124 580 км

    [ Підтвердити вихід на зміну ]   ← primary blue button
    [ Відкрити інший ШЛ ]            ← ghost text link
```

3. **If no planned waybill** → show existing "Відкрити зміну (новий ШЛ)" button (manual mode always available)
4. **If already open** → existing yellow "Зміна відкрита" block

### handleConfirmAssignment
- Reads `odometerStart` from `Backend.vehicles.getLastOdometer(wb.vehicleId)`
- Reads `examId` from `Backend.exams.getActiveClearance(user.id, currentShift, today)`
- Calls `Backend.waybills.confirm(wb.id, now.toISOString(), odometerStart, examId)`
- Calls `refresh()`

"Відкрити інший ШЛ" navigates to the existing `OpenShiftView` (manual flow unchanged).

---

## Multiple Tech Operations

### CloseShiftView (DriverApp) and EditModal (WaybillList)

Below the existing main tech operation select, add:

```
Технологічна операція *
[ Маршрутні перевезення ▾ ]

Додаткові операції (необов'язково)
[ Технічне обслуговування ▾ ] [×]
[ Ремонт ТЗ              ▾ ] [×]

[ + Додати операцію ]          ← hidden when 2 additional already added
```

Rules:
- Main operation: required (unchanged)
- Max 2 additional operations
- Each additional: select from `MOCK_TECH_OPERATIONS` + `×` remove button
- "+ Додати операцію" button disappears when 2 additional ops are present
- Saved as `additionalTechOps: [{ id, name }, ...]`

Same UI added to `CreateWaybillModal` (in the closing section).

### WaybillList display

The "Тех. операція" column renders:
```
Маршрутні перевезення        ← main op, existing style
+ Технічне обслуговування    ← additional ops, text-xs text-gray-400 each
+ Ремонт ТЗ
```

---

## Excel Export

### Trigger
Button **"Вивантажити ШЛ"** in the WaybillList header, next to "+ Додати ШЛ".

### ExportModal
```
Вивантаження шляхових листів

Період:  [ 09.06.2026 ]  —  [ 09.06.2026 ]   (default = today)

Статуси: ☑ Закриті   ☑ Затверджені   ☐ Відкриті   ☐ Планові

                       [ Скасувати ]  [ ⬇ Завантажити Excel ]
```

### Excel columns
| # | Column | Source |
|---|---|---|
| 1 | № | Row index |
| 2 | Дата | `openTime` formatted as DD.MM.YYYY |
| 3 | Водій | `driverName` |
| 4 | ТЗ | `vehicleNumber` |
| 5 | Зміна | `shift` |
| 6 | Відкрито | `openTime` formatted as HH:MM |
| 7 | Закрито | `closeTime` formatted as HH:MM or "—" |
| 8 | Одом. поч. | `odometerStart` |
| 9 | Одом. кін. | `odometerEnd` or "—" |
| 10 | Пробіг км | `odometerEnd - odometerStart` or "—" |
| 11 | Тех. операція | `techOperationName` or "—" |
| 12 | Доп. операції | `additionalTechOps.map(o => o.name).join(', ')` or "—" |
| 13 | Коментар | `comment` or "—" |
| 14 | Статус | Локалізована назва: Закрито / Затверджено / Відкрито |
| 15 | Медогляд | "Так" if `examId` set, else "Ні" |

**Filename:** `waybills_09.06.2026-09.06.2026.xlsx`

### Technical implementation
- Library: `xlsx` (SheetJS) — `npm install xlsx`
- Client-side only, no server required
- Helper: `exportToExcel(waybills: Waybill[], filename: string)`

---

## New Files

| File | Purpose |
|---|---|
| `components/AssignmentsView.tsx` | Logist narad planning |
| `components/TodayView.tsx` | Dispatcher today view + substitution |
| `components/ExportModal.tsx` | Date range + status picker for Excel export |

## Modified Files

| File | Changes |
|---|---|
| `types.ts` | `WaybillStatus` += `'planned'`; `Waybill` += `additionalTechOps`; `ManagerView` += `'assignments' \| 'today'` |
| `services/backend.ts` | `Backend.waybills` += `getPlanned`, `getPlannedForDriver`, `getTodayPlanned`, `confirm` |
| `components/ManagerApp.tsx` | `getNav(role)` function for role-gated nav; render `AssignmentsView` and `TodayView` |
| `components/DriverApp.tsx` | HomeView: planned waybill block + `handleConfirmAssignment` |
| `components/WaybillList.tsx` | Additional tech ops display; "Вивантажити ШЛ" button + `ExportModal`; `'planned'` waybills are **never shown** in WaybillList — they are managed exclusively in AssignmentsView |
| `components/CreateWaybillModal.tsx` | Additional tech ops in closing section |

---

## What This Does NOT Include

- Route / destination planning (only driver + vehicle + shift + date)
- Push notifications to driver when narad is assigned
- Narad approval workflow (logist creates → immediately visible)
- Historical narad reports
- PDF export
- Import from external systems
