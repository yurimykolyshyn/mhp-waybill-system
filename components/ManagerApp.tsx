import React, { useState, useEffect } from 'react';
import { WaybillUser, Waybill, ManagerView } from '../types';
import { Backend } from '../services/backend';
import { MOCK_USERS } from '../mockData';
import Dashboard from './Dashboard';
import WaybillList from './WaybillList';
import { ListIcon, BusIcon, UserIcon, LogoutIcon, MenuIcon, ChartIcon } from './icons';

interface Props {
  user: WaybillUser;
  onLogout: () => void;
}

const MHP_BLUE = '#003A5D';

const NAV = [
  { v: 'dashboard' as ManagerView, Icon: ChartIcon, label: 'Дашборд' },
  { v: 'waybills' as ManagerView, Icon: ListIcon, label: 'ШЛ' },
  { v: 'vehicles' as ManagerView, Icon: BusIcon, label: 'ТЗ' },
  { v: 'users' as ManagerView, Icon: UserIcon, label: 'Водії' },
];

const ROLE_LABELS: Record<string, string> = {
  driver: 'Водій', dispatcher: 'Диспетчер', mechanic: 'Механік',
  logist: 'Логіст', admin: 'Адміністратор',
};

export default function ManagerApp({ user, onLogout }: Props) {
  const [view, setView] = useState<ManagerView>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [waybills, setWaybills] = useState<Waybill[]>([]);

  useEffect(() => {
    setWaybills(Backend.waybills.getAll());
  }, []);

  const handleUpdateWaybill = (wb: Waybill) => {
    Backend.waybills.save(wb);
    setWaybills(prev => prev.map(w => w.id === wb.id ? wb : w));
  };

  const vehicles = Backend.vehicles.getAll();

  return (
    <div className="min-h-screen bg-surface flex">
      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full bg-white border-r border-border shadow-sm z-30 transition-all duration-200 flex flex-col ${sidebarOpen ? 'w-56' : 'w-16'}`}
      >
        {/* Logo */}
        <div className="px-4 py-5 border-b border-border flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: MHP_BLUE }}>
            <span className="text-white font-black text-xs">МХП</span>
          </div>
          {sidebarOpen && (
            <div className="overflow-hidden">
              <p className="font-bold text-gray-800 text-sm leading-tight">МХП Логістика</p>
              <p className="text-gray-400 text-xs leading-tight">Шляхові листи</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3">
          {NAV.map(({ v, Icon, label }) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className="w-full flex items-center gap-3 px-4 py-2.5 transition-colors"
              style={view === v
                ? { background: '#E6EEF4', color: MHP_BLUE, fontWeight: 600 }
                : { color: '#6b7280' }
              }
            >
              <Icon className="w-5 h-5 shrink-0" />
              {sidebarOpen && <span className="text-sm">{label}</span>}
            </button>
          ))}
        </nav>

        {/* User + Logout */}
        <div className="border-t border-border p-3">
          {sidebarOpen && (
            <div className="mb-2 px-1">
              <p className="text-xs font-semibold text-gray-700 truncate">
                {user.fullName.split(' ')[0]} {user.fullName.split(' ')[1]?.[0]}.
              </p>
              <p className="text-xs text-gray-400">{ROLE_LABELS[user.role]}</p>
            </div>
          )}
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-gray-500 transition-colors hover:bg-primary-light hover:text-primary"
          >
            <LogoutIcon className="w-4 h-4 shrink-0" />
            {sidebarOpen && <span className="text-sm">Вийти</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className={`flex-1 transition-all duration-200 ${sidebarOpen ? 'ml-56' : 'ml-16'}`}>
        {/* Top bar */}
        <header className="bg-white border-b border-border px-6 py-3 flex items-center gap-4 sticky top-0 z-20">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-xl hover:bg-primary-light transition-colors"
            style={{ color: '#6b7280' }}
          >
            <MenuIcon className="w-5 h-5" />
          </button>
          <h2 className="font-semibold text-gray-800">
            {NAV.find(n => n.v === view)?.label}
          </h2>
          <div className="ml-auto text-xs text-gray-400">
            {new Date().toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        </header>

        {/* Content */}
        <main className="overflow-auto">
          {view === 'dashboard' && <Dashboard waybills={waybills} />}
          {view === 'waybills' && <WaybillList waybills={waybills} onUpdate={handleUpdateWaybill} />}
          {view === 'vehicles' && <VehiclesView vehicles={vehicles} />}
          {view === 'users' && <UsersView />}
        </main>
      </div>
    </div>
  );
}

function VehiclesView({ vehicles }: { vehicles: ReturnType<typeof Backend.vehicles.getAll> }) {
  return (
    <div className="p-6 max-w-4xl space-y-4">
      <h1 className="text-2xl font-bold text-gray-800">Транспортні засоби</h1>
      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface">
              {['Номер', 'Модель', 'Тип', 'Останній одометр'].map(h => (
                <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {vehicles.map(v => (
              <tr key={v.id} className="hover:bg-surface transition-colors">
                <td className="px-5 py-3 font-semibold text-gray-800">{v.number}</td>
                <td className="px-5 py-3 text-gray-600">{v.model}</td>
                <td className="px-5 py-3">
                  <span
                    className="px-2 py-0.5 rounded-full text-xs font-semibold"
                    style={v.type === 'regular'
                      ? { background: '#E6EEF4', color: '#003A5D' }
                      : { background: '#FAF0EF', color: '#BC6261' }}
                  >
                    {v.type === 'regular' ? 'Основний' : 'Резервний'}
                  </span>
                </td>
                <td className="px-5 py-3 text-gray-600">{v.lastOdometer.toLocaleString()} км</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function UsersView() {
  const users = MOCK_USERS.filter(u => u.role === 'driver');
  return (
    <div className="p-6 max-w-4xl space-y-4">
      <h1 className="text-2xl font-bold text-gray-800">Водії</h1>
      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface">
              {['ПІБ', 'Логін', 'Тип'].map(h => (
                <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-surface transition-colors">
                <td className="px-5 py-3 font-medium text-gray-800">{u.fullName}</td>
                <td className="px-5 py-3 text-gray-500 font-mono text-xs">{u.login}</td>
                <td className="px-5 py-3">
                  {u.isApprentice
                    ? <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: '#FAF0EF', color: '#BC6261' }}>Стажер</span>
                    : <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: '#DCFCE7', color: '#166534' }}>Водій</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
