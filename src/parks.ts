export interface Park {
  id: number;
  name: string;
  short: string;
}

export const WDW_PARKS: Park[] = [
  { id: 6, name: 'Magic Kingdom', short: 'MK' },
  { id: 5, name: 'EPCOT', short: 'EP' },
  { id: 7, name: 'Hollywood Studios', short: 'HS' },
  { id: 8, name: 'Animal Kingdom', short: 'AK' },
];

export const DEFAULT_PARK_ID = WDW_PARKS[0].id;
