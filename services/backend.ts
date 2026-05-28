import { Waybill, Vehicle, WaybillUser, MedicalExam } from '../types';
import { MOCK_WAYBILLS, MOCK_VEHICLES, MOCK_USERS } from '../mockData';

const KEY_WAYBILLS = 'mhp_waybills';
const KEY_VEHICLES = 'mhp_vehicles';
const KEY_USERS    = 'mhp_users';
const KEY_EXAMS    = 'mhp_exams';

function loadWaybills(): Waybill[] {
  try {
    const raw = localStorage.getItem(KEY_WAYBILLS);
    return raw ? JSON.parse(raw) : null;
  } catch { return null as any; }
}

function saveWaybills(waybills: Waybill[]) {
  localStorage.setItem(KEY_WAYBILLS, JSON.stringify(waybills));
}

function loadVehicles(): Vehicle[] {
  try {
    const raw = localStorage.getItem(KEY_VEHICLES);
    return raw ? JSON.parse(raw) : null;
  } catch { return null as any; }
}

function saveVehicles(vehicles: Vehicle[]) {
  localStorage.setItem(KEY_VEHICLES, JSON.stringify(vehicles));
}

function loadUsers(): WaybillUser[] {
  try {
    const raw = localStorage.getItem(KEY_USERS);
    return raw ? JSON.parse(raw) : null;
  } catch { return null as any; }
}

function saveUsers(users: WaybillUser[]) {
  localStorage.setItem(KEY_USERS, JSON.stringify(users));
}

function loadExams(): MedicalExam[] {
  try {
    const raw = localStorage.getItem(KEY_EXAMS);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveExams(exams: MedicalExam[]) {
  localStorage.setItem(KEY_EXAMS, JSON.stringify(exams));
}

export const Backend = {
  initialize() {
    if (!localStorage.getItem(KEY_WAYBILLS)) saveWaybills(MOCK_WAYBILLS);
    if (!localStorage.getItem(KEY_VEHICLES)) saveVehicles(MOCK_VEHICLES);
    if (!localStorage.getItem(KEY_USERS))    saveUsers(MOCK_USERS);
    if (!localStorage.getItem(KEY_EXAMS))    saveExams([]);
  },

  reset() {
    saveWaybills(MOCK_WAYBILLS);
    saveVehicles(MOCK_VEHICLES);
    saveUsers(MOCK_USERS);
    saveExams([]);
  },

  users: {
    getAll(): WaybillUser[] { return loadUsers() || MOCK_USERS; },
    getDrivers(): WaybillUser[] {
      return Backend.users.getAll().filter(u => u.role === 'driver');
    },
    findByLogin(login: string, password: string): WaybillUser | null {
      return Backend.users.getAll().find(u => u.login === login && u.password === password) || null;
    },
    save(user: WaybillUser): WaybillUser {
      const all = Backend.users.getAll();
      const idx = all.findIndex(u => u.id === user.id);
      if (idx >= 0) all[idx] = user; else all.push(user);
      saveUsers(all);
      return user;
    },
    delete(id: string) {
      saveUsers(Backend.users.getAll().filter(u => u.id !== id));
    },
    isLoginTaken(login: string, excludeId?: string): boolean {
      return Backend.users.getAll().some(u => u.login === login && u.id !== excludeId);
    },
  },

  vehicles: {
    getAll(): Vehicle[] { return loadVehicles() || MOCK_VEHICLES; },
    save(vehicle: Vehicle): Vehicle {
      const all = Backend.vehicles.getAll();
      const idx = all.findIndex(v => v.id === vehicle.id);
      if (idx >= 0) all[idx] = vehicle; else all.push(vehicle);
      saveVehicles(all);
      return vehicle;
    },
    delete(id: string) {
      saveVehicles(Backend.vehicles.getAll().filter(v => v.id !== id));
    },
    updateOdometer(vehicleId: string, odometer: number) {
      const all = Backend.vehicles.getAll();
      const v = all.find(v => v.id === vehicleId);
      if (v) { v.lastOdometer = odometer; saveVehicles(all); }
    },
    getLastOdometer(vehicleId: string): number {
      const all = Backend.vehicles.getAll();
      // Also check if there's a more recent closed waybill
      const waybills = Backend.waybills.getAll();
      const lastClosed = waybills
        .filter(w => w.vehicleId === vehicleId && w.status !== 'open' && w.odometerEnd != null)
        .sort((a, b) => new Date(b.closeTime!).getTime() - new Date(a.closeTime!).getTime())[0];
      if (lastClosed?.odometerEnd) return lastClosed.odometerEnd;
      return all.find(v => v.id === vehicleId)?.lastOdometer || 0;
    },
  },

  exams: {
    getAll(): MedicalExam[] { return loadExams(); },
    getByDriver(driverId: string): MedicalExam[] {
      return loadExams().filter(e => e.driverId === driverId);
    },
    getToday(): MedicalExam[] {
      const today = new Date().toDateString();
      return loadExams().filter(e => new Date(e.date).toDateString() === today);
    },
    save(exam: MedicalExam): MedicalExam {
      const all = loadExams();
      const idx = all.findIndex(e => e.id === exam.id);
      if (idx >= 0) all[idx] = exam; else all.push(exam);
      saveExams(all);
      return exam;
    },
    getActiveClearance(driverId: string, shift: string, date: Date): MedicalExam | null {
      const dateStr = date.toDateString();
      return loadExams().find(e =>
        e.driverId === driverId &&
        e.shift === shift &&
        new Date(e.date).toDateString() === dateStr &&
        e.result === 'cleared'
      ) || null;
    },
    getShiftExam(driverId: string, shift: string, date: Date): MedicalExam | null {
      const dateStr = date.toDateString();
      return loadExams().find(e =>
        e.driverId === driverId &&
        e.shift === shift &&
        new Date(e.date).toDateString() === dateStr
      ) || null;
    },
  },

  waybills: {
    getAll(): Waybill[] { return loadWaybills() || MOCK_WAYBILLS; },
    getByDriver(driverId: string): Waybill[] {
      return Backend.waybills.getAll().filter(w => w.driverId === driverId);
    },
    getOpenByDriver(driverId: string): Waybill | null {
      return Backend.waybills.getAll().find(w => w.driverId === driverId && w.status === 'open') || null;
    },
    save(waybill: Waybill): Waybill {
      const all = Backend.waybills.getAll();
      const idx = all.findIndex(w => w.id === waybill.id);
      if (idx >= 0) all[idx] = waybill; else all.push(waybill);
      saveWaybills(all);
      return waybill;
    },
    delete(id: string) {
      const all = Backend.waybills.getAll().filter(w => w.id !== id);
      saveWaybills(all);
    },
  },
};

// Shift detection: window is shift_time ± 1.5h
export function detectShift(date: Date = new Date()): { shift: 'I' | 'II' | 'III' | 'actual'; label: string } {
  const minutes = date.getHours() * 60 + date.getMinutes();
  const shifts = [
    { shift: 'I' as const,   center: 8 * 60,  label: 'I зміна (08:00–08:00)' },
    { shift: 'II' as const,  center: 17 * 60, label: 'II зміна (17:00–17:00)' },
    { shift: 'III' as const, center: 20 * 60, label: 'III зміна (20:00–20:00)' },
  ];
  const WINDOW = 90; // 1.5 hours in minutes
  for (const s of shifts) {
    if (Math.abs(minutes - s.center) <= WINDOW) return s;
  }
  return { shift: 'actual', label: 'Фактичний час' };
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function formatDateTime(iso: string): string {
  return `${formatDate(iso)} ${formatTime(iso)}`;
}

export function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}
