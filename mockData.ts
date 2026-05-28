import { WaybillUser, Vehicle, TechOperation, Waybill } from './types';

export const MOCK_USERS: WaybillUser[] = [
  { id: 'u1', fullName: 'Іваненко Петро Михайлович', login: 'ivanenko', password: '1234', role: 'driver' },
  { id: 'u2', fullName: 'Коваленко Василь Іванович', login: 'kovalenko', password: '1234', role: 'driver' },
  { id: 'u3', fullName: 'Мельник Олена Сергіївна', login: 'melnyk', password: '1234', role: 'driver' },
  { id: 'u4', fullName: 'Шевченко Андрій Вікторович', login: 'shevchenko', password: '1234', role: 'driver' },
  { id: 'u5', fullName: 'Бондаренко Наталія Олексіївна', login: 'bondarenko', password: '1234', role: 'driver' },
  { id: 'u6', fullName: 'Ткаченко Ігор Петрович', login: 'tkachenko', password: '1234', role: 'driver', isApprentice: true },
  { id: 'u7', fullName: 'Руда Наталія Вікторівна', login: 'ruda', password: 'admin', role: 'logist' },
  { id: 'u8', fullName: 'Мороз Сергій Олегович', login: 'moroz', password: 'admin', role: 'dispatcher' },
  { id: 'u9', fullName: 'Адміністратор', login: 'admin', password: 'admin', role: 'admin' },
  { id: 'u10', fullName: 'Петренко Галина Іванівна', login: 'petrenkomd', password: 'med123', role: 'medic' },
];

export const MOCK_VEHICLES: Vehicle[] = [
  { id: 'v1', number: '№ 101', model: 'ПАЗ-3205', type: 'regular', lastOdometer: 124580 },
  { id: 'v2', number: '№ 102', model: 'ПАЗ-3205', type: 'regular', lastOdometer: 98240 },
  { id: 'v3', number: '№ 103', model: 'Богдан А09', type: 'regular', lastOdometer: 211340 },
  { id: 'v4', number: '№ 104', model: 'Богдан А09', type: 'regular', lastOdometer: 176920 },
  { id: 'v5', number: '№ 105', model: 'Mercedes Sprinter', type: 'regular', lastOdometer: 87640 },
  { id: 'v6', number: '№ 201', model: 'ПАЗ-3205', type: 'reserve', lastOdometer: 143200 },
  { id: 'v7', number: '№ 202', model: 'Богдан А09', type: 'reserve', lastOdometer: 95100 },
];

export const MOCK_TECH_OPERATIONS: TechOperation[] = [
  { id: 'to1', name: 'Маршрутні перевезення' },
  { id: 'to2', name: 'Черговий підприємства' },
  { id: 'to3', name: 'Ремонт ТЗ' },
  { id: 'to4', name: 'Технічне обслуговування' },
  { id: 'to5', name: 'Тест-драйв' },
];

function iso(daysAgo: number, hour: number, min = 0): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, min, 0, 0);
  return d.toISOString();
}

export const MOCK_WAYBILLS: Waybill[] = [
  {
    id: 'w1', driverId: 'u1', driverName: 'Іваненко Петро Михайлович',
    vehicleId: 'v1', vehicleNumber: '№ 101',
    shift: 'I', openTime: iso(0, 7, 55), closeTime: iso(0, 17, 10),
    odometerStart: 124420, odometerEnd: 124580,
    techOperationId: 'to1', techOperationName: 'Маршрутні перевезення',
    status: 'closed', isApprentice: false, createdAt: iso(0, 7, 55),
  },
  {
    id: 'w2', driverId: 'u2', driverName: 'Коваленко Василь Іванович',
    vehicleId: 'v2', vehicleNumber: '№ 102',
    shift: 'I', openTime: iso(0, 8, 5),
    odometerStart: 98240,
    status: 'open', isApprentice: false, createdAt: iso(0, 8, 5),
  },
  {
    id: 'w3', driverId: 'u3', driverName: 'Мельник Олена Сергіївна',
    vehicleId: 'v3', vehicleNumber: '№ 103',
    shift: 'II', openTime: iso(0, 17, 2), closeTime: iso(0, 20, 45),
    odometerStart: 211100, odometerEnd: 211340,
    techOperationId: 'to1', techOperationName: 'Маршрутні перевезення',
    status: 'approved', isApprentice: false, createdAt: iso(0, 17, 2),
  },
  {
    id: 'w4', driverId: 'u4', driverName: 'Шевченко Андрій Вікторович',
    vehicleId: 'v6', vehicleNumber: '№ 201',
    shift: 'I', openTime: iso(0, 8, 0), closeTime: iso(0, 17, 0),
    odometerStart: 143050, odometerEnd: 143200,
    techOperationId: 'to2', techOperationName: 'Черговий підприємства',
    comment: 'резервний автобус',
    status: 'closed', isApprentice: false, createdAt: iso(0, 8, 0),
  },
  {
    id: 'w5', driverId: 'u6', driverName: 'Ткаченко Ігор Петрович',
    vehicleId: 'v1', vehicleNumber: '№ 101',
    shift: 'I', openTime: iso(0, 7, 55), closeTime: iso(0, 17, 10),
    odometerStart: 124420, odometerEnd: 124420,
    techOperationId: 'to1', techOperationName: 'Маршрутні перевезення',
    comment: 'стажер',
    status: 'closed', isApprentice: true, createdAt: iso(0, 7, 55),
  },
  {
    id: 'w6', driverId: 'u1', driverName: 'Іваненко Петро Михайлович',
    vehicleId: 'v1', vehicleNumber: '№ 101',
    shift: 'I', openTime: iso(1, 7, 58), closeTime: iso(1, 17, 5),
    odometerStart: 124260, odometerEnd: 124420,
    techOperationId: 'to1', techOperationName: 'Маршрутні перевезення',
    status: 'approved', isApprentice: false, createdAt: iso(1, 7, 58),
  },
  {
    id: 'w7', driverId: 'u2', driverName: 'Коваленко Василь Іванович',
    vehicleId: 'v2', vehicleNumber: '№ 102',
    shift: 'II', openTime: iso(1, 16, 55), closeTime: iso(1, 20, 50),
    odometerStart: 98110, odometerEnd: 98240,
    techOperationId: 'to1', techOperationName: 'Маршрутні перевезення',
    status: 'approved', isApprentice: false, createdAt: iso(1, 16, 55),
  },
  {
    id: 'w8', driverId: 'u5', driverName: 'Бондаренко Наталія Олексіївна',
    vehicleId: 'v5', vehicleNumber: '№ 105',
    shift: 'III', openTime: iso(1, 20, 3), closeTime: iso(1, 23, 55),
    odometerStart: 87500, odometerEnd: 87640,
    techOperationId: 'to3', techOperationName: 'Ремонт ТЗ',
    comment: 'не працює одометр на виїзді, показник орієнтовний',
    status: 'closed', isApprentice: false, createdAt: iso(1, 20, 3),
  },
];
