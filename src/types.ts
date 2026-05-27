export interface Ride {
  id: number;
  name: string;
}

export interface Land {
  id: number;
  name: string;
  rides: Ride[];
}

export interface WaitInfo {
  wait_time: number;
  is_open: boolean;
}
