export type UserRole = 'driver' | 'dispatcher' | 'mechanic' | 'logist' | 'admin';

export interface WaybillUser {
  id: string;
  fullName: string;
  login: string;
  password: string;
  role: UserRole;
  isApprentice?: boolean;
}

export interface Vehicle {
  id: string;
  number: string;
  model: string;
  type: 'regular' | 'reserve';
  lastOdometer: number;
}

export interface TechOperation {
  id: string;
  name: string;
}

export type ShiftType = 'I' | 'II' | 'III' | 'actual';
export type WaybillStatus = 'open' | 'closed' | 'approved';

export interface Waybill {
  id: string;
  driverId: string;
  driverName: string;
  vehicleId: string;
  vehicleNumber: string;
  shift: ShiftType;
  openTime: string;       // ISO
  closeTime?: string;     // ISO
  odometerStart: number;
  odometerEnd?: number;
  techOperationId?: string;
  techOperationName?: string;
  comment?: string;
  status: WaybillStatus;
  isApprentice: boolean;
  createdAt: string;      // ISO
}

export type ManagerView = 'dashboard' | 'waybills' | 'vehicles' | 'users';
