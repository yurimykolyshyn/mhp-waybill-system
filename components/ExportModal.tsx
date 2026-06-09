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
  const [dateFrom, setDateFrom] = useState(today);
  const [dateTo, setDateTo]     = useState(today);
  const [statuses, setStatuses] = useState(new Set(['closed', 'approved']));
  const [error, setError]       = useState('');

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
        '№':             i + 1,
        'Дата':          formatDate(wb.openTime),
        'Водій':         wb.driverName,
        'ТЗ':            wb.vehicleNumber,
        'Зміна':         wb.shift === 'actual' ? 'Факт.' : `${wb.shift} зміна`,
        'Відкрито':      formatTime(wb.openTime),
        'Закрито':       wb.closeTime ? formatTime(wb.closeTime) : '—',
        'Одом. поч.':    wb.odometerStart,
        'Одом. кін.':    wb.odometerEnd ?? '—',
        'Пробіг км':     wb.odometerEnd != null ? wb.odometerEnd - wb.odometerStart : '—',
        'Тех. операція': wb.techOperationName || '—',
        'Доп. операції': wb.additionalTechOps?.map(o => o.name).join(', ') || '—',
        'Коментар':      wb.comment || '—',
        'Статус':        STATUS_LABELS_UA[wb.status] ?? wb.status,
        'Медогляд':      wb.examId ? 'Так' : 'Ні',
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
