import React, { useState } from 'react';
import { Vehicle } from '../types';
import { Backend, uid } from '../services/backend';
import { PlusIcon, EditIcon, XIcon } from './icons';

const EMPTY: Omit<Vehicle, 'id'> = { number: '', model: '', type: 'regular', lastOdometer: 0 };

export default function VehiclesView() {
  const [vehicles, setVehicles] = useState<Vehicle[]>(() => Backend.vehicles.getAll());
  const [editing, setEditing] = useState<Vehicle | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Vehicle | null>(null);

  const openNew = () => { setEditing({ id: uid(), ...EMPTY }); setIsNew(true); };
  const openEdit = (v: Vehicle) => { setEditing({ ...v }); setIsNew(false); };

  const handleSave = (v: Vehicle) => {
    Backend.vehicles.save(v);
    setVehicles(Backend.vehicles.getAll());
    setEditing(null);
  };

  const handleDelete = (v: Vehicle) => {
    Backend.vehicles.delete(v.id);
    setVehicles(Backend.vehicles.getAll());
    setDeleteTarget(null);
  };

  return (
    <div className="p-6 max-w-4xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Транспортні засоби</h1>
          <p className="text-sm text-gray-500 mt-0.5">{vehicles.length} одиниць</p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2 text-white text-sm font-semibold rounded-xl transition-opacity hover:opacity-90"
          style={{ background: '#003A5D' }}
        >
          <PlusIcon className="w-4 h-4" /> Додати ТЗ
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface">
              {['Номер', 'Модель', 'Тип', 'Одометр', ''].map(h => (
                <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {vehicles.length === 0 && (
              <tr><td colSpan={5} className="px-5 py-10 text-center text-gray-400">Немає транспортних засобів</td></tr>
            )}
            {vehicles.map(v => (
              <tr key={v.id} className="hover:bg-surface transition-colors">
                <td className="px-5 py-3 font-semibold text-gray-800">{v.number}</td>
                <td className="px-5 py-3 text-gray-600">{v.model}</td>
                <td className="px-5 py-3">
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold"
                    style={v.type === 'regular'
                      ? { background: '#E6EEF4', color: '#003A5D' }
                      : { background: '#FAF0EF', color: '#BC6261' }}>
                    {v.type === 'regular' ? 'Основний' : 'Резервний'}
                  </span>
                </td>
                <td className="px-5 py-3 text-gray-600">{v.lastOdometer.toLocaleString()} км</td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-1 justify-end">
                    <button onClick={() => openEdit(v)}
                      className="p-1.5 rounded-lg text-gray-400 hover:bg-primary-light hover:text-primary transition-colors" title="Редагувати">
                      <EditIcon className="w-4 h-4" />
                    </button>
                    <button onClick={() => setDeleteTarget(v)}
                      className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors" title="Видалити">
                      <XIcon className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit / Create modal */}
      {editing && (
        <VehicleModal
          vehicle={editing}
          isNew={isNew}
          onSave={handleSave}
          onClose={() => setEditing(null)}
        />
      )}

      {/* Delete confirm */}
      {deleteTarget && (
        <ConfirmModal
          message={`Видалити ${deleteTarget.number} (${deleteTarget.model})?`}
          onConfirm={() => handleDelete(deleteTarget)}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}

function VehicleModal({ vehicle, isNew, onSave, onClose }: {
  vehicle: Vehicle; isNew: boolean;
  onSave: (v: Vehicle) => void; onClose: () => void;
}) {
  const [form, setForm] = useState<Vehicle>({ ...vehicle });
  const [error, setError] = useState('');

  const set = (k: keyof Vehicle, val: any) => setForm(f => ({ ...f, [k]: val }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.number.trim()) { setError('Вкажіть номер ТЗ'); return; }
    if (!form.model.trim())  { setError('Вкажіть модель');   return; }
    if (form.lastOdometer < 0) { setError('Одометр не може бути від\'ємним'); return; }
    onSave(form);
  };

  return (
    <Modal title={isNew ? 'Новий транспортний засіб' : `Редагувати ${vehicle.number}`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Номер *">
          <input value={form.number} onChange={e => set('number', e.target.value)}
            placeholder="№ 101" className={inputCls} required />
        </Field>
        <Field label="Модель *">
          <input value={form.model} onChange={e => set('model', e.target.value)}
            placeholder="ПАЗ-3205" className={inputCls} required />
        </Field>
        <Field label="Тип">
          <select value={form.type} onChange={e => set('type', e.target.value as any)} className={inputCls}>
            <option value="regular">Основний</option>
            <option value="reserve">Резервний</option>
          </select>
        </Field>
        <Field label="Поточний одометр (км)">
          <input type="number" value={form.lastOdometer} min={0}
            onChange={e => set('lastOdometer', Number(e.target.value))} className={inputCls} />
        </Field>
        {error && <p className="text-sm font-medium" style={{ color: '#BC6261' }}>{error}</p>}
        <ModalActions onClose={onClose} label={isNew ? 'Додати' : 'Зберегти'} />
      </form>
    </Modal>
  );
}

// ── Shared primitives ──────────────────────────────────────────────────────

export const inputCls = 'w-full px-3 py-2.5 rounded-xl border border-border focus:outline-none bg-surface text-sm text-gray-800';

export function Modal({ title, onClose, children }: {
  title: string; onClose: () => void; children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h3 className="font-semibold text-gray-800">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <XIcon className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-600 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

export function ModalActions({ onClose, label }: { onClose: () => void; label: string }) {
  return (
    <div className="flex gap-3 pt-2">
      <button type="button" onClick={onClose}
        className="flex-1 py-2.5 border border-border text-gray-600 font-semibold rounded-xl hover:bg-surface transition-colors text-sm">
        Скасувати
      </button>
      <button type="submit"
        className="flex-1 py-2.5 text-white font-semibold rounded-xl transition-opacity hover:opacity-90 text-sm"
        style={{ background: '#003A5D' }}>
        {label}
      </button>
    </div>
  );
}

export function ConfirmModal({ message, onConfirm, onClose }: {
  message: string; onConfirm: () => void; onClose: () => void;
}) {
  return (
    <Modal title="Підтвердження" onClose={onClose}>
      <p className="text-gray-600 text-sm mb-5">{message}</p>
      <div className="flex gap-3">
        <button onClick={onClose}
          className="flex-1 py-2.5 border border-border text-gray-600 font-semibold rounded-xl hover:bg-surface transition-colors text-sm">
          Скасувати
        </button>
        <button onClick={onConfirm}
          className="flex-1 py-2.5 text-white font-semibold rounded-xl text-sm"
          style={{ background: '#BC6261' }}>
          Видалити
        </button>
      </div>
    </Modal>
  );
}
