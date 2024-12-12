export interface Position {
  x: number;
  y: number;
}

export interface Asteroid extends Position {
  id: string;
  rotation: number;
  speed: number;
  destroyed: boolean;
}

export interface Laser extends Position {
  id: string;
  speed: number;
}

export interface Explosion extends Position {
  id: string;
}