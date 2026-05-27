export interface Ride {
  id: number;
  name: string;
}

export interface Land {
  id: number;
  name: string;
  rides: Ride[];
}

export interface Showtime {
  startTime: string;
  endTime: string;
}

export interface LiveInfo {
  status: 'OPERATING' | 'CLOSED' | 'DOWN' | 'REFURBISHMENT' | string;
  waitTime?: number;
  showtimes?: Showtime[];
}
