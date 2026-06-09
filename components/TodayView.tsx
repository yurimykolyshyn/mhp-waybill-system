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
  const [assignments, setAssignments]   = useState<Waybill[]>([]);
  const [substituting, setSubstituting] = useState<Waybill | null>(null);
  const [toast, setToast]               = useState('');
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
                const canSubstitute = medStatus !== 'cleared';

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
