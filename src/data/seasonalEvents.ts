import type { Ride } from '../types';

// Seasonal events are hard-coded with year-agnostic MM-DD date ranges so they
// auto-appear / disappear based on today's date. Dates are approximate — Disney
// usually announces exact dates a few months out. Update as needed.
//
// IDs are 6-digit so they can never collide with attraction IDs (4-digit) or
// show IDs (4-digit). Stable across years so star / visited state persists.
interface SeasonalEvent {
  id: number;
  parkId: number;
  name: string;
  start: string; // MM-DD
  end: string; // MM-DD; if end < start, range wraps year-end
}

const EVENTS: SeasonalEvent[] = [
  // EPCOT festivals (run nearly year-round, back-to-back)
  { id: 105001, parkId: 5, name: 'EPCOT International Festival of the Arts', start: '01-10', end: '02-23' },
  { id: 105002, parkId: 5, name: 'EPCOT International Flower & Garden Festival', start: '02-25', end: '07-19' },
  { id: 105003, parkId: 5, name: 'EPCOT International Food & Wine Festival', start: '07-25', end: '11-22' },
  { id: 105004, parkId: 5, name: 'EPCOT International Festival of the Holidays', start: '11-24', end: '12-30' },

  // Magic Kingdom hard-ticket events
  { id: 106001, parkId: 6, name: "Mickey's Not-So-Scary Halloween Party", start: '08-12', end: '11-01' },
  { id: 106002, parkId: 6, name: "Mickey's Very Merry Christmas Party", start: '11-08', end: '12-22' },

  // Hollywood Studios hard-ticket event
  { id: 107001, parkId: 7, name: 'Disney Jollywood Nights', start: '11-08', end: '12-22' },
];

function todayMonthDay(d: Date): string {
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${mm}-${dd}`;
}

function isActive(event: SeasonalEvent, mmdd: string): boolean {
  if (event.start <= event.end) return mmdd >= event.start && mmdd <= event.end;
  return mmdd >= event.start || mmdd <= event.end;
}

export function getActiveEvents(parkId: number, today: Date = new Date()): Ride[] {
  const mmdd = todayMonthDay(today);
  return EVENTS.filter((e) => e.parkId === parkId && isActive(e, mmdd)).map((e) => ({
    id: e.id,
    name: e.name,
  }));
}
