# Design: Medic Role — Pre-Trip Medical Examination

**Date:** 2026-05-28  
**Status:** Approved

---

## Problem

Drivers are required by law to pass a pre-trip medical examination before each shift. Currently the system has no mechanism to record examinations or gate waybill creation on medical clearance.

---

## Solution

Add a `medic` role with a dedicated mobile-first `MedicApp`. The medic conducts the exam, records results, and issues per-shift clearance. `DriverApp` blocks waybill creation until a valid clearance exists for the current shift.

---

## Data Model (`types.ts`)

### New: `DrugTestResult`
```ts
export type DrugTestResult = 'not_done' | 'negative' | 'positive';
```

### New: `MedicalExam`
```ts
export interface MedicalExam {
  id: string;
  driverId: string;
  driverName: string;
  medicId: string;
  medicName: string;
  date: string;           // ISO — exam date
  shift: ShiftType;       // I | II | III | actual
  // All physiological fields optional
  bpSystolic?: number;
  bpDiastolic?: number;
  pulse?: number;
  alcoholMgl?: number;
  drugTest?: DrugTestResult;
  complaints?: string;
  // Result — required
  result: 'cleared' | 'suspended';
  suspendReason?: string; // required when result === 'suspended'
  createdAt: string;
}
```

### Modified: `Waybill`
Add `examId?: string` — reference to the MedicalExam that cleared this driver.

### Modified: `UserRole`
Add `'medic'` to the union.

---

## Backend (`services/backend.ts`)

New storage key: `mhp_exams`. New section `Backend.exams`:

| Method | Description |
|---|---|
| `getAll()` | All exams from localStorage |
| `save(exam)` | Insert or update |
| `getByDriver(driverId)` | Filter by driver |
| `getActiveClearance(driverId, shift, date)` | Returns `MedicalExam \| null` — finds `result: 'cleared'` for the given driver, shift, and calendar date |

`Backend.initialize()` — add `if (!localStorage.getItem('mhp_exams')) saveExams([])`.

---

## MedicApp (`components/MedicApp.tsx`)

Mobile-first, `max-w-md mx-auto`, same structure as `DriverApp` (blue header, bottom nav).

### Header
Name, role label "Медик", logout button.

### Bottom nav: 2 tabs
- **Огляд** (HomeIcon) — exam form
- **Журнал** (ListIcon) — today's exam log

### Огляд tab — exam flow

**Step 1: Driver selection**
Searchable combobox (no external library):
- Text input with search icon
- Typing filters `Backend.users.getDrivers()` by `contains` (case-insensitive)
- Results shown in absolutely-positioned dropdown list below the input
- Clicking outside closes the dropdown
- On select: input fills with driver name, dropdown closes

After driver selected: show current clearance status badge:
- Green "Допущений (Зміна X)" if already cleared for current shift
- Red "Відсторонений" if suspended for current shift
- Gray "Огляд не проводився" otherwise

**Step 2: Exam form** (shown after driver selected)

All fields optional except `result`:

| Field | Control |
|---|---|
| Артеріальний тиск | Two inline number inputs: `sys` / `dia` мм рт.ст. |
| Пульс | Number input, уд/хв |
| Алкотест | Number input, мг/л (step 0.01) |
| Тест на наркотики | Checkbox "Проводився" → if checked: radio Негативний / Позитивний |
| Скарги / загальний стан | Textarea |

**Step 3: Result buttons**

Two large full-width buttons:
- **✓ Допустити** — primary blue (`#003A5D`)
- **✗ Відсторонити** — accent red (`#BC6261`)

Clicking "Відсторонити" → inline text input "Причина відсторонення *" appears above the buttons. Save blocked until reason is filled.

On save: calls `Backend.exams.save(exam)`, resets form, shows success toast ("Допущений" / "Відсторонений" + driver name).

### Журнал tab

List of all exams for today (current calendar date), sorted newest first.

Each card: driver name + shift badge + result badge (green/red) + time. No pagination needed.

Empty state: "Сьогодні оглядів не проводилось".

---

## DriverApp Changes (`components/DriverApp.tsx`)

In `HomeView`, before rendering the "Відкрити зміну" button, check `Backend.exams.getActiveClearance(user.id, currentShift, today)`.

**Cleared** → button renders normally (existing behaviour).

**No clearance** → button replaced with warning block:
```
🔒 Медичний огляд не пройдено
Зверніться до медичного працівника для проходження
передрейсового огляду перед початком зміни.
```
Style: yellow warning block (`#FFFBEB` bg, `#FCD34D` border), same layout as the active-shift block.

**Suspended** (exam exists with `result: 'suspended'` for current shift) → red block with suspension reason.

In `OpenShiftView.handleSubmit`: look up active clearance and attach `examId` to the new `Waybill`.

---

## WaybillList Changes (`components/WaybillList.tsx`)

In the table row, add a small checkmark icon (✓) in the driver column if `wb.examId` is set, with `title="Медогляд пройдено"` tooltip. No new column — just an inline indicator.

---

## Auth & Routing

### `App.tsx`
```
role === 'driver' → DriverApp
role === 'medic'  → MedicApp   ← new
else              → ManagerApp
```

### `mockData.ts`
```ts
{ id: 'u10', fullName: 'Петренко Галина Іванівна',
  login: 'petrenkomd', password: 'med123', role: 'medic' }
```

### `LoginPage.tsx`
Add medic to demo quick-login list.

---

## What This Does NOT Include

- Medic access to ManagerApp or waybill list
- Historical exam reports / export
- Push notifications to driver when cleared
- Drug test integration with external devices
