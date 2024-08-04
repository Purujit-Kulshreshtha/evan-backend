export type User = {
  name: string;
  socketId?: string;
  color: string;
};

export type Game = {
  roomCode: string;
  host: User;
  players: Record<string, User>;
  status: GameStatus;
  config: GameConfig;
};

export type GameConfig = {
  safeMode: boolean;
  floofs: number;
  flafs: number;
};

export enum GameStatus {
  WAITING_FOR_PLAYERS,
  PREPARING,
  IN_PROGRESS,
}
