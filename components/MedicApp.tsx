import React, { useState, useEffect, useRef } from 'react';
import { WaybillUser, MedicalExam, DrugTestResult, ShiftType } from '../types';
import { Backend, detectShift, uid, formatTime } from '../services/backend';
import { HomeIcon, ListIcon, LogoutIcon } from './icons';

interface Props {
  user: WaybillUser;
  onLogout: () => void;
}

const MHP_BLUE = '#003A5D';
type MedicView = 'exam' | 'journal';

export default function MedicApp({ user, onLogout }: Props) {
  const [view, setView] = useState<MedicView>('exam');

  const navItems: { v: MedicView; Icon: React.FC<any>; label: string }[] = [
    { v: 'exam',    Icon: HomeIcon, label: 'Огляд' },
    { v: 'journal', Icon: ListIcon, label: 'Журнал' },
  ];

  return (
    <div className="min-h-screen bg-surface flex flex-col max-w-md mx-auto">
      {/* Header */}
      <div className="text-white px-4 pt-4 pb-3" style={{ background: MHP_BLUE }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs opacity-60">МХП Логістика · Медик</p>
            <p className="font-semibold text-sm mt-0.5 truncate max-w-56">{user.fullName}</p>
          </div>
          <button onClick={onLogout} className="p-2 rounded-xl hover:bg-white/10 transition-colors focus:outline-none" title="Вийти">
            <LogoutIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 pb-24">
        {view === 'exam'    && <ExamView    medic={user} />}
        {view === 'journal' && <JournalView />}
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

// ── Driver Combobox ───────────────────────────────────────────────────────────
function DriverCombobox({ drivers, value, onChange }: {
  drivers: WaybillUser[];
  value: WaybillUser | null;
  onChange: (d: WaybillUser | null) => void;
}) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const filtered = query.trim()
    ? drivers.filter(d => d.fullName.toLowerCase().includes(query.toLowerCase()))
    : drivers;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const select = (d: WaybillUser) => {
    onChange(d);
    setQuery(d.fullName);
    setOpen(false);
  };

  const clear = () => {
    onChange(null);
    setQuery('');
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); onChange(null); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Пошук водія..."
          className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-[#003A5D]/20 bg-surface text-sm text-gray-800"
        />
        {query && (
          <button onClick={clear} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
      {open && filtered.length > 0 && (
        <ul className="absolute z-20 mt-1 w-full bg-white border border-border rounded-xl shadow-lg max-h-52 overflow-y-auto">
          {filtered.map(d => (
            <li key={d.id}>
              <button
                onMouseDown={() => select(d)}
                className="w-full text-left px-4 py-2.5 text-sm hover:bg-surface transition-colors focus:outline-none"
              >
                <span className="font-medium text-gray-800">{d.fullName}</span>
                {d.isApprentice && <span className="ml-2 text-xs text-accent-dark">стажер</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
      {open && query && filtered.length === 0 && (
        <div className="absolute z-20 mt-1 w-full bg-white border border-border rounded-xl shadow-lg px-4 py-3 text-sm text-gray-400">
          Водія не знайдено
        </div>
      )}
    </div>
  );
}

// ── Clearance Status Badge ─────────────────────────────────────────────────
function ClearanceBadge({ exam }: { exam: MedicalExam | null }) {
  if (!exam) return (
    <div className="rounded-xl px-4 py-3 text-sm bg-surface border border-border text-gray-500">
      Огляд для цієї зміни не проводився
    </div>
  );
  if (exam.result === 'cleared') return (
    <div className="rounded-xl px-4 py-3 text-sm font-semibold" style={{ background: '#DCFCE7', color: '#166534' }}>
      ✓ Допущений до зміни {exam.shift === 'actual' ? '(факт.)' : exam.shift}
    </div>
  );
  return (
    <div className="rounded-xl px-4 py-3 text-sm font-semibold" style={{ background: '#FAF0EF', color: '#BC6261' }}>
      ✗ Відсторонений — {exam.suspendReason}
    </div>
  );
}

// ── Exam View ─────────────────────────────────────────────────────────────────
function ExamView({ medic }: { medic: WaybillUser }) {
  const [drivers] = useState<WaybillUser[]>(() => Backend.users.getDrivers());
  const [selectedDriver, setSelectedDriver] = useState<WaybillUser | null>(null);
  const [existingExam, setExistingExam] = useState<MedicalExam | null>(null);

  // Physiological fields
  const [bpSys, setBpSys] = useState('');
  const [bpDia, setBpDia] = useState('');
  const [pulse, setPulse] = useState('');
  const [alcohol, setAlcohol] = useState('');
  const [drugDone, setDrugDone] = useState(false);
  const [drugResult, setDrugResult] = useState<'negative' | 'positive'>('negative');
  const [complaints, setComplaints] = useState('');

  // Result
  const [pendingResult, setPendingResult] = useState<'cleared' | 'suspended' | null>(null);
  const [suspendReason, setSuspendReason] = useState('');
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  const now = new Date();
  const { shift } = detectShift(now);

  useEffect(() => {
    if (selectedDriver) {
      setExistingExam(Backend.exams.getShiftExam(selectedDriver.id, shift, now));
    } else {
      setExistingExam(null);
    }
    // Reset form when driver changes
    setBpSys(''); setBpDia(''); setPulse(''); setAlcohol('');
    setDrugDone(false); setDrugResult('negative'); setComplaints('');
    setPendingResult(null); setSuspendReason(''); setError('');
  }, [selectedDriver]);

  const resetForm = () => {
    setSelectedDriver(null);
    setExistingExam(null);
    setBpSys(''); setBpDia(''); setPulse(''); setAlcohol('');
    setDrugDone(false); setDrugResult('negative'); setComplaints('');
    setPendingResult(null); setSuspendReason(''); setError('');
  };

  const handleSave = (result: 'cleared' | 'suspended') => {
    if (!selectedDriver) return;
    if (result === 'suspended' && !suspendReason.trim()) {
      setError("Вкажіть причину відсторонення"); return;
    }

    const drugTest: DrugTestResult = !drugDone ? 'not_done' : drugResult;

    const exam: MedicalExam = {
      id: uid(),
      driverId: selectedDriver.id,
      driverName: selectedDriver.fullName,
      medicId: medic.id,
      medicName: medic.fullName,
      date: now.toISOString(),
      shift: shift as ShiftType,
      bpSystolic:  bpSys    ? Number(bpSys)    : undefined,
      bpDiastolic: bpDia    ? Number(bpDia)    : undefined,
      pulse:       pulse     ? Number(pulse)    : undefined,
      alcoholMgl:  alcohol   ? Number(alcohol)  : undefined,
      drugTest,
      complaints:  complaints.trim() || undefined,
      result,
      suspendReason: result === 'suspended' ? suspendReason.trim() : undefined,
      createdAt: now.toISOString(),
    };

    Backend.exams.save(exam);

    const name = selectedDriver.fullName.split(' ')[0];
    setToast(result === 'cleared' ? `✓ ${name} допущений` : `✗ ${name} відсторонений`);
    setTimeout(() => setToast(''), 3000);
    resetForm();
  };

  return (
    <div className="space-y-4">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-semibold text-white"
          style={{ background: toast.startsWith('✓') ? '#166534' : '#BC6261' }}>
          {toast}
        </div>
      )}

      <div className="bg-white rounded-2xl p-4 border border-border shadow-sm">
        <h2 className="font-semibold text-gray-800 mb-1">Передрейсовий огляд</h2>
        <p className="text-xs text-gray-500">
          {now.toLocaleDateString('uk-UA', { day: 'numeric', month: 'long' })} ·{' '}
          {shift === 'actual' ? 'Фактичний час' : `${shift} зміна`}
        </p>
      </div>

      {/* Driver picker */}
      <div className="bg-white rounded-2xl p-4 border border-border shadow-sm space-y-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Водій</p>
        <DriverCombobox drivers={drivers} value={selectedDriver} onChange={setSelectedDriver} />
        {selectedDriver && <ClearanceBadge exam={existingExam} />}
      </div>

      {/* Exam form — shown only if driver selected and not yet examined */}
      {selectedDriver && !existingExam && (
        <div className="bg-white rounded-2xl p-4 border border-border shadow-sm space-y-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Показники <span className="normal-case font-normal text-gray-400">(необов'язково)</span>
          </p>

          {/* BP */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">Артеріальний тиск (мм рт.ст.)</label>
            <div className="flex items-center gap-2">
              <input type="number" value={bpSys} onChange={e => setBpSys(e.target.value)}
                placeholder="сист." min={0} max={300}
                className="flex-1 px-3 py-2.5 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-[#003A5D]/20 bg-surface text-sm text-gray-800" />
              <span className="text-gray-400 font-bold">/</span>
              <input type="number" value={bpDia} onChange={e => setBpDia(e.target.value)}
                placeholder="діаст." min={0} max={200}
                className="flex-1 px-3 py-2.5 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-[#003A5D]/20 bg-surface text-sm text-gray-800" />
            </div>
          </div>

          {/* Pulse */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">Пульс (уд/хв)</label>
            <input type="number" value={pulse} onChange={e => setPulse(e.target.value)}
              placeholder="60–100" min={0} max={300}
              className="w-full px-3 py-2.5 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-[#003A5D]/20 bg-surface text-sm text-gray-800" />
          </div>

          {/* Alcohol */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">Алкотест (мг/л)</label>
            <input type="number" value={alcohol} onChange={e => setAlcohol(e.target.value)}
              placeholder="0.00" min={0} step={0.01}
              className="w-full px-3 py-2.5 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-[#003A5D]/20 bg-surface text-sm text-gray-800" />
          </div>

          {/* Drug test */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer select-none mb-2">
              <input type="checkbox" checked={drugDone} onChange={e => setDrugDone(e.target.checked)}
                className="accent-primary w-4 h-4" />
              <span className="text-sm font-medium text-gray-600">Тест на наркотики проводився</span>
            </label>
            {drugDone && (
              <div className="flex gap-4 ml-6">
                {(['negative', 'positive'] as const).map(r => (
                  <label key={r} className="flex items-center gap-1.5 cursor-pointer select-none">
                    <input type="radio" name="drugResult" value={r}
                      checked={drugResult === r} onChange={() => setDrugResult(r)}
                      className="accent-primary" />
                    <span className="text-sm text-gray-700">
                      {r === 'negative' ? 'Негативний' : 'Позитивний'}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Complaints */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">Скарги / загальний стан</label>
            <textarea value={complaints} onChange={e => setComplaints(e.target.value)}
              placeholder="Скарг немає..."
              rows={2}
              className="w-full px-3 py-2.5 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-[#003A5D]/20 bg-surface text-sm text-gray-800 resize-none" />
          </div>
        </div>
      )}

      {/* Result buttons */}
      {selectedDriver && !existingExam && (
        <div className="space-y-3">
          {pendingResult === 'suspended' && (
            <div className="bg-white rounded-2xl p-4 border border-border shadow-sm">
              <label className="block text-sm font-medium text-gray-600 mb-1.5">Причина відсторонення *</label>
              <input type="text" value={suspendReason}
                onChange={e => { setSuspendReason(e.target.value); setError(''); }}
                placeholder="Алкогольне сп'яніння, підвищений тиск..."
                className="w-full px-3 py-2.5 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-[#003A5D]/20 bg-surface text-sm text-gray-800" />
              {error && <p className="text-sm font-medium mt-2" style={{ color: '#BC6261' }}>{error}</p>}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => { setPendingResult(null); handleSave('cleared'); }}
              className="flex-1 py-3 text-white font-semibold rounded-xl transition-opacity hover:opacity-90 focus:outline-none"
              style={{ background: '#003A5D' }}
            >
              ✓ Допустити
            </button>
            {pendingResult !== 'suspended' ? (
              <button
                onClick={() => setPendingResult('suspended')}
                className="flex-1 py-3 text-white font-semibold rounded-xl transition-opacity hover:opacity-90 focus:outline-none"
                style={{ background: '#BC6261' }}
              >
                ✗ Відсторонити
              </button>
            ) : (
              <button
                onClick={() => handleSave('suspended')}
                className="flex-1 py-3 text-white font-semibold rounded-xl transition-opacity hover:opacity-90 focus:outline-none"
                style={{ background: '#BC6261' }}
              >
                Підтвердити
              </button>
            )}
          </div>
          {pendingResult === 'suspended' && (
            <button onClick={() => { setPendingResult(null); setSuspendReason(''); setError(''); }}
              className="w-full py-2 text-sm text-gray-500 hover:text-gray-700 focus:outline-none transition-colors">
              Скасувати відсторонення
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Journal View ──────────────────────────────────────────────────────────────
function JournalView() {
  const exams = Backend.exams.getToday()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  if (exams.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <p className="font-medium">Сьогодні оглядів не проводилось</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-1">
        Журнал оглядів · {new Date().toLocaleDateString('uk-UA', { day: 'numeric', month: 'long' })}
      </p>
      {exams.map(exam => (
        <div key={exam.id} className="bg-white rounded-2xl border border-border shadow-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="font-semibold text-gray-800 text-sm">
              {exam.driverName.split(' ').slice(0, 2).join(' ')}
            </p>
            <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
              style={exam.result === 'cleared'
                ? { background: '#DCFCE7', color: '#166534' }
                : { background: '#FAF0EF', color: '#BC6261' }}>
              {exam.result === 'cleared' ? 'Допущений' : 'Відсторонений'}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <span>Зміна: {exam.shift === 'actual' ? 'Факт.' : exam.shift}</span>
            <span>·</span>
            <span>{formatTime(exam.createdAt)}</span>
            {exam.bpSystolic && <span>· АТ {exam.bpSystolic}/{exam.bpDiastolic}</span>}
            {exam.pulse && <span>· {exam.pulse} уд/хв</span>}
            {exam.alcoholMgl !== undefined && <span>· Алко: {exam.alcoholMgl} мг/л</span>}
          </div>
          {exam.result === 'suspended' && exam.suspendReason && (
            <p className="text-xs mt-1.5 font-medium" style={{ color: '#BC6261' }}>
              Причина: {exam.suspendReason}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
