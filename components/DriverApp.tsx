import React, { useState, useEffect } from 'react';
import { WaybillUser, Vehicle, Waybill } from '../types';
import { Backend, detectShift, formatDateTime, formatTime, uid } from '../services/backend';
import { MOCK_TECH_OPERATIONS } from '../mockData';
import { BusIcon, ClockIcon, CheckIcon, ListIcon, HomeIcon, LogoutIcon, GaugeIcon } from './icons';

type DriverView = 'home' | 'open' | 'close' | 'history';

interface Props {
  user: WaybillUser;
  onLogout: () => void;
}

const MHP_BLUE = '#003A5D';
const MHP_BLUE_DARK = '#002844';
const MHP_BLUE_LIGHT = '#E6EEF4';
const MHP_ACCENT = '#D47E7D';

function Badge({ label, color, bg }: { label: string; color: string; bg: string }) {
  return <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold" style={{ color, background: bg }}>{label}</span>;
}

const STATUS_STYLE: Record<string, { color: string; bg: string }> = {
  open:     { color: '#92600A', bg: '#FEF3C7' },
  closed:   { color: '#1D4ED8', bg: '#DBEAFE' },
  approved: { color: '#166534', bg: '#DCFCE7' },
};
const STATUS_LABELS: Record<string, string> = {
  open: 'Відкрито', closed: 'Закрито', approved: 'Затверджено',
};

export default function DriverApp({ user, onLogout }: Props) {
  const [view, setView] = useState<DriverView>('home');
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [waybills, setWaybills] = useState<Waybill[]>([]);
  const [openWaybill, setOpenWaybill] = useState<Waybill | null>(null);

  useEffect(() => {
    setVehicles(Backend.vehicles.getAll());
    const all = Backend.waybills.getByDriver(user.id);
    setWaybills(all);
    setOpenWaybill(all.find(w => w.status === 'open') || null);
  }, [user.id]);

  const refresh = () => {
    const all = Backend.waybills.getByDriver(user.id);
    setWaybills(all);
    setOpenWaybill(all.find(w => w.status === 'open') || null);
    setVehicles(Backend.vehicles.getAll());
  };

  const navItems: { v: DriverView; Icon: React.FC<any>; label: string }[] = [
    { v: 'home', Icon: HomeIcon, label: 'Головна' },
    { v: 'history', Icon: ListIcon, label: 'Мої ШЛ' },
  ];

  return (
    <div className="min-h-screen bg-surface flex flex-col max-w-md mx-auto">
      {/* Top bar */}
      <div className="text-white px-4 pt-4 pb-3" style={{ background: MHP_BLUE }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs opacity-60">МХП Логістика · Водій</p>
            <p className="font-semibold text-sm mt-0.5 truncate max-w-56">{user.fullName}</p>
            {user.isApprentice && (
              <Badge label="стажер" color="#003A5D" bg="#D47E7D" />
            )}
          </div>
          <button onClick={onLogout} className="p-2 rounded-xl hover:bg-white/10 transition-colors focus:outline-none" title="Вийти">
            <LogoutIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
        {view === 'home' && (
          <HomeView
            user={user}
            openWaybill={openWaybill}
            vehicles={vehicles}
            waybills={waybills}
            onOpenShift={() => setView('open')}
            onCloseShift={() => setView('close')}
          />
        )}
        {view === 'open' && (
          <OpenShiftView
            user={user}
            vehicles={vehicles}
            onSubmit={(wb) => { Backend.waybills.save(wb); refresh(); setView('home'); }}
            onCancel={() => setView('home')}
            existingOpen={openWaybill}
          />
        )}
        {view === 'close' && openWaybill && (
          <CloseShiftView
            waybill={openWaybill}
            onSubmit={(wb) => {
              Backend.waybills.save(wb);
              if (wb.odometerEnd) Backend.vehicles.updateOdometer(wb.vehicleId, wb.odometerEnd);
              refresh();
              setView('home');
            }}
            onCancel={() => setView('home')}
          />
        )}
        {view === 'history' && <HistoryView waybills={[...waybills].reverse()} />}
      </div>

      {/* Bottom nav */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-border px-2 py-2 flex">
        {navItems.map(({ v, Icon, label }) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className="flex-1 flex flex-col items-center gap-1 py-1.5 rounded-xl transition-colors focus:outline-none"
            style={{ color: view === v ? MHP_BLUE : '#9ca3af' }}
          >
            <Icon className="w-6 h-6" />
            <span className="text-xs font-medium">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Home View ──────────────────────────────────────────────────────────────
function HomeView({ user, openWaybill, vehicles, waybills, onOpenShift, onCloseShift }: {
  user: WaybillUser; openWaybill: Waybill | null; vehicles: Vehicle[];
  waybills: Waybill[]; onOpenShift: () => void; onCloseShift: () => void;
}) {
  const now = new Date();
  const { shift: currentShift, label: shiftLabel } = detectShift(now);
  const shiftExam = Backend.exams.getShiftExam(user.id, currentShift, now);

  return (
    <div className="space-y-4">
      {/* Current time + shift */}
      <div className="bg-white rounded-2xl p-4 border border-border shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#E6EEF4' }}>
            <ClockIcon className="w-5 h-5" style={{ color: '#003A5D' }} />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-800 leading-none">
              {now.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              {now.toLocaleDateString('uk-UA', { weekday: 'long', day: 'numeric', month: 'long' })} · {shiftLabel}
            </p>
          </div>
        </div>
      </div>

      {/* Active waybill or open shift button */}
      {openWaybill ? (
        <div className="rounded-2xl p-4 space-y-3 border" style={{ background: '#FFFBEB', borderColor: '#FCD34D' }}>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#F59E0B' }} />
            <span className="text-sm font-semibold" style={{ color: '#92600A' }}>Зміна відкрита</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <InfoRow label="ТЗ" value={openWaybill.vehicleNumber} />
            <InfoRow label="Відкрито" value={formatTime(openWaybill.openTime)} />
            <InfoRow label="Одометр (початок)" value={`${openWaybill.odometerStart.toLocaleString()} км`} />
            <InfoRow label="Зміна" value={openWaybill.shift === 'actual' ? 'Факт.' : `${openWaybill.shift} зміна`} />
          </div>
          <button
            onClick={onCloseShift}
            className="w-full py-3 text-white font-semibold rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2"
            style={{ background: '#003A5D' }}
          >
            <CheckIcon className="w-5 h-5" />
            Закрити зміну
          </button>
        </div>
      ) : shiftExam?.result === 'suspended' ? (
        <div className="rounded-2xl p-4 space-y-2 border" style={{ background: '#FEF2F2', borderColor: '#FCA5A5' }}>
          <div className="flex items-center gap-2">
            <span className="text-base">🚫</span>
            <span className="text-sm font-semibold" style={{ color: '#991B1B' }}>Водія відсторонено</span>
          </div>
          <p className="text-sm" style={{ color: '#B91C1C' }}>
            {shiftExam.suspendReason || 'За рішенням медичного працівника.'}
          </p>
          <p className="text-xs" style={{ color: '#EF4444' }}>
            Зверніться до медичного працівника або керівника.
          </p>
        </div>
      ) : !shiftExam ? (
        <div className="rounded-2xl p-4 space-y-2 border" style={{ background: '#FFFBEB', borderColor: '#FCD34D' }}>
          <div className="flex items-center gap-2">
            <span className="text-base">🔒</span>
            <span className="text-sm font-semibold" style={{ color: '#92600A' }}>Медичний огляд не пройдено</span>
          </div>
          <p className="text-sm" style={{ color: '#B45309' }}>
            Зверніться до медичного працівника для проходження передрейсового огляду перед початком зміни.
          </p>
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

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="ШЛ сьогодні" value={waybills.filter(w => new Date(w.createdAt).toDateString() === new Date().toDateString()).length} />
        <StatCard label="ШЛ всього" value={waybills.length} />
      </div>

      {/* Last waybills */}
      {waybills.length > 0 && (
        <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
          <p className="px-4 pt-3 pb-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Останні ШЛ</p>
          {[...waybills].reverse().slice(0, 3).map(wb => (
            <div key={wb.id} className="px-4 py-3 border-t border-gray-50 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">{wb.vehicleNumber}</p>
                <p className="text-xs text-gray-400">{formatDateTime(wb.openTime)}</p>
              </div>
              <Badge label={STATUS_LABELS[wb.status]} {...STATUS_STYLE[wb.status]} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white rounded-2xl p-3 border border-border shadow-sm text-center">
      <p className="text-2xl font-bold" style={{ color: '#003A5D' }}>{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}

// ── Open Shift View ────────────────────────────────────────────────────────
function OpenShiftView({ user, vehicles, onSubmit, onCancel, existingOpen }: {
  user: WaybillUser; vehicles: Vehicle[];
  onSubmit: (wb: Waybill) => void; onCancel: () => void;
  existingOpen: Waybill | null;
}) {
  const [vehicleId, setVehicleId] = useState('');
  const [comment, setComment] = useState('');
  const now = new Date();
  const { shift, label: shiftLabel } = detectShift(now);

  const selectedVehicle = vehicles.find(v => v.id === vehicleId);
  const odometerStart = vehicleId ? Backend.vehicles.getLastOdometer(vehicleId) : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicle) return;
    const clearance = Backend.exams.getActiveClearance(user.id, shift, now);
    const wb: Waybill = {
      id: uid(),
      driverId: user.id,
      driverName: user.fullName,
      vehicleId: selectedVehicle.id,
      vehicleNumber: selectedVehicle.number,
      shift,
      openTime: now.toISOString(),
      odometerStart,
      examId: clearance?.id,
      comment: comment || undefined,
      status: 'open',
      isApprentice: !!user.isApprentice,
      createdAt: now.toISOString(),
    };
    onSubmit(wb);
  };

  if (existingOpen) {
    return (
      <div className="rounded-2xl p-5 text-center space-y-3 border" style={{ background: '#FFFBEB', borderColor: '#FCD34D' }}>
        <p className="font-semibold" style={{ color: '#92600A' }}>У вас вже є відкрита зміна</p>
        <p className="text-sm" style={{ color: '#B45309' }}>Спочатку закрийте поточну зміну (ТЗ {existingOpen.vehicleNumber}), а потім відкрийте нову.</p>
        <button onClick={onCancel} className="w-full py-2.5 text-white rounded-xl font-semibold" style={{ background: '#003A5D' }}>Повернутись</button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-white rounded-2xl p-4 border border-border shadow-sm">
        <h2 className="font-semibold text-gray-800 mb-1">Відкрити зміну</h2>
        <p className="text-xs text-gray-500">Заповніть дані для нового шляхового листа</p>
      </div>

      <div className="bg-white rounded-2xl p-4 border border-border shadow-sm space-y-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Автоматично</p>
        <InfoRow label="ПІБ" value={user.fullName} />
        <InfoRow label="Зміна" value={shiftLabel} />
        <InfoRow label="Час відкриття" value={now.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })} />
        {user.isApprentice && <InfoRow label="Тип" value="Стажер" highlight />}
      </div>

      <div className="bg-white rounded-2xl p-4 border border-border shadow-sm space-y-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Заповніть</p>

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1.5">Транспортний засіб *</label>
          <select
            value={vehicleId}
            onChange={e => setVehicleId(e.target.value)}
            required
            className="w-full px-3 py-2.5 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-[#003A5D]/20 bg-surface text-gray-800 text-sm"
          >
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
        </div>

        {selectedVehicle && (
          <div className="rounded-xl px-4 py-3 flex items-center gap-3" style={{ background: '#E6EEF4' }}>
            <GaugeIcon className="w-5 h-5 shrink-0" style={{ color: '#003A5D' }} />
            <div>
              <p className="text-xs text-gray-500">Початковий одометр (з попереднього ШЛ)</p>
              <p className="text-lg font-bold" style={{ color: '#003A5D' }}>{odometerStart.toLocaleString()} км</p>
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1.5">Коментар</label>
          <textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="Необов'язково (не заправлено, стажер...)"
            rows={2}
            className="w-full px-3 py-2.5 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-[#003A5D]/20 bg-surface text-gray-800 text-sm resize-none"
          />
        </div>
      </div>

      <div className="flex gap-3">
        <button type="button" onClick={onCancel}
          className="flex-1 py-3 border border-border text-gray-600 font-semibold rounded-xl hover:bg-surface transition-colors">
          Скасувати
        </button>
        <button type="submit" disabled={!vehicleId}
          className="flex-1 py-3 text-white font-semibold rounded-xl transition-opacity disabled:opacity-40"
          style={{ background: '#003A5D' }}>
          Відкрити зміну
        </button>
      </div>
    </form>
  );
}

// ── Close Shift View ───────────────────────────────────────────────────────
function CloseShiftView({ waybill, onSubmit, onCancel }: {
  waybill: Waybill; onSubmit: (wb: Waybill) => void; onCancel: () => void;
}) {
  const [odometerEnd, setOdometerEnd] = useState('');
  const [techOpId, setTechOpId] = useState('');
  const [comment, setComment] = useState(waybill.comment || '');
  const [error, setError] = useState('');

  const now = new Date();
  const selectedOp = MOCK_TECH_OPERATIONS.find(t => t.id === techOpId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const end = parseInt(odometerEnd, 10);
    if (isNaN(end) || end < waybill.odometerStart) {
      setError('Кінцевий одометр має бути ≥ початкового'); return;
    }
    if (!techOpId) { setError('Оберіть технологічну операцію'); return; }
    onSubmit({
      ...waybill,
      closeTime: now.toISOString(),
      odometerEnd: end,
      techOperationId: techOpId,
      techOperationName: selectedOp?.name,
      comment: comment || undefined,
      status: 'closed',
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-white rounded-2xl p-4 border border-border shadow-sm">
        <h2 className="font-semibold text-gray-800 mb-1">Закрити зміну</h2>
        <p className="text-xs text-gray-500">Внесіть фактичні дані по закінченню зміни</p>
      </div>

      <div className="bg-white rounded-2xl p-4 border border-border shadow-sm space-y-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Поточний ШЛ</p>
        <InfoRow label="ТЗ" value={waybill.vehicleNumber} />
        <InfoRow label="Відкрито" value={formatTime(waybill.openTime)} />
        <InfoRow label="Одометр (початок)" value={`${waybill.odometerStart.toLocaleString()} км`} />
        <InfoRow label="Час закриття" value={now.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })} />
      </div>

      <div className="bg-white rounded-2xl p-4 border border-border shadow-sm space-y-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Внесіть дані</p>

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1.5">Одометр (кінець) *</label>
          <div className="relative">
            <input
              type="number"
              value={odometerEnd}
              onChange={e => { setOdometerEnd(e.target.value); setError(''); }}
              placeholder={String(waybill.odometerStart)}
              min={waybill.odometerStart}
              required
              className="w-full px-3 py-2.5 pr-12 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-[#003A5D]/20 bg-surface text-gray-800 text-sm"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">км</span>
          </div>
          {odometerEnd && !isNaN(parseInt(odometerEnd)) && parseInt(odometerEnd) >= waybill.odometerStart && (
            <p className="text-xs mt-1 font-medium" style={{ color: '#166534' }}>
              Пробіг: {(parseInt(odometerEnd) - waybill.odometerStart).toLocaleString()} км
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1.5">Технологічна операція *</label>
          <select
            value={techOpId}
            onChange={e => { setTechOpId(e.target.value); setError(''); }}
            required
            className="w-full px-3 py-2.5 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-[#003A5D]/20 bg-surface text-gray-800 text-sm"
          >
            <option value="">— Оберіть операцію —</option>
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
            placeholder="Не працює одометр, не відбулась заправка..."
            rows={2}
            className="w-full px-3 py-2.5 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-[#003A5D]/20 bg-surface text-gray-800 text-sm resize-none"
          />
        </div>

        {error && <p className="text-sm font-medium" style={{ color: '#BC6261' }}>{error}</p>}
      </div>

      <div className="flex gap-3">
        <button type="button" onClick={onCancel}
          className="flex-1 py-3 border border-border text-gray-600 font-semibold rounded-xl hover:bg-surface transition-colors">
          Скасувати
        </button>
        <button type="submit"
          className="flex-1 py-3 text-white font-semibold rounded-xl transition-opacity hover:opacity-90"
          style={{ background: '#003A5D' }}>
          Закрити зміну
        </button>
      </div>
    </form>
  );
}

// ── History View ───────────────────────────────────────────────────────────
function HistoryView({ waybills }: { waybills: Waybill[] }) {
  if (waybills.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <ListIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p className="font-medium">Шляхові листи відсутні</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-1">Мої шляхові листи</p>
      {waybills.map(wb => (
        <div key={wb.id} className="bg-white rounded-2xl border border-border shadow-sm p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-gray-800">{wb.vehicleNumber}</span>
            <Badge label={STATUS_LABELS[wb.status]} {...STATUS_STYLE[wb.status]} />
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-500">
            <span>Відкрито: <span className="text-gray-700 font-medium">{formatDateTime(wb.openTime)}</span></span>
            {wb.closeTime && <span>Закрито: <span className="text-gray-700 font-medium">{formatTime(wb.closeTime)}</span></span>}
            <span>Одом. початок: <span className="text-gray-700 font-medium">{wb.odometerStart.toLocaleString()}</span></span>
            {wb.odometerEnd && <span>Одом. кінець: <span className="text-gray-700 font-medium">{wb.odometerEnd.toLocaleString()}</span></span>}
            {wb.techOperationName && <span className="col-span-2">Тех. операція: <span className="text-gray-700 font-medium">{wb.techOperationName}</span></span>}
            {wb.comment && <span className="col-span-2">Коментар: <span className="text-gray-700 italic">{wb.comment}</span></span>}
          </div>
          {wb.odometerEnd && (
            <p className="text-xs font-medium" style={{ color: '#166534' }}>
              Пробіг: {(wb.odometerEnd - wb.odometerStart).toLocaleString()} км
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

function InfoRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-gray-500">{label}</span>
      <span className="text-sm font-medium" style={{ color: highlight ? '#D47E7D' : '#1f2937' }}>{value}</span>
    </div>
  );
}
