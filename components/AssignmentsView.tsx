import React, { useState, useEffect } from 'react';
import { Waybill } from '../types';
import { Backend, uid } from '../services/backend';
import { MOCK_TECH_OPERATIONS } from '../mockData';
import { Modal, Field, ModalActions, ConfirmModal, inputCls } from './VehiclesView';
import { PlusIcon, EditIcon, XIcon } from './icons';

const SHIFT_CENTERS: Record<string, string> = {
  I: 'T08:00:00', II: 'T17:00:00', III: 'T20:00:00', actual: 'T08:00:00',
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
