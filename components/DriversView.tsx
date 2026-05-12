import React, { useState } from 'react';
import { WaybillUser } from '../types';
import { Backend, uid } from '../services/backend';
import { PlusIcon, EditIcon, XIcon } from './icons';
import { Modal, Field, ModalActions, ConfirmModal, inputCls } from './VehiclesView';

const EMPTY: Omit<WaybillUser, 'id'> = {
  fullName: '', login: '', password: '', role: 'driver', isApprentice: false,
};

export default function DriversView() {
  const [drivers, setDrivers] = useState<WaybillUser[]>(() => Backend.users.getDrivers());
  const [editing, setEditing] = useState<WaybillUser | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<WaybillUser | null>(null);

  const refresh = () => setDrivers(Backend.users.getDrivers());

  const openNew = () => { setEditing({ id: uid(), ...EMPTY }); setIsNew(true); };
  const openEdit = (u: WaybillUser) => { setEditing({ ...u }); setIsNew(false); };

  const handleSave = (u: WaybillUser) => {
    Backend.users.save(u);
    refresh();
    setEditing(null);
  };

  const handleDelete = (u: WaybillUser) => {
    Backend.users.delete(u.id);
    refresh();
    setDeleteTarget(null);
  };

  return (
    <div className="p-6 max-w-4xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Водії</h1>
          <p className="text-sm text-gray-500 mt-0.5">{drivers.length} осіб</p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2 text-white text-sm font-semibold rounded-xl transition-opacity hover:opacity-90"
          style={{ background: '#003A5D' }}
        >
          <PlusIcon className="w-4 h-4" /> Додати водія
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface">
              {['ПІБ', 'Логін', 'Тип', ''].map(h => (
                <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {drivers.length === 0 && (
              <tr><td colSpan={4} className="px-5 py-10 text-center text-gray-400">Немає водіїв</td></tr>
            )}
            {drivers.map(u => (
              <tr key={u.id} className="hover:bg-surface transition-colors">
                <td className="px-5 py-3 font-medium text-gray-800">{u.fullName}</td>
                <td className="px-5 py-3 text-gray-500 font-mono text-xs">{u.login}</td>
                <td className="px-5 py-3">
                  {u.isApprentice
                    ? <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: '#FAF0EF', color: '#BC6261' }}>Стажер</span>
                    : <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: '#DCFCE7', color: '#166534' }}>Водій</span>}
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-1 justify-end">
                    <button onClick={() => openEdit(u)}
                      className="p-1.5 rounded-lg text-gray-400 hover:bg-primary-light hover:text-primary transition-colors" title="Редагувати">
                      <EditIcon className="w-4 h-4" />
                    </button>
                    <button onClick={() => setDeleteTarget(u)}
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

      {editing && (
        <DriverModal
          user={editing}
          isNew={isNew}
          onSave={handleSave}
          onClose={() => setEditing(null)}
        />
      )}

      {deleteTarget && (
        <ConfirmModal
          message={`Видалити водія ${deleteTarget.fullName}? Його шляхові листи залишаться в системі.`}
          onConfirm={() => handleDelete(deleteTarget)}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}

function DriverModal({ user, isNew, onSave, onClose }: {
  user: WaybillUser; isNew: boolean;
  onSave: (u: WaybillUser) => void; onClose: () => void;
}) {
  const [form, setForm] = useState<WaybillUser>({ ...user });
  const [error, setError] = useState('');

  const set = (k: keyof WaybillUser, val: any) => setForm(f => ({ ...f, [k]: val }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName.trim()) { setError("Вкажіть ПІБ"); return; }
    if (!form.login.trim())    { setError("Вкажіть логін"); return; }
    if (!form.password.trim()) { setError("Вкажіть пароль"); return; }
    if (Backend.users.isLoginTaken(form.login.trim(), form.id)) {
      setError("Цей логін вже зайнятий"); return;
    }
    onSave({ ...form, login: form.login.trim() });
  };

  return (
    <Modal title={isNew ? 'Новий водій' : `Редагувати: ${user.fullName.split(' ')[0]}`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="ПІБ *">
          <input value={form.fullName} onChange={e => set('fullName', e.target.value)}
            placeholder="Іваненко Петро Михайлович" className={inputCls} required />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Логін *">
            <input value={form.login} onChange={e => { set('login', e.target.value); setError(''); }}
              placeholder="ivanenko" className={inputCls} required />
          </Field>
          <Field label="Пароль *">
            <input value={form.password} onChange={e => set('password', e.target.value)}
              placeholder="••••" className={inputCls} required />
          </Field>
        </div>
        <Field label="Тип">
          <div className="flex gap-3 mt-1">
            {[
              { val: false, label: 'Водій' },
              { val: true,  label: 'Стажер' },
            ].map(opt => (
              <label key={String(opt.val)} className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="radio"
                  name="apprentice"
                  checked={!!form.isApprentice === opt.val}
                  onChange={() => set('isApprentice', opt.val)}
                  className="accent-primary"
                />
                <span className="text-sm text-gray-700">{opt.label}</span>
              </label>
            ))}
          </div>
        </Field>
        {error && <p className="text-sm font-medium" style={{ color: '#BC6261' }}>{error}</p>}
        <ModalActions onClose={onClose} label={isNew ? 'Додати' : 'Зберегти'} />
      </form>
    </Modal>
  );
}
