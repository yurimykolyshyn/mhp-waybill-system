import React, { useState, useEffect } from 'react';
import { Waybill, WaybillUser, Vehicle, ShiftType } from '../types';
import { Backend, detectShift, uid } from '../services/backend';
import { MOCK_TECH_OPERATIONS } from '../mockData';
import { Modal, Field, ModalActions, inputCls } from './VehiclesView';
import { GaugeIcon } from './icons';

interface Props {
  onSave: (wb: Waybill) => void;
  onClose: () => void;
}

function toDatetimeLocal(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function CreateWaybillModal({ onSave, onClose }: Props) {
  const [drivers, setDrivers] = useState<WaybillUser[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  // Section 1 — required
  const [driverId, setDriverId] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [shift, setShift] = useState<ShiftType>(() => detectShift().shift === 'actual' ? 'actual' : detectShift().shift as ShiftType);
  const [openTime, setOpenTime] = useState(() => toDatetimeLocal(new Date()));
  const [odometerStart, setOdometerStart] = useState(0);

  // Section 2 — optional
  const [closeTime, setCloseTime] = useState('');
  const [odometerEnd, setOdometerEnd] = useState('');
  const [techOpId, setTechOpId] = useState('');
  const [comment, setComment] = useState('');
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

  const [error, setError] = useState('');

  useEffect(() => {
    setDrivers(Backend.users.getDrivers());
    setVehicles(Backend.vehicles.getAll());
  }, []);

  useEffect(() => {
    if (vehicleId) {
      setOdometerStart(Backend.vehicles.getLastOdometer(vehicleId));
    } else {
      setOdometerStart(0);
    }
  }, [vehicleId]);

  const selectedDriver = drivers.find(d => d.id === driverId);
  const selectedVehicle = vehicles.find(v => v.id === vehicleId);
  const closeTouched = !!(closeTime || odometerEnd || techOpId);
  const noDrivers = drivers.length === 0;
  const noVehicles = vehicles.length === 0;

  const clear = () => setError('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!driverId)  { setError('Оберіть водія'); return; }
    if (!vehicleId) { setError('Оберіть транспортний засіб'); return; }
    if (!openTime)  { setError('Вкажіть час відкриття'); return; }

    if (closeTouched) {
      if (!closeTime) { setError('Вкажіть час закриття'); return; }
      if (new Date(closeTime) < new Date(openTime)) {
        setError('Час закриття має бути після часу відкриття'); return;
      }
      const end = Number(odometerEnd);
      if (!odometerEnd || isNaN(end)) { setError('Вкажіть кінцевий одометр'); return; }
      if (end < odometerStart) { setError('Кінцевий одометр має бути ≥ початкового'); return; }
      if (!techOpId) { setError('Оберіть технологічну операцію'); return; }
    }

    const techOp = MOCK_TECH_OPERATIONS.find(t => t.id === techOpId);
    const openISO  = new Date(openTime).toISOString();
    const closeISO = closeTouched && closeTime ? new Date(closeTime).toISOString() : undefined;
    const end      = closeTouched ? Number(odometerEnd) : undefined;
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
  };

  return (
    <Modal title="Новий шляховий лист" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">

        {/* ── Section 1: Opening ───────────────────────────────────── */}
        <div className="space-y-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Відкриття зміни</p>

          <Field label="Водій *">
            <select
              value={driverId}
              onChange={e => { setDriverId(e.target.value); clear(); }}
              className={inputCls}
              disabled={noDrivers}
            >
              <option value="">{noDrivers ? 'Немає зареєстрованих водіїв' : '— Оберіть водія —'}</option>
              {drivers.map(d => (
                <option key={d.id} value={d.id}>
                  {d.fullName}{d.isApprentice ? ' (стажер)' : ''}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Транспортний засіб *">
            <select
              value={vehicleId}
              onChange={e => { setVehicleId(e.target.value); clear(); }}
              className={inputCls}
              disabled={noVehicles}
            >
              <option value="">{noVehicles ? 'Немає транспортних засобів' : '— Оберіть ТЗ —'}</option>
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

          {selectedVehicle && (
            <div className="rounded-xl px-4 py-3 flex items-center gap-3" style={{ background: '#E6EEF4' }}>
              <GaugeIcon className="w-4 h-4 shrink-0" style={{ color: '#003A5D' }} />
              <div>
                <p className="text-xs text-gray-500">Початковий одометр</p>
                <p className="text-sm font-bold" style={{ color: '#003A5D' }}>{odometerStart.toLocaleString()} км</p>
              </div>
            </div>
          )}

          <Field label="Зміна">
            <div className="flex gap-4 mt-1 flex-wrap">
              {(['I', 'II', 'III', 'actual'] as const).map(s => (
                <label key={s} className="flex items-center gap-1.5 cursor-pointer select-none">
                  <input
                    type="radio" name="shift" value={s}
                    checked={shift === s}
                    onChange={() => { setShift(s); clear(); }}
                    className="accent-primary"
                  />
                  <span className="text-sm text-gray-700">{s === 'actual' ? 'Факт.' : `${s} зміна`}</span>
                </label>
              ))}
            </div>
          </Field>

          <Field label="Час відкриття *">
            <input
              type="datetime-local"
              value={openTime}
              onChange={e => { setOpenTime(e.target.value); clear(); }}
              className={inputCls}
              required
            />
          </Field>
        </div>

        {/* ── Section 2: Closing (optional) ────────────────────────── */}
        <div className="border-t border-border pt-4 space-y-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Закриття зміни{' '}
            <span className="normal-case font-normal text-gray-400">(необов'язково)</span>
          </p>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Час закриття">
              <input
                type="datetime-local"
                value={closeTime}
                onChange={e => { setCloseTime(e.target.value); clear(); }}
                className={inputCls}
              />
            </Field>
            <Field label="Одометр (кінець)">
              <div className="relative">
                <input
                  type="number"
                  value={odometerEnd}
                  min={odometerStart}
                  onChange={e => { setOdometerEnd(e.target.value); clear(); }}
                  placeholder={String(odometerStart)}
                  className={inputCls + ' pr-8'}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">км</span>
              </div>
            </Field>
          </div>

          <Field label="Технологічна операція">
            <select
              value={techOpId}
              onChange={e => { setTechOpId(e.target.value); clear(); }}
              className={inputCls}
            >
              <option value="">— не обрано —</option>
              {MOCK_TECH_OPERATIONS.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </Field>

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

          <Field label="Коментар">
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              rows={2}
              className={inputCls + ' resize-none'}
            />
          </Field>
        </div>

        {error && (
          <p className="text-sm font-medium" style={{ color: '#BC6261' }}>{error}</p>
        )}

        <ModalActions
          onClose={onClose}
          label="Додати ШЛ"
          disabled={noDrivers || noVehicles}
        />
      </form>
    </Modal>
  );
}
