# Logist & Dispatcher Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add narad planning (logist), today-view with driver substitution (dispatcher), multiple tech operations per waybill, and Excel export.

**Architecture:** Extend `WaybillStatus` with `'planned'` — planned waybills are the narad entity. New components `AssignmentsView` and `TodayView` are self-contained (manage own state via Backend, like `VehiclesView`). `ManagerApp` gets a `getNav(role)` function for role-gated sidebar. `DriverApp.HomeView` detects a planned waybill and shows a confirm block. `ExportModal` uses SheetJS for client-side xlsx.

**Tech Stack:** React 19, TypeScript, Tailwind v4, localStorage backend, SheetJS (`xlsx`) for export.

---

## File Map

| File | Action | What changes |
|---|---|---|
| `package.json` | modify | add `xlsx` dependency |
| `types.ts` | modify | `WaybillStatus += 'planned'`; `Waybill += additionalTechOps`; `ManagerView += 'assignments'\|'today'` |
| `services/backend.ts` | modify | add `getPlanned`, `getPlannedForDriver`, `getTodayAssignments`, `confirm` to `Backend.waybills` |
| `components/icons.tsx` | modify | add `CalendarIcon`, `ClipboardListIcon` |
| `components/ManagerApp.tsx` | modify | `getNav(role)` function; import + render `AssignmentsView`, `TodayView`; default view per role |
| `components/AssignmentsView.tsx` | create | logist narad table + `AssignmentModal` (create/edit/delete planned waybills) |
| `components/TodayView.tsx` | create | dispatcher today table with exam badges + `SubstituteDriverModal` |
| `components/DriverApp.tsx` | modify | `HomeView` planned-waybill block; `handleConfirmAssignment`; `CloseShiftView` additional tech ops |
| `components/CreateWaybillModal.tsx` | modify | additional tech ops in closing section |
| `components/WaybillList.tsx` | modify | exclude `'planned'`; additional tech ops display; `EditModal` additional ops; export button |
| `components/ExportModal.tsx` | create | date range + status checkboxes + xlsx download |

---

## Task 1: Install xlsx

**Files:** `package.json`

- [ ] **Install dependency**

```bash
cd "C:\Users\djmik\Downloads\mhp-waybill-system"
npm install xlsx
```

Expected output: `added 1 package` (or similar). No errors.

- [ ] **Verify build still passes**

```bash
npx vite build 2>&1 | tail -3
```

Expected: `✓ built in`

---

## Task 2: Update `types.ts`

**Files:** `types.ts`

- [ ] **Add `'planned'` to WaybillStatus**

In `types.ts`, replace:
```ts
export type WaybillStatus = 'open' | 'closed' | 'approved';
```
With:
```ts
export type WaybillStatus = 'open' | 'closed' | 'approved' | 'planned';
```

- [ ] **Add `additionalTechOps` to Waybill**

After the line `examId?: string;` in the `Waybill` interface, add:
```ts
additionalTechOps?: { id: string; name: string }[];
```

- [ ] **Extend ManagerView**

Replace:
```ts
export type ManagerView = 'dashboard' | 'waybills' | 'vehicles' | 'users';
```
With:
```ts
export type ManagerView = 'dashboard' | 'waybills' | 'vehicles' | 'users' | 'assignments' | 'today';
```

- [ ] **Verify build**

```bash
cd "C:\Users\djmik\Downloads\mhp-waybill-system" && npx vite build 2>&1 | tail -3
```

Expected: `✓ built in`

- [ ] **Commit**

```bash
git add types.ts
git commit -m "feat: extend WaybillStatus with planned, add additionalTechOps, expand ManagerView"
```

---

## Task 3: Add backend methods

**Files:** `services/backend.ts`

- [ ] **Add four methods to `Backend.waybills`**

In `services/backend.ts`, inside the `waybills:` object, after the `delete(id)` method (after the closing `},` of `delete`), add:

```ts
    getPlanned(date: Date): Waybill[] {
      const dateStr = date.toDateString();
      return Backend.waybills.getAll().filter(w =>
        w.status === 'planned' &&
        new Date(w.openTime).toDateString() === dateStr
      );
    },
    getPlannedForDriver(driverId: string, shift: string, date: Date): Waybill | null {
      const dateStr = date.toDateString();
      return Backend.waybills.getAll().find(w =>
        w.driverId === driverId &&
        w.shift === shift &&
        w.status === 'planned' &&
        new Date(w.openTime).toDateString() === dateStr
      ) || null;
    },
    getTodayAssignments(): Waybill[] {
      const dateStr = new Date().toDateString();
      return Backend.waybills.getAll().filter(w =>
        (w.status === 'planned' || w.status === 'open') &&
        new Date(w.openTime).toDateString() === dateStr
      );
    },
    confirm(waybillId: string, actualOpenTime: string, odometerStart: number, examId?: string) {
      const all = Backend.waybills.getAll();
      const wb = all.find(w => w.id === waybillId);
      if (!wb) return;
      wb.status = 'open';
      wb.openTime = actualOpenTime;
      wb.odometerStart = odometerStart;
      if (examId) wb.examId = examId;
      saveWaybills(all);
    },
```

- [ ] **Verify build**

```bash
cd "C:\Users\djmik\Downloads\mhp-waybill-system" && npx vite build 2>&1 | tail -3
```

- [ ] **Commit**

```bash
git add services/backend.ts
git commit -m "feat: add getPlanned, getPlannedForDriver, getTodayAssignments, confirm to Backend.waybills"
```

---

## Task 4: Add icons

**Files:** `components/icons.tsx`

- [ ] **Append `CalendarIcon` and `ClipboardListIcon` at the end of `icons.tsx`**

```ts
export const CalendarIcon = (p: P) => (
  <svg {...p} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <rect x="3" y="4" width="18" height="18" rx="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 2v4M8 2v4M3 10h18"/>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/>
  </svg>
);

export const ClipboardListIcon = (p: P) => (
  <svg {...p} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
    <rect x="9" y="3" width="6" height="4" rx="1" strokeLinecap="round" strokeLinejoin="round"/>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6M9 16h4"/>
  </svg>
);
```

- [ ] **Verify build**

```bash
cd "C:\Users\djmik\Downloads\mhp-waybill-system" && npx vite build 2>&1 | tail -3
```

- [ ] **Commit**

```bash
git add components/icons.tsx
git commit -m "feat: add CalendarIcon and ClipboardListIcon"
```

---

## Task 5: Update `ManagerApp.tsx`

**Files:** `components/ManagerApp.tsx`

- [ ] **Replace import line and static NAV with role-gated `getNav` function**

Replace:
```ts
import { ListIcon, BusIcon, UserIcon, LogoutIcon, MenuIcon, ChartIcon } from './icons';
```
With:
```ts
import { ListIcon, BusIcon, UserIcon, LogoutIcon, MenuIcon, ChartIcon, CalendarIcon, ClipboardListIcon } from './icons';
import AssignmentsView from './AssignmentsView';
import TodayView from './TodayView';
```

Replace the entire `const NAV = [...]` block with:
```ts
function getNav(role: string): { v: ManagerView; Icon: React.FC<any>; label: string }[] {
  const all: { v: ManagerView; Icon: React.FC<any>; label: string }[] = [
    { v: 'dashboard',   Icon: ChartIcon,         label: 'Дашборд' },
    { v: 'assignments', Icon: CalendarIcon,       label: 'Наряди' },
    { v: 'today',       Icon: ClipboardListIcon,  label: 'На сьогодні' },
    { v: 'waybills',    Icon: ListIcon,           label: 'ШЛ' },
    { v: 'vehicles',    Icon: BusIcon,            label: 'ТЗ' },
    { v: 'users',       Icon: UserIcon,           label: 'Водії' },
  ];
  const roleViews: Record<string, ManagerView[]> = {
    logist:     ['dashboard', 'assignments', 'waybills', 'vehicles', 'users'],
    dispatcher: ['dashboard', 'today', 'waybills', 'vehicles', 'users'],
    admin:      ['dashboard', 'assignments', 'today', 'waybills', 'vehicles', 'users'],
    mechanic:   ['dashboard', 'waybills', 'vehicles'],
  };
  const allowed = roleViews[role] ?? ['dashboard', 'waybills', 'vehicles', 'users'];
  return all.filter(n => allowed.includes(n.v));
}
```

- [ ] **Update `useState` default view and sidebar nav render**

Replace:
```ts
  const [view, setView] = useState<ManagerView>('dashboard');
```
With:
```ts
  const defaultView: ManagerView =
    user.role === 'logist' ? 'assignments' :
    user.role === 'dispatcher' ? 'today' :
    'dashboard';
  const [view, setView] = useState<ManagerView>(defaultView);
```

Replace inside the `<nav>` element:
```tsx
          {NAV.map(({ v, Icon, label }) => (
```
With:
```tsx
          {getNav(user.role).map(({ v, Icon, label }) => (
```

- [ ] **Fix header title lookup**

Replace:
```tsx
          <h2 className="font-semibold text-gray-800">
            {NAV.find(n => n.v === view)?.label}
          </h2>
```
With:
```tsx
          <h2 className="font-semibold text-gray-800">
            {getNav(user.role).find(n => n.v === view)?.label ?? view}
          </h2>
```

- [ ] **Add render cases for new views**

Replace:
```tsx
          {view === 'users' && <DriversView />}
```
With:
```tsx
          {view === 'users' && <DriversView />}
          {view === 'assignments' && <AssignmentsView />}
          {view === 'today' && <TodayView />}
```

- [ ] **Verify build**

```bash
cd "C:\Users\djmik\Downloads\mhp-waybill-system" && npx vite build 2>&1 | tail -3
```

Note: build will fail until `AssignmentsView.tsx` and `TodayView.tsx` exist. Proceed to Task 6.

---

## Task 6: Create `AssignmentsView.tsx`

**Files:** `components/AssignmentsView.tsx` (new)

- [ ] **Create the file**

```tsx
import React, { useState, useEffect } from 'react';
import { Waybill } from '../types';
import { Backend, uid } from '../services/backend';
import { MOCK_TECH_OPERATIONS } from '../mockData';
import { Modal, Field, ModalActions, ConfirmModal, inputCls } from './VehiclesView';
import { PlusIcon, EditIcon, XIcon } from './icons';

const SHIFT_CENTERS: Record<string, string> = {
  I: 'T08:00:00', II: 'T17:00:00', III: 'T20:00:00', actual: 'T00:00:00',
};

const SHIFT_LABELS: Record<string, string> = {
  I: 'I зміна', II: 'II зміна', III: 'III зміна', actual: 'Факт.',
};

function toDateInput(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function MedBadge({ driverId, shift, dateStr }: { driverId: string; shift: string; dateStr: string }) {
  const date = new Date(`${dateStr}T12:00:00`);
  const exam = Backend.exams.getShiftExam(driverId, shift, date);
  if (!exam) return <span className="text-xs text-gray-400">—</span>;
  if (exam.result === 'cleared')
    return <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ color: '#166534', background: '#DCFCE7' }}>🟢 Допущений</span>;
  return <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ color: '#991B1B', background: '#FEE2E2' }}>🔴 Відсторонений</span>;
}

function AssignmentModal({ onSave, onClose, initial, selectedDate }: {
  onSave: (wb: Waybill) => void;
  onClose: () => void;
  initial?: Waybill;
  selectedDate: string;
}) {
  const drivers = Backend.users.getDrivers();
  const vehicles = Backend.vehicles.getAll();
  const today = toDateInput(new Date());

  const [driverId, setDriverId]   = useState(initial?.driverId ?? '');
  const [vehicleId, setVehicleId] = useState(initial?.vehicleId ?? '');
  const [shift, setShift]         = useState<string>(initial?.shift ?? 'I');
  const [date, setDate]           = useState(initial ? initial.openTime.slice(0, 10) : selectedDate);
  const [error, setError]         = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!driverId)  { setError('Оберіть водія'); return; }
    if (!vehicleId) { setError('Оберіть транспортний засіб'); return; }
    const driver  = drivers.find(d => d.id === driverId)!;
    const vehicle = vehicles.find(v => v.id === vehicleId)!;
    const wb: Waybill = {
      id:            initial?.id ?? uid(),
      driverId:      driver.id,
      driverName:    driver.fullName,
      vehicleId:     vehicle.id,
      vehicleNumber: vehicle.number,
      shift:         shift as any,
      openTime:      `${date}${SHIFT_CENTERS[shift] ?? 'T08:00:00'}`,
      odometerStart: 0,
      status:        'planned',
      isApprentice:  !!driver.isApprentice,
      createdAt:     initial?.createdAt ?? new Date().toISOString(),
    };
    onSave(wb);
  };

  return (
    <Modal title={initial ? 'Редагувати наряд' : 'Додати наряд'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Водій *">
          <select className={inputCls} value={driverId}
            onChange={e => { setDriverId(e.target.value); setError(''); }}>
            <option value="">— Оберіть водія —</option>
            {drivers.map(d => (
              <option key={d.id} value={d.id}>{d.fullName}{d.isApprentice ? ' (стажер)' : ''}</option>
            ))}
          </select>
        </Field>
        <Field label="Транспортний засіб *">
          <select className={inputCls} value={vehicleId}
            onChange={e => { setVehicleId(e.target.value); setError(''); }}>
            <option value="">— Оберіть ТЗ —</option>
            <optgroup label="Основні">
              {vehicles.filter(v => v.type === 'regular').map(v => (
                <option key={v.id} value={v.id}>{v.number} · {v.model}</option>
              ))}
            </optgroup>
            <optgroup label="Резервні">
              {vehicles.filter(v => v.type === 'reserve').map(v => (
                <option key={v.id} value={v.id}>{v.number} · {v.model}</option>
              ))}
            </optgroup>
          </select>
        </Field>
        <Field label="Зміна *">
          <div className="flex gap-4 flex-wrap mt-1">
            {(['I', 'II', 'III', 'actual'] as const).map(s => (
              <label key={s} className="flex items-center gap-1.5 cursor-pointer select-none">
                <input type="radio" name="shift" value={s} checked={shift === s}
                  onChange={() => setShift(s)} className="accent-[#003A5D]" />
                <span className="text-sm text-gray-700">{s === 'actual' ? 'Факт.' : s}</span>
              </label>
            ))}
          </div>
        </Field>
        <Field label="Дата *">
          <input type="date" className={inputCls} min={today} value={date}
            onChange={e => setDate(e.target.value)} />
        </Field>
        {error && <p className="text-sm font-medium" style={{ color: '#BC6261' }}>{error}</p>}
        <ModalActions onClose={onClose} label={initial ? 'Зберегти' : 'Додати наряд'} />
      </form>
    </Modal>
  );
}

export default function AssignmentsView() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [selectedDate, setSelectedDate] = useState(toDateInput(tomorrow));
  const [assignments, setAssignments]   = useState<Waybill[]>([]);
  const [showCreate, setShowCreate]     = useState(false);
  const [editing, setEditing]           = useState<Waybill | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Waybill | null>(null);

  const today = toDateInput(new Date());

  const load = () => {
    const date = new Date(`${selectedDate}T12:00:00`);
    setAssignments(Backend.waybills.getPlanned(date));
  };

  useEffect(() => { load(); }, [selectedDate]);

  const handleSave = (wb: Waybill) => {
    Backend.waybills.save(wb);
    load();
    setShowCreate(false);
    setEditing(null);
  };

  const handleDelete = (wb: Waybill) => {
    Backend.waybills.delete(wb.id);
    load();
    setDeleteTarget(null);
  };

  return (
    <div className="p-6 space-y-4 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Наряди</h1>
          <p className="text-sm text-gray-500 mt-0.5">{assignments.length} наряд(ів) на обрану дату</p>
        </div>
        <div className="flex items-center gap-3">
          <input type="date" value={selectedDate} min={today}
            onChange={e => setSelectedDate(e.target.value)}
            className="px-3 py-2 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-[#003A5D]/20 bg-surface text-gray-700" />
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity"
            style={{ background: '#003A5D' }}>
            <PlusIcon className="w-4 h-4" /> Додати наряд
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface">
                {['Водій', 'ТЗ', 'Зміна', 'Дата', 'Медогляд', 'Стан', ''].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {assignments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-gray-400 text-sm">
                    Нарядів на{' '}
                    {new Date(`${selectedDate}T12:00:00`).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long' })}
                    {' '}немає
                  </td>
                </tr>
              ) : assignments.map(wb => {
                const isActive = wb.status !== 'planned';
                return (
                  <tr key={wb.id} className="hover:bg-surface transition-colors">
                    <td className="px-5 py-3">
                      <p className="font-medium text-gray-800 whitespace-nowrap">
                        {wb.driverName.split(' ').slice(0, 2).join(' ')}
                      </p>
                      {wb.isApprentice && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: '#FAF0EF', color: '#BC6261' }}>стажер</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-gray-600 whitespace-nowrap">{wb.vehicleNumber}</td>
                    <td className="px-5 py-3 text-gray-600 whitespace-nowrap">{SHIFT_LABELS[wb.shift] ?? wb.shift}</td>
                    <td className="px-5 py-3 text-gray-600 whitespace-nowrap">
                      {new Date(`${selectedDate}T12:00:00`).toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit' })}
                    </td>
                    <td className="px-5 py-3">
                      <MedBadge driverId={wb.driverId} shift={wb.shift} dateStr={selectedDate} />
                    </td>
                    <td className="px-5 py-3">
                      {isActive
                        ? <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: '#DCFCE7', color: '#166534' }}>На зміні</span>
                        : <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: '#E6EEF4', color: '#003A5D' }}>Очікує</span>
                      }
                    </td>
                    <td className="px-5 py-3">
                      {!isActive && (
                        <div className="flex items-center gap-1 justify-end">
                          <button onClick={() => setEditing(wb)}
                            className="p-1.5 rounded-lg text-gray-400 hover:bg-primary-light hover:text-primary transition-colors focus:outline-none" title="Редагувати">
                            <EditIcon className="w-4 h-4" />
                          </button>
                          <button onClick={() => setDeleteTarget(wb)}
                            className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors focus:outline-none" title="Видалити">
                            <XIcon className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showCreate && (
        <AssignmentModal selectedDate={selectedDate} onSave={handleSave} onClose={() => setShowCreate(false)} />
      )}
      {editing && (
        <AssignmentModal initial={editing} selectedDate={selectedDate} onSave={handleSave} onClose={() => setEditing(null)} />
      )}
      {deleteTarget && (
        <ConfirmModal
          message={`Видалити наряд для ${deleteTarget.driverName.split(' ').slice(0, 2).join(' ')} (${deleteTarget.vehicleNumber})?`}
          onConfirm={() => handleDelete(deleteTarget)}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
```

- [ ] **Verify build (together with Task 5 — TodayView still missing)**

Proceed directly to Task 7.

---

## Task 7: Create `TodayView.tsx`

**Files:** `components/TodayView.tsx` (new)

- [ ] **Create the file**

```tsx
import React, { useState, useEffect } from 'react';
import { Waybill } from '../types';
import { Backend } from '../services/backend';
import { Modal, Field, ModalActions, inputCls } from './VehiclesView';

const SHIFT_LABELS: Record<string, string> = {
  I: 'I зміна', II: 'II зміна', III: 'III зміна', actual: 'Факт.',
};

type MedStatus = 'cleared' | 'suspended' | 'not_done';

function getMedStatus(driverId: string, shift: string, date: Date): MedStatus {
  const exam = Backend.exams.getShiftExam(driverId, shift, date);
  if (!exam) return 'not_done';
  return exam.result;
}

const MED_BADGE: Record<MedStatus, { label: string; color: string; bg: string }> = {
  cleared:   { label: '🟢 Допущений',     color: '#166534', bg: '#DCFCE7' },
  suspended: { label: '🔴 Відсторонений', color: '#991B1B', bg: '#FEE2E2' },
  not_done:  { label: '🟡 Не проходив',   color: '#92600A', bg: '#FEF3C7' },
};

function SubstituteDriverModal({ waybill, onSave, onClose }: {
  waybill: Waybill;
  onSave: (newDriverId: string, newDriverName: string) => void;
  onClose: () => void;
}) {
  const today = new Date();
  const drivers = Backend.users.getDrivers();
  const [driverId, setDriverId] = useState('');
  const [error, setError]       = useState('');

  const suspendedIds = new Set(
    drivers
      .filter(d => Backend.exams.getShiftExam(d.id, waybill.shift, today)?.result === 'suspended')
      .map(d => d.id)
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!driverId) { setError('Оберіть водія'); return; }
    const driver = drivers.find(d => d.id === driverId)!;
    onSave(driverId, driver.fullName);
  };

  return (
    <Modal title="Замінити водія" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-gray-500">
          Поточний водій:{' '}
          <span className="font-medium text-gray-700">
            {waybill.driverName.split(' ').slice(0, 2).join(' ')}
          </span>
        </p>
        <Field label="Новий водій *">
          <select className={inputCls} value={driverId}
            onChange={e => { setDriverId(e.target.value); setError(''); }}>
            <option value="">— Оберіть водія —</option>
            {drivers
              .filter(d => d.id !== waybill.driverId)
              .map(d => (
                <option key={d.id} value={d.id}>
                  {d.fullName}
                  {d.isApprentice ? ' (стажер)' : ''}
                  {suspendedIds.has(d.id) ? ' ⚠ відсторонений' : ''}
                </option>
              ))}
          </select>
        </Field>
        {error && <p className="text-sm font-medium" style={{ color: '#BC6261' }}>{error}</p>}
        <ModalActions onClose={onClose} label="Замінити" />
      </form>
    </Modal>
  );
}

export default function TodayView() {
  const [assignments, setAssignments] = useState<Waybill[]>([]);
  const [substituting, setSubstituting] = useState<Waybill | null>(null);
  const [toast, setToast] = useState('');
  const today = new Date();

  const load = () => setAssignments(Backend.waybills.getTodayAssignments());

  useEffect(() => { load(); }, []);

  const handleSubstitute = (wb: Waybill, newDriverId: string, newDriverName: string) => {
    const prevName = wb.driverName.split(' ')[0];
    Backend.waybills.save({ ...wb, driverId: newDriverId, driverName: newDriverName });
    load();
    setSubstituting(null);
    const newFirst = newDriverName.split(' ')[0];
    setToast(`Водія замінено: ${prevName} → ${newFirst}`);
    setTimeout(() => setToast(''), 3000);
  };

  return (
    <div className="p-6 space-y-4 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">На сьогодні</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {today.toLocaleDateString('uk-UA', { weekday: 'long', day: 'numeric', month: 'long' })}
          {' · '}{assignments.length} наряд(ів)
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface">
                {['Водій', 'ТЗ', 'Зміна', 'Медогляд', 'Стан наряду', 'Дія'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {assignments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-gray-400 text-sm">
                    Нарядів на сьогодні немає
                  </td>
                </tr>
              ) : assignments.map(wb => {
                const medStatus  = getMedStatus(wb.driverId, wb.shift, today);
                const badge      = MED_BADGE[medStatus];
                const canSubstitute = wb.status === 'planned' && medStatus !== 'cleared';

                return (
                  <tr key={wb.id} className="hover:bg-surface transition-colors">
                    <td className="px-5 py-3">
                      <p className="font-medium text-gray-800 whitespace-nowrap">
                        {wb.driverName.split(' ').slice(0, 2).join(' ')}
                      </p>
                      {wb.isApprentice && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: '#FAF0EF', color: '#BC6261' }}>стажер</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-gray-600 whitespace-nowrap">{wb.vehicleNumber}</td>
                    <td className="px-5 py-3 text-gray-600 whitespace-nowrap">{SHIFT_LABELS[wb.shift] ?? wb.shift}</td>
                    <td className="px-5 py-3">
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold"
                        style={{ color: badge.color, background: badge.bg }}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      {wb.status === 'planned'
                        ? <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: '#E6EEF4', color: '#003A5D' }}>Очікує</span>
                        : <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: '#DCFCE7', color: '#166534' }}>На зміні</span>
                      }
                    </td>
                    <td className="px-5 py-3">
                      {canSubstitute && (
                        <button
                          onClick={() => setSubstituting(wb)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors hover:opacity-90 focus:outline-none"
                          style={{ background: '#E6EEF4', color: '#003A5D' }}>
                          Замінити водія
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {substituting && (
        <SubstituteDriverModal
          waybill={substituting}
          onSave={(id, name) => handleSubstitute(substituting, id, name)}
          onClose={() => setSubstituting(null)}
        />
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 bg-gray-800 text-white text-sm font-medium px-4 py-3 rounded-xl shadow-lg z-50">
          {toast}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Verify build (Tasks 5 + 6 + 7 together)**

```bash
cd "C:\Users\djmik\Downloads\mhp-waybill-system" && npx vite build 2>&1 | tail -5
```

Expected: `✓ built in`

- [ ] **Commit**

```bash
git add components/ManagerApp.tsx components/AssignmentsView.tsx components/TodayView.tsx
git commit -m "feat: role-gated nav, AssignmentsView (logist), TodayView with driver substitution (dispatcher)"
```

---

## Task 8: Update `DriverApp.tsx` — planned waybill block + additional tech ops in CloseShiftView

**Files:** `components/DriverApp.tsx`

### Part A — planned waybill confirmation in HomeView

- [ ] **Add `handleConfirmAssignment` to the main `DriverApp` component**

After the `refresh` function (around line 50), add:

```ts
  const handleConfirmAssignment = (wb: Waybill) => {
    const now = new Date();
    const { shift } = detectShift(now);
    const odometerStart = Backend.vehicles.getLastOdometer(wb.vehicleId);
    const clearance = Backend.exams.getActiveClearance(user.id, shift, now);
    Backend.waybills.confirm(wb.id, now.toISOString(), odometerStart, clearance?.id);
    refresh();
  };
```

- [ ] **Pass `onConfirmAssignment` to HomeView in the render**

Replace:
```tsx
          <HomeView
            user={user}
            openWaybill={openWaybill}
            vehicles={vehicles}
            waybills={waybills}
            onOpenShift={() => setView('open')}
            onCloseShift={() => setView('close')}
          />
```
With:
```tsx
          <HomeView
            user={user}
            openWaybill={openWaybill}
            vehicles={vehicles}
            waybills={waybills}
            onOpenShift={() => setView('open')}
            onCloseShift={() => setView('close')}
            onConfirmAssignment={handleConfirmAssignment}
          />
```

- [ ] **Update `HomeView` function signature and add planned waybill logic**

Replace the entire `HomeView` function signature line:
```ts
function HomeView({ user, openWaybill, vehicles, waybills, onOpenShift, onCloseShift }: {
  user: WaybillUser; openWaybill: Waybill | null; vehicles: Vehicle[];
  waybills: Waybill[]; onOpenShift: () => void; onCloseShift: () => void;
}) {
```
With:
```ts
function HomeView({ user, openWaybill, vehicles, waybills, onOpenShift, onCloseShift, onConfirmAssignment }: {
  user: WaybillUser; openWaybill: Waybill | null; vehicles: Vehicle[];
  waybills: Waybill[]; onOpenShift: () => void; onCloseShift: () => void;
  onConfirmAssignment: (wb: Waybill) => void;
}) {
```

- [ ] **Add `plannedWb` lookup after the existing `shiftExam` line**

After the line:
```ts
  const shiftExam = Backend.exams.getShiftExam(user.id, currentShift, now);
```
Add:
```ts
  const plannedWb = !openWaybill && shiftExam?.result === 'cleared'
    ? Backend.waybills.getPlannedForDriver(user.id, currentShift, now)
    : null;
```

- [ ] **Insert planned-waybill block into the conditional chain**

In HomeView, find the `} : (` before the final open-shift button:
```tsx
      ) : (
        <button
          onClick={onOpenShift}
          className="w-full py-4 text-white font-semibold rounded-2xl shadow-md flex items-center justify-center gap-3 text-base transition-opacity hover:opacity-90"
          style={{ background: '#003A5D' }}
        >
          <BusIcon className="w-6 h-6" />
          Відкрити зміну (новий ШЛ)
        </button>
      )}
```

Replace with:
```tsx
      ) : plannedWb ? (
        <div className="rounded-2xl p-4 space-y-3 border" style={{ background: '#EFF6FF', borderColor: '#BFDBFE' }}>
          <div className="flex items-center gap-2">
            <span className="text-base">📋</span>
            <span className="text-sm font-semibold" style={{ color: '#1D4ED8' }}>Ваш наряд на сьогодні</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <InfoRow label="ТЗ" value={plannedWb.vehicleNumber} />
            <InfoRow label="Зміна" value={plannedWb.shift === 'actual' ? 'Факт.' : `${plannedWb.shift} зміна`} />
            <InfoRow label="Одометр" value={`${Backend.vehicles.getLastOdometer(plannedWb.vehicleId).toLocaleString()} км`} />
          </div>
          <button
            onClick={() => onConfirmAssignment(plannedWb)}
            className="w-full py-3 text-white font-semibold rounded-xl transition-opacity hover:opacity-90 shadow-sm flex items-center justify-center gap-2"
            style={{ background: '#003A5D' }}
          >
            <CheckIcon className="w-5 h-5" />
            Підтвердити вихід на зміну
          </button>
          <button
            onClick={onOpenShift}
            className="w-full text-sm font-medium text-center py-1.5 transition-colors hover:opacity-70"
            style={{ color: '#6b7280' }}
          >
            Відкрити інший ШЛ
          </button>
        </div>
      ) : (
        <button
          onClick={onOpenShift}
          className="w-full py-4 text-white font-semibold rounded-2xl shadow-md flex items-center justify-center gap-3 text-base transition-opacity hover:opacity-90"
          style={{ background: '#003A5D' }}
        >
          <BusIcon className="w-6 h-6" />
          Відкрити зміну (новий ШЛ)
        </button>
      )}
```

### Part B — additional tech ops in `CloseShiftView`

- [ ] **Add `additionalTechOps` state to `CloseShiftView`**

Inside `CloseShiftView`, after the existing state declarations (`odometerEnd`, `techOpId`, `comment`, `error`), add:

```ts
  const [additionalTechOps, setAdditionalTechOps] = useState<{ id: string; name: string }[]>([]);

  const addExtraOp = () => {
    if (additionalTechOps.length >= 2) return;
    setAdditionalTechOps(prev => [...prev, { id: '', name: '' }]);
  };
  const updateExtraOp = (index: number, id: string) => {
    const op = MOCK_TECH_OPERATIONS.find(t => t.id === id);
    setAdditionalTechOps(prev =>
      prev.map((o, i) => i === index ? { id, name: op?.name ?? '' } : o)
    );
  };
  const removeExtraOp = (index: number) => {
    setAdditionalTechOps(prev => prev.filter((_, i) => i !== index));
  };
```

- [ ] **Include `additionalTechOps` in `handleSubmit` of `CloseShiftView`**

In `CloseShiftView.handleSubmit`, replace the `onSubmit({...})` call:
```ts
    onSubmit({
      ...waybill,
      closeTime: now.toISOString(),
      odometerEnd: end,
      techOperationId: techOpId,
      techOperationName: selectedOp?.name,
      comment: comment || undefined,
      status: 'closed',
    });
```
With:
```ts
    const filledExtra = additionalTechOps.filter(o => o.id);
    onSubmit({
      ...waybill,
      closeTime: now.toISOString(),
      odometerEnd: end,
      techOperationId: techOpId,
      techOperationName: selectedOp?.name,
      additionalTechOps: filledExtra.length > 0 ? filledExtra : undefined,
      comment: comment || undefined,
      status: 'closed',
    });
```

- [ ] **Add additional tech ops UI in `CloseShiftView` after the main tech op select**

After the closing `</div>` of the tech op field (`<label>Технологічна операція *</label>` block) and before the comment field `<div>`, insert:

```tsx
        {/* Additional tech ops */}
        {additionalTechOps.length > 0 && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-600">Додаткові операції</label>
            {additionalTechOps.map((op, i) => (
              <div key={i} className="flex gap-2">
                <select
                  value={op.id}
                  onChange={e => updateExtraOp(i, e.target.value)}
                  className="flex-1 px-3 py-2.5 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-[#003A5D]/20 bg-surface text-gray-800 text-sm"
                >
                  <option value="">— Оберіть операцію —</option>
                  {MOCK_TECH_OPERATIONS.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
                <button type="button" onClick={() => removeExtraOp(i)}
                  className="px-3 rounded-xl border border-border text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors text-lg leading-none">
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
        {additionalTechOps.length < 2 && (
          <button type="button" onClick={addExtraOp}
            className="text-sm font-medium transition-opacity hover:opacity-70"
            style={{ color: '#003A5D' }}>
            + Додати операцію
          </button>
        )}
```

- [ ] **Verify build**

```bash
cd "C:\Users\djmik\Downloads\mhp-waybill-system" && npx vite build 2>&1 | tail -3
```

- [ ] **Commit**

```bash
git add components/DriverApp.tsx
git commit -m "feat: planned waybill confirmation in DriverApp HomeView; additional tech ops in CloseShiftView"
```

---

## Task 9: Update `CreateWaybillModal.tsx` — additional tech ops

**Files:** `components/CreateWaybillModal.tsx`

- [ ] **Add `additionalTechOps` state after the existing closing-section state variables**

After the line `const [comment, setComment] = useState('');`, add:

```ts
  const [additionalTechOps, setAdditionalTechOps] = useState<{ id: string; name: string }[]>([]);

  const addExtraOp = () => {
    if (additionalTechOps.length >= 2) return;
    setAdditionalTechOps(prev => [...prev, { id: '', name: '' }]);
  };
  const updateExtraOp = (index: number, id: string) => {
    const op = MOCK_TECH_OPERATIONS.find(t => t.id === id);
    setAdditionalTechOps(prev =>
      prev.map((o, i) => i === index ? { id, name: op?.name ?? '' } : o)
    );
  };
  const removeExtraOp = (index: number) => {
    setAdditionalTechOps(prev => prev.filter((_, i) => i !== index));
  };
```

- [ ] **Include `additionalTechOps` in `handleSubmit`**

In `handleSubmit`, replace `onSave({...})`:
```ts
    onSave({
      id: uid(),
      ...
      techOperationId: techOpId || undefined,
      techOperationName: techOp?.name,
      comment: comment.trim() || undefined,
      status: closeTouched ? 'closed' : 'open',
      isApprentice: !!selectedDriver?.isApprentice,
      createdAt: openISO,
    });
```
With (add one line before `status`):
```ts
    const filledExtra = additionalTechOps.filter(o => o.id);
    onSave({
      id: uid(),
      driverId,
      driverName: selectedDriver!.fullName,
      vehicleId,
      vehicleNumber: selectedVehicle!.number,
      shift,
      openTime: openISO,
      closeTime: closeISO,
      odometerStart,
      odometerEnd: end,
      techOperationId: techOpId || undefined,
      techOperationName: techOp?.name,
      additionalTechOps: filledExtra.length > 0 ? filledExtra : undefined,
      comment: comment.trim() || undefined,
      status: closeTouched ? 'closed' : 'open',
      isApprentice: !!selectedDriver?.isApprentice,
      createdAt: openISO,
    });
```

- [ ] **Add additional tech ops UI in Section 2, after the tech op `<Field>` and before the comment `<Field>`**

```tsx
          {/* Additional tech ops */}
          {additionalTechOps.length > 0 && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-600">Додаткові операції</label>
              {additionalTechOps.map((op, i) => (
                <div key={i} className="flex gap-2">
                  <select value={op.id} onChange={e => updateExtraOp(i, e.target.value)}
                    className={inputCls + ' flex-1'}>
                    <option value="">— Оберіть операцію —</option>
                    {MOCK_TECH_OPERATIONS.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                  <button type="button" onClick={() => removeExtraOp(i)}
                    className="px-3 rounded-xl border border-border text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors text-lg leading-none">
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
          {additionalTechOps.length < 2 && (
            <button type="button" onClick={addExtraOp}
              className="text-sm font-medium transition-opacity hover:opacity-70"
              style={{ color: '#003A5D' }}>
              + Додати операцію
            </button>
          )}
```

- [ ] **Verify build**

```bash
cd "C:\Users\djmik\Downloads\mhp-waybill-system" && npx vite build 2>&1 | tail -3
```

- [ ] **Commit**

```bash
git add components/CreateWaybillModal.tsx
git commit -m "feat: additional tech ops in CreateWaybillModal closing section"
```

---

## Task 10: Update `WaybillList.tsx`

**Files:** `components/WaybillList.tsx`

### Part A — exclude `'planned'` from the filtered list

- [ ] **Add `w.status !== 'planned'` to the base filter in `useMemo`**

Replace:
```ts
    return waybills
      .filter(w => {
        const matchSearch = !search ||
```
With:
```ts
    return waybills
      .filter(w => w.status !== 'planned')
      .filter(w => {
        const matchSearch = !search ||
```

### Part B — display `additionalTechOps` in the tech op table cell

- [ ] **Expand the tech op cell**

Replace:
```tsx
                  <td className="px-5 py-3 text-gray-600 max-w-36">
                    <span className="truncate block" title={wb.techOperationName}>{wb.techOperationName || '—'}</span>
                    {wb.comment && <span className="text-xs text-gray-400 italic truncate block" title={wb.comment}>{wb.comment}</span>}
                  </td>
```
With:
```tsx
                  <td className="px-5 py-3 text-gray-600 max-w-36">
                    <span className="truncate block" title={wb.techOperationName}>{wb.techOperationName || '—'}</span>
                    {wb.additionalTechOps?.map((op, i) => (
                      <span key={i} className="truncate block text-xs text-gray-400">+ {op.name}</span>
                    ))}
                    {wb.comment && <span className="text-xs text-gray-400 italic truncate block" title={wb.comment}>{wb.comment}</span>}
                  </td>
```

### Part C — add `additionalTechOps` to `EditModal`

- [ ] **Add `additionalTechOps` state to `EditModal`**

In `EditModal`, after the existing state declarations (`techOpId`, `comment`, `status`), add:

```ts
  const [additionalTechOps, setAdditionalTechOps] = useState<{ id: string; name: string }[]>(
    waybill.additionalTechOps ?? []
  );

  const addExtraOp = () => {
    if (additionalTechOps.length >= 2) return;
    setAdditionalTechOps(prev => [...prev, { id: '', name: '' }]);
  };
  const updateExtraOp = (index: number, id: string) => {
    const op = MOCK_TECH_OPERATIONS.find(t => t.id === id);
    setAdditionalTechOps(prev =>
      prev.map((o, i) => i === index ? { id, name: op?.name ?? '' } : o)
    );
  };
  const removeExtraOp = (index: number) => {
    setAdditionalTechOps(prev => prev.filter((_, i) => i !== index));
  };
```

- [ ] **Include `additionalTechOps` in `EditModal.handleSave`**

Replace:
```ts
  const handleSave = () => {
    const op = MOCK_TECH_OPERATIONS.find(t => t.id === techOpId);
    onSave({ ...waybill, techOperationId: techOpId || undefined, techOperationName: op?.name, comment: comment || undefined, status });
  };
```
With:
```ts
  const handleSave = () => {
    const op = MOCK_TECH_OPERATIONS.find(t => t.id === techOpId);
    const filledExtra = additionalTechOps.filter(o => o.id);
    onSave({
      ...waybill,
      techOperationId: techOpId || undefined,
      techOperationName: op?.name,
      additionalTechOps: filledExtra.length > 0 ? filledExtra : undefined,
      comment: comment || undefined,
      status,
    });
  };
```

- [ ] **Add additional tech ops UI in `EditModal`, after the main tech op select and before the comment textarea**

```tsx
          {/* Additional tech ops */}
          {additionalTechOps.length > 0 && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-600 mb-1.5">Додаткові операції</label>
              {additionalTechOps.map((op, i) => (
                <div key={i} className="flex gap-2">
                  <select value={op.id} onChange={e => updateExtraOp(i, e.target.value)}
                    className="flex-1 px-3 py-2.5 rounded-xl border border-border focus:outline-none bg-surface text-sm text-gray-700">
                    <option value="">— Оберіть операцію —</option>
                    {MOCK_TECH_OPERATIONS.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                  <button type="button" onClick={() => removeExtraOp(i)}
                    className="px-3 rounded-xl border border-border text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors text-lg leading-none">
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
          {additionalTechOps.length < 2 && (
            <button type="button" onClick={addExtraOp}
              className="text-sm font-medium transition-opacity hover:opacity-70"
              style={{ color: '#003A5D' }}>
              + Додати операцію
            </button>
          )}
```

- [ ] **Verify build**

```bash
cd "C:\Users\djmik\Downloads\mhp-waybill-system" && npx vite build 2>&1 | tail -3
```

- [ ] **Commit**

```bash
git add components/WaybillList.tsx
git commit -m "feat: exclude planned from WaybillList, additional tech ops display and edit"
```

---

## Task 11: Create `ExportModal.tsx`

**Files:** `components/ExportModal.tsx` (new)

- [ ] **Create the file**

```tsx
import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { Backend, formatDate, formatTime } from '../services/backend';
import { Modal, Field, ModalActions, inputCls } from './VehiclesView';

function toDateInput(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

const STATUS_LABELS_UA: Record<string, string> = {
  open: 'Відкрито', closed: 'Закрито', approved: 'Затверджено', planned: 'Плановий',
};

const STATUS_OPTIONS = [
  { key: 'closed',   label: 'Закриті' },
  { key: 'approved', label: 'Затверджені' },
  { key: 'open',     label: 'Відкриті' },
];

export default function ExportModal({ onClose }: { onClose: () => void }) {
  const today = toDateInput(new Date());
  const [dateFrom, setDateFrom]           = useState(today);
  const [dateTo, setDateTo]               = useState(today);
  const [statuses, setStatuses]           = useState(new Set(['closed', 'approved']));
  const [error, setError]                 = useState('');

  const toggleStatus = (key: string) => {
    setStatuses(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
    setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (statuses.size === 0) { setError('Оберіть хоча б один статус'); return; }

    const all = Backend.waybills.getAll().filter(wb => {
      if (!statuses.has(wb.status)) return false;
      const d = wb.openTime.slice(0, 10);
      return d >= dateFrom && d <= dateTo;
    });

    if (all.length === 0) { setError('Шляхових листів за вказаний період не знайдено'); return; }

    const rows = all
      .sort((a, b) => a.openTime.localeCompare(b.openTime))
      .map((wb, i) => ({
        '№':              i + 1,
        'Дата':           formatDate(wb.openTime),
        'Водій':          wb.driverName,
        'ТЗ':             wb.vehicleNumber,
        'Зміна':          wb.shift === 'actual' ? 'Факт.' : `${wb.shift} зміна`,
        'Відкрито':       formatTime(wb.openTime),
        'Закрито':        wb.closeTime ? formatTime(wb.closeTime) : '—',
        'Одом. поч.':     wb.odometerStart,
        'Одом. кін.':     wb.odometerEnd ?? '—',
        'Пробіг км':      wb.odometerEnd != null ? wb.odometerEnd - wb.odometerStart : '—',
        'Тех. операція':  wb.techOperationName || '—',
        'Доп. операції':  wb.additionalTechOps?.map(o => o.name).join(', ') || '—',
        'Коментар':       wb.comment || '—',
        'Статус':         STATUS_LABELS_UA[wb.status] ?? wb.status,
        'Медогляд':       wb.examId ? 'Так' : 'Ні',
      }));

    const ws       = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, ws, 'Шляхові листи');
    const fromStr = dateFrom.split('-').reverse().join('.');
    const toStr   = dateTo.split('-').reverse().join('.');
    XLSX.writeFile(workbook, `waybills_${fromStr}-${toStr}.xlsx`);
    onClose();
  };

  return (
    <Modal title="Вивантаження шляхових листів" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Від">
            <input type="date" className={inputCls} value={dateFrom} max={dateTo}
              onChange={e => { setDateFrom(e.target.value); setError(''); }} />
          </Field>
          <Field label="До">
            <input type="date" className={inputCls} value={dateTo} min={dateFrom}
              onChange={e => { setDateTo(e.target.value); setError(''); }} />
          </Field>
        </div>
        <Field label="Статуси">
          <div className="flex flex-wrap gap-4 pt-1">
            {STATUS_OPTIONS.map(({ key, label }) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={statuses.has(key)}
                  onChange={() => toggleStatus(key)}
                  className="accent-[#003A5D] w-4 h-4" />
                <span className="text-sm text-gray-700">{label}</span>
              </label>
            ))}
          </div>
        </Field>
        {error && <p className="text-sm font-medium" style={{ color: '#BC6261' }}>{error}</p>}
        <ModalActions onClose={onClose} label="⬇ Завантажити Excel" />
      </form>
    </Modal>
  );
}
```

---

## Task 12: Wire `ExportModal` into `WaybillList.tsx`

**Files:** `components/WaybillList.tsx`

- [ ] **Add import**

At the top of `WaybillList.tsx`, after the existing imports, add:
```ts
import ExportModal from './ExportModal';
```

- [ ] **Add `showExport` state**

In the `WaybillList` component, after the existing state declarations, add:
```ts
  const [showExport, setShowExport] = useState(false);
```

- [ ] **Add "Вивантажити ШЛ" button in the header**

Replace:
```tsx
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 text-white text-sm font-semibold rounded-xl transition-opacity hover:opacity-90 focus:outline-none"
          style={{ background: '#003A5D' }}
        >
          <PlusIcon className="w-4 h-4" /> Додати ШЛ
        </button>
```
With:
```tsx
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowExport(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl border border-border hover:bg-surface transition-colors focus:outline-none text-gray-600"
          >
            ⬇ Вивантажити ШЛ
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 text-white text-sm font-semibold rounded-xl transition-opacity hover:opacity-90 focus:outline-none"
            style={{ background: '#003A5D' }}
          >
            <PlusIcon className="w-4 h-4" /> Додати ШЛ
          </button>
        </div>
```

- [ ] **Render `ExportModal`**

Before the closing `</div>` of the component (after the `{editingWb && ...}` block), add:
```tsx
      {showExport && (
        <ExportModal onClose={() => setShowExport(false)} />
      )}
```

- [ ] **Verify build**

```bash
cd "C:\Users\djmik\Downloads\mhp-waybill-system" && npx vite build 2>&1 | tail -3
```

Expected: `✓ built in`

- [ ] **Commit**

```bash
git add components/ExportModal.tsx components/WaybillList.tsx
git commit -m "feat: ExportModal with xlsx date-range export wired into WaybillList"
```

---

## Task 13: Final build verification + push

- [ ] **Full clean build**

```bash
cd "C:\Users\djmik\Downloads\mhp-waybill-system" && npx vite build 2>&1
```

Expected: `✓ built in` with no TypeScript errors. The chunk size warning (`> 500 kB`) is pre-existing and acceptable.

- [ ] **Push to GitHub**

```bash
git push origin master
```

Expected: all commits reach `yurimykolyshyn/mhp-waybill-system`.

---

## Self-Review Checklist

| Spec requirement | Task |
|---|---|
| `WaybillStatus += 'planned'` | Task 2 |
| `Waybill.additionalTechOps` field | Task 2 |
| `ManagerView += 'assignments'\|'today'` | Task 2 |
| `Backend.waybills.getPlanned()` | Task 3 |
| `Backend.waybills.getPlannedForDriver()` | Task 3 |
| `Backend.waybills.getTodayAssignments()` | Task 3 |
| `Backend.waybills.confirm()` | Task 3 |
| `CalendarIcon`, `ClipboardListIcon` | Task 4 |
| Role-gated `getNav(role)` | Task 5 |
| `AssignmentsView` renders in ManagerApp | Task 5 |
| `TodayView` renders in ManagerApp | Task 5 |
| Default view: logist→assignments, dispatcher→today | Task 5 |
| `AssignmentsView` with date selector, create/edit/delete | Task 6 |
| `AssignmentModal` saves `status:'planned'` waybill | Task 6 |
| `TodayView` shows today's planned+open with med badges | Task 7 |
| `SubstituteDriverModal` updates driverId on planned waybill | Task 7 |
| DriverApp `handleConfirmAssignment` | Task 8 |
| DriverApp `HomeView` planned-waybill block + confirm button | Task 8 |
| DriverApp `CloseShiftView` additional tech ops | Task 8 |
| `CreateWaybillModal` additional tech ops | Task 9 |
| `WaybillList` excludes `'planned'` | Task 10 |
| `WaybillList` additional tech ops display (rows below) | Task 10 |
| `EditModal` additional tech ops | Task 10 |
| `ExportModal` with date range + status checkboxes | Task 11 |
| `ExportModal` xlsx download via SheetJS | Task 11 |
| "Вивантажити ШЛ" button in WaybillList header | Task 12 |

All spec requirements covered. No placeholders. Method names consistent across all tasks (`getPlanned`, `getPlannedForDriver`, `getTodayAssignments`, `confirm`, `additionalTechOps`, `addExtraOp`, `updateExtraOp`, `removeExtraOp`).
