export interface Ride {
  id: number;
  name: string;
}

export interface Land {
  id: number;
  name: string;
  rides: Ride[];
}
