# Design: Manual Waybill Creation for Logist

**Date:** 2026-05-28  
**Status:** Approved  
**Scope:** Logist role — WaybillList view

---

## Problem

Logists currently can only view, filter, edit, and approve waybills that drivers created via the mobile DriverApp. They have no way to digitise paper waybills or open a waybill on a driver's behalf. This blocks workflows where a driver had no phone access or submitted a paper form.

---

## Solution

Add a **"+ Додати ШЛ"** button to the WaybillList header. Clicking it opens a modal where the logist fills in the opening data (required) and optionally the closing data. The system automatically sets `status: 'open'` or `status: 'closed'` based on whether the closing section is complete.

---

## Component Structure

### New file: `components/CreateWaybillModal.tsx`

Self-contained component. Loads its own data from `Backend` directly (no extra props needed beyond callbacks).

**Props:**
```ts
interface Props {
  onSave: (wb: Waybill) => void;
  onClose: () => void;
}
```

**Internal data loading (on mount):**
- `Backend.users.getDrivers()` → driver dropdown
- `Backend.vehicles.getAll()` → vehicle dropdown (grouped: Regular / Reserve)
- `Backend.vehicles.getLastOdometer(vehicleId)` → auto-fills odometerStart on vehicle select
- `detectShift()` → pre-selects shift radio
- `new Date().toISOString()` → pre-fills openTime

### Modified: `components/WaybillList.tsx`

- Add `onAdd: (wb: Waybill) => void` prop
- Add `showCreate: boolean` state (default `false`)
- Add "+ Додати ШЛ" button in the page header (dark blue, `rounded-xl`, same style as VehiclesView/DriversView add buttons)
- Render `<CreateWaybillModal>` when `showCreate === true`

### Modified: `components/ManagerApp.tsx`

Add handler:
```ts
const handleAddWaybill = (wb: Waybill) => {
  Backend.waybills.save(wb);
  if (wb.odometerEnd) Backend.vehicles.updateOdometer(wb.vehicleId, wb.odometerEnd);
  setWaybills(prev => [...prev, wb]);
};
```

Pass `onAdd={handleAddWaybill}` to `<WaybillList>`.

---

## Form Fields

### Section 1 — Відкриття зміни (required)

| Field | Control | Pre-fill / Source |
|---|---|---|
| Водій | `<select>` | `Backend.users.getDrivers()` |
| Транспортний засіб | `<select>` grouped Regular/Reserve | `Backend.vehicles.getAll()` |
| Зміна | Radio buttons: I / II / III / Факт | `detectShift()` result |
| Час відкриття | `datetime-local` input | `now` (current datetime) |
| Одометр (початок) | Read-only display | `Backend.vehicles.getLastOdometer(vehicleId)`, updates on vehicle change |

`isApprentice` is auto-set from the selected driver's record. Not shown to the logist.

### Section 2 — Закриття зміни (optional)

Clearly labelled "необов'язково". If any field in this section is filled, all three become required.

| Field | Control | Constraints |
|---|---|---|
| Час закриття | `datetime-local` | Must be ≥ openTime |
| Одометр (кінець) | Number input | Must be ≥ odometerStart |
| Технологічна операція | `<select>` | From `MOCK_TECH_OPERATIONS` |
| Коментар | `<textarea>` | Optional, always |

---

## Status Logic

Determined automatically at save time — never exposed to the logist:

- Section 2 **fully filled** (`closeTime` + `odometerEnd` + `techOpId` all present) → `status: 'closed'`
- Section 2 **empty** → `status: 'open'`
- Section 2 **partially filled** → validation error, save blocked

---

## Validation Rules (in order)

1. No driver selected → *"Оберіть водія"*
2. No vehicle selected → *"Оберіть транспортний засіб"*
3. Open time empty → *"Вкажіть час відкриття"*
4. Close time present but `closeTime < openTime` → *"Час закриття має бути після часу відкриття"*
5. Section 2 partially filled:
   - Missing close time → *"Вкажіть час закриття"*
   - `odometerEnd < odometerStart` → *"Кінцевий одометр має бути ≥ початкового"*
   - Tech operation missing → *"Оберіть технологічну операцію"*

**Error display:** Single `<p>` inline error below the form fields, cleared on any field change. Same pattern as `VehiclesView` / `DriversView`.

---

## Edge Cases

- **No drivers registered:** Driver `<select>` shows disabled option *"Немає водіїв"*, save button disabled.
- **No vehicles registered:** Vehicle `<select>` shows disabled option *"Немає транспортних засобів"*, save button disabled.
- **odometerStart = 0:** Shown as `0 км` — valid, not an error.

---

## What This Does NOT Include

- Import from CSV/Excel (deferred — manual entry covers the immediate need)
- Logist setting `status: 'approved'` directly on creation (use the existing approve flow)
- Duplicate detection (same driver + vehicle + overlapping times)
