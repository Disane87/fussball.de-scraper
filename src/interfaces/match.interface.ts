export interface Match {
  date: Date;
  homeTeam: string;
  awayTeam: string;
  spielfrei: boolean;

  location?: string;

  locationCoords?: [number, number];
}
