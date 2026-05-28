export interface Park {
  id: number;
  name: string;
  short: string;
  // Known themeparks.wiki UUID. Omitted for parks we resolve by name instead.
  themeparksId?: string;
  // Name fragment used to look up the themeparks.wiki UUID at runtime.
  resolveName?: string;
}

export const WDW_PARKS: Park[] = [
  {
    id: 6,
    name: 'Magic Kingdom',
    short: 'MK',
    themeparksId: '75ea578a-adc8-4116-a54d-dccb60765ef9',
  },
  {
    id: 5,
    name: 'EPCOT',
    short: 'EP',
    themeparksId: '47f90d2c-e191-4239-a466-5892ef59a88b',
  },
  {
    id: 7,
    name: 'Hollywood Studios',
    short: 'HS',
    themeparksId: '288747d1-8b4f-4a64-867e-ea7c9b27bad8',
  },
  {
    id: 8,
    name: 'Animal Kingdom',
    short: 'AK',
    themeparksId: '1c84a229-8862-4648-9c71-378ddd2c7693',
  },
  {
    id: 30,
    name: 'Blizzard Beach',
    short: 'BB',
    resolveName: 'Blizzard Beach',
  },
  {
    id: 31,
    name: 'Typhoon Lagoon',
    short: 'TL',
    resolveName: 'Typhoon Lagoon',
  },
];

export const DEFAULT_PARK_ID = WDW_PARKS[0].id;

export function getPark(id: number): Park | undefined {
  return WDW_PARKS.find((p) => p.id === id);
}
