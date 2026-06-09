import React, { useState, useEffect } from 'react';
import { WaybillUser, Waybill, ManagerView } from '../types';
import { Backend } from '../services/backend';
import Dashboard from './Dashboard';
import WaybillList from './WaybillList';
import VehiclesView from './VehiclesView';
import DriversView from './DriversView';
import { ListIcon, BusIcon, UserIcon, LogoutIcon, MenuIcon, ChartIcon, CalendarIcon, ClipboardListIcon } from './icons';
import AssignmentsView from './AssignmentsView';
import TodayView from './TodayView';

interface Props {
  user: WaybillUser;
  onLogout: () => void;
}

const MHP_BLUE = '#003A5D';

function getNav(role: string): { v: ManagerView; Icon: React.FC<any>; label: string }[] {
  const all: { v: ManagerView; Icon: React.FC<any>; label: string }[] = [
    { v: 'dashboard',   Icon: ChartIcon,        label: 'Дашборд' },
    { v: 'assignments', Icon: CalendarIcon,      label: 'Наряди' },
    { v: 'today',       Icon: ClipboardListIcon, label: 'На сьогодні' },
    { v: 'waybills',    Icon: ListIcon,          label: 'ШЛ' },
    { v: 'vehicles',    Icon: BusIcon,           label: 'ТЗ' },
    { v: 'users',       Icon: UserIcon,          label: 'Водії' },
  ];
  const roleViews: Record<string, ManagerView[]> = {
    logist:     ['dashboard', 'assignments', 'waybills', 'vehicles', 'users'],
    dispatcher: ['dashboard', 'today', 'waybills', 'vehicles', 'users'],
    admin:      ['dashboard', 'assignments', 'today', 'waybills', 'vehicles', 'users'],
    mechanic:   ['dashboard', 'waybills', 'vehicles'],
  };
  const allowed = roleViews[role] ?? ['dashboard', 'waybills', 'vehicles', 'users'];
  return all.filter(n => allowed.includes(n.v));
}

const ROLE_LABELS: Record<string, string> = {
  driver: 'Водій', dispatcher: 'Диспетчер', mechanic: 'Механік',
  logist: 'Логіст', admin: 'Адміністратор',
};

export default function ManagerApp({ user, onLogout }: Props) {
  const defaultView: ManagerView =
    user.role === 'logist' ? 'assignments' :
    user.role === 'dispatcher' ? 'today' :
    'dashboard';
  const [view, setView] = useState<ManagerView>(defaultView);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [waybills, setWaybills] = useState<Waybill[]>([]);

  useEffect(() => {
    setWaybills(Backend.waybills.getAll());
  }, []);

  const handleUpdateWaybill = (wb: Waybill) => {
    Backend.waybills.save(wb);
    setWaybills(prev => prev.map(w => w.id === wb.id ? wb : w));
  };

  const handleAddWaybill = (wb: Waybill) => {
    Backend.waybills.save(wb);
    if (wb.odometerEnd) Backend.vehicles.updateOdometer(wb.vehicleId, wb.odometerEnd);
    setWaybills(prev => [...prev, wb]);
  };

  return (
    <div className="min-h-screen bg-surface flex">
      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full bg-white border-r border-border shadow-sm z-30 transition-all duration-200 flex flex-col ${sidebarOpen ? 'w-56' : 'w-16'}`}
      >
        {/* Logo */}
        <div className="px-4 h-16 border-b border-border flex items-center gap-3 shrink-0">
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
          {getNav(user.role).map(({ v, Icon, label }) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className="w-full flex items-center gap-3 px-4 py-2.5 transition-colors focus:outline-none"
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
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-gray-500 transition-colors hover:bg-primary-light hover:text-primary focus:outline-none"
          >
            <LogoutIcon className="w-4 h-4 shrink-0" />
            {sidebarOpen && <span className="text-sm">Вийти</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className={`flex-1 transition-all duration-200 ${sidebarOpen ? 'ml-56' : 'ml-16'}`}>
        {/* Top bar */}
        <header className="bg-white border-b border-border px-6 h-16 flex items-center gap-4 sticky top-0 z-20">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-xl hover:bg-primary-light transition-colors focus:outline-none"
            style={{ color: '#6b7280' }}
          >
            <MenuIcon className="w-5 h-5" />
          </button>
          <h2 className="font-semibold text-gray-800">
            {getNav(user.role).find(n => n.v === view)?.label ?? view}
          </h2>
          <div className="ml-auto text-xs text-gray-400">
            {new Date().toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        </header>

        {/* Content */}
        <main className="overflow-auto">
          {view === 'dashboard' && <Dashboard waybills={waybills} />}
          {view === 'waybills' && <WaybillList waybills={waybills} onUpdate={handleUpdateWaybill} onAdd={handleAddWaybill} />}
          {view === 'vehicles' && <VehiclesView />}
          {view === 'users' && <DriversView />}
          {view === 'assignments' && <AssignmentsView />}
          {view === 'today' && <TodayView />}
        </main>
      </div>
    </div>
  );
}
