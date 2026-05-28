import React, { useState, useMemo } from 'react';
import { Waybill } from '../types';
import { formatDateTime, formatTime } from '../services/backend';
import { MOCK_TECH_OPERATIONS } from '../mockData';
import { EditIcon, CheckIcon, PlusIcon } from './icons';
import CreateWaybillModal from './CreateWaybillModal';

interface Props {
  waybills: Waybill[];
  onUpdate: (wb: Waybill) => void;
  onAdd: (wb: Waybill) => void;
}

const STATUS_STYLE: Record<string, { color: string; bg: string }> = {
  open:     { color: '#92600A', bg: '#FEF3C7' },
  closed:   { color: '#1D4ED8', bg: '#DBEAFE' },
  approved: { color: '#166534', bg: '#DCFCE7' },
};
const STATUS_LABELS: Record<string, string> = {
  open: 'Відкрито', closed: 'Закрито', approved: 'Затверджено',
};

export default function WaybillList({ waybills, onUpdate, onAdd }: Props) {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterDate, setFilterDate] = useState('');
  const [editingWb, setEditingWb] = useState<Waybill | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const filtered = useMemo(() => {
    return waybills
      .filter(w => {
        const matchSearch = !search ||
          w.driverName.toLowerCase().includes(search.toLowerCase()) ||
          w.vehicleNumber.includes(search);
        const matchStatus = filterStatus === 'all' || w.status === filterStatus;
        const matchDate = !filterDate || w.createdAt.startsWith(filterDate);
        return matchSearch && matchStatus && matchDate;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [waybills, search, filterStatus, filterDate]);

  return (
    <div className="p-6 space-y-4 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Шляхові листи</h1>
          <p className="text-gray-500 text-sm mt-0.5">{filtered.length} з {waybills.length}</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 text-white text-sm font-semibold rounded-xl transition-opacity hover:opacity-90 focus:outline-none"
          style={{ background: '#003A5D' }}
        >
          <PlusIcon className="w-4 h-4" /> Додати ШЛ
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-border shadow-sm p-4 flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Пошук за водієм або ТЗ..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 min-w-48 px-3 py-2 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-[#003A5D]/20 bg-surface text-gray-700"
        />
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="px-3 py-2 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-[#003A5D]/20 bg-surface text-gray-700"
        >
          <option value="all">Всі статуси</option>
          <option value="open">Відкрито</option>
          <option value="closed">Закрито</option>
          <option value="approved">Затверджено</option>
        </select>
        <input
          type="date"
          value={filterDate}
          onChange={e => setFilterDate(e.target.value)}
          className="px-3 py-2 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-[#003A5D]/20 bg-surface text-gray-700"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface">
                {['Водій','ТЗ','Зміна','Відкрито','Закрито','Одом. поч.','Одом. кін.','Пробіг','Тех. операція','Статус','Дії'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-5 py-10 text-center text-gray-400 text-sm">Шляхових листів не знайдено</td>
                </tr>
              ) : filtered.map(wb => (
                <tr key={wb.id} className="hover:bg-surface transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1.5">
                      <p className="font-medium text-gray-800 whitespace-nowrap">
                        {wb.driverName.split(' ').slice(0, 2).join(' ')}
                      </p>
                      {wb.examId && (
                        <span title="Медогляд пройдено" className="inline-flex items-center justify-center w-4 h-4 rounded-full text-white text-xs font-bold shrink-0" style={{ background: '#166534' }}>✓</span>
                      )}
                    </div>
                    {wb.isApprentice && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: '#FAF0EF', color: '#BC6261' }}>стажер</span>
                    )}
                  </td>
                  <td className="px-5 py-3 font-medium text-gray-700 whitespace-nowrap">{wb.vehicleNumber}</td>
                  <td className="px-5 py-3 text-gray-600 whitespace-nowrap">{wb.shift === 'actual' ? 'Факт.' : wb.shift}</td>
                  <td className="px-5 py-3 text-gray-600 whitespace-nowrap">{formatDateTime(wb.openTime)}</td>
                  <td className="px-5 py-3 text-gray-600 whitespace-nowrap">{wb.closeTime ? formatTime(wb.closeTime) : '—'}</td>
                  <td className="px-5 py-3 text-gray-600 whitespace-nowrap">{wb.odometerStart.toLocaleString()}</td>
                  <td className="px-5 py-3 text-gray-600 whitespace-nowrap">{wb.odometerEnd?.toLocaleString() || '—'}</td>
                  <td className="px-5 py-3 text-gray-600 whitespace-nowrap">
                    {wb.odometerEnd ? `${(wb.odometerEnd - wb.odometerStart).toLocaleString()} км` : '—'}
                  </td>
                  <td className="px-5 py-3 text-gray-600 max-w-36">
                    <span className="truncate block" title={wb.techOperationName}>{wb.techOperationName || '—'}</span>
                    {wb.comment && <span className="text-xs text-gray-400 italic truncate block" title={wb.comment}>{wb.comment}</span>}
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={STATUS_STYLE[wb.status]}>
                      {STATUS_LABELS[wb.status]}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1">
                      {wb.status === 'closed' && (
                        <button
                          onClick={() => onUpdate({ ...wb, status: 'approved' })}
                          title="Затвердити"
                          className="p-1.5 rounded-lg transition-colors hover:bg-green-50 focus:outline-none"
                          style={{ color: '#166534' }}
                        >
                          <CheckIcon className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => setEditingWb(wb)}
                        title="Редагувати"
                        className="p-1.5 rounded-lg text-gray-500 hover:bg-primary-light transition-colors focus:outline-none"
                      >
                        <EditIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showCreate && (
        <CreateWaybillModal
          onSave={(wb) => { onAdd(wb); setShowCreate(false); }}
          onClose={() => setShowCreate(false)}
        />
      )}

      {editingWb && (
        <EditModal
          waybill={editingWb}
          onSave={(wb) => { onUpdate(wb); setEditingWb(null); }}
          onClose={() => setEditingWb(null)}
        />
      )}
    </div>
  );
}

function EditModal({ waybill, onSave, onClose }: {
  waybill: Waybill; onSave: (wb: Waybill) => void; onClose: () => void;
}) {
  const [techOpId, setTechOpId] = useState(waybill.techOperationId || '');
  const [comment, setComment] = useState(waybill.comment || '');
  const [status, setStatus] = useState(waybill.status);

  const handleSave = () => {
    const op = MOCK_TECH_OPERATIONS.find(t => t.id === techOpId);
    onSave({ ...waybill, techOperationId: techOpId || undefined, techOperationName: op?.name, comment: comment || undefined, status });
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-800">Редагувати ШЛ</h3>
            <p className="text-xs text-gray-500 mt-0.5">{waybill.driverName} · {waybill.vehicleNumber}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors text-xl leading-none focus:outline-none">×</button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-3 text-xs text-gray-500 rounded-xl p-3" style={{ background: '#E6EEF4' }}>
            <span>Відкрито: <b className="text-gray-700">{formatDateTime(waybill.openTime)}</b></span>
            {waybill.closeTime && <span>Закрито: <b className="text-gray-700">{formatTime(waybill.closeTime)}</b></span>}
            <span>Одом. початок: <b className="text-gray-700">{waybill.odometerStart.toLocaleString()}</b></span>
            {waybill.odometerEnd && <span>Одом. кінець: <b className="text-gray-700">{waybill.odometerEnd.toLocaleString()}</b></span>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">Технологічна операція</label>
            <select
              value={techOpId}
              onChange={e => setTechOpId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-border focus:outline-none bg-surface text-sm text-gray-700"
            >
              <option value="">— не обрано —</option>
              {MOCK_TECH_OPERATIONS.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">Коментар</label>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              rows={2}
              className="w-full px-3 py-2.5 rounded-xl border border-border focus:outline-none bg-surface text-sm resize-none text-gray-700"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">Статус</label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value as any)}
              className="w-full px-3 py-2.5 rounded-xl border border-border focus:outline-none bg-surface text-sm text-gray-700"
            >
              <option value="open">Відкрито</option>
              <option value="closed">Закрито</option>
              <option value="approved">Затверджено</option>
            </select>
          </div>
        </div>

        <div className="px-6 pb-5 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 border border-border text-gray-600 font-semibold rounded-xl hover:bg-surface transition-colors text-sm">
            Скасувати
          </button>
          <button onClick={handleSave} className="flex-1 py-2.5 text-white font-semibold rounded-xl transition-opacity hover:opacity-90 text-sm" style={{ background: '#003A5D' }}>
            Зберегти
          </button>
        </div>
      </div>
    </div>
  );
}
