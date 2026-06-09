export type UserRole = 'driver' | 'dispatcher' | 'mechanic' | 'logist' | 'admin' | 'medic';

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
export type WaybillStatus = 'open' | 'closed' | 'approved' | 'planned';

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
  examId?: string;
  additionalTechOps?: { id: string; name: string }[];
  status: WaybillStatus;
  isApprentice: boolean;
  createdAt: string;      // ISO
}

export type DrugTestResult = 'not_done' | 'negative' | 'positive';

export interface MedicalExam {
  id: string;
  driverId: string;
  driverName: string;
  medicId: string;
  medicName: string;
  date: string;            // ISO
  shift: ShiftType;
  // Physiological — all optional
  bpSystolic?: number;
  bpDiastolic?: number;
  pulse?: number;
  alcoholMgl?: number;
  drugTest?: DrugTestResult;
  complaints?: string;
  // Result — required
  result: 'cleared' | 'suspended';
  suspendReason?: string;  // required when result === 'suspended'
  createdAt: string;       // ISO
}

export type ManagerView = 'dashboard' | 'waybills' | 'vehicles' | 'users' | 'assignments' | 'today';
