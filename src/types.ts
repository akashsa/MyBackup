export interface Ride {
  id: number;
  name: string;
  // Used for rides we know are closed for refurbishment / permanently when the
  // live API doesn't return info for them. Ignored if the API does return info.
  staticStatus?: 'REFURBISHMENT' | 'CLOSED';
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
