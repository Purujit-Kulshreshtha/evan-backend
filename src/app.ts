import { Request, Response } from "express";
import express from "express";
import http from "http";
import { Server, Socket } from "socket.io";
import { Game, GameStatus, User } from "./types";
import { defaultGameConfig } from "./constants";
import httpStatus from "http-status";
import { DefaultEventsMap } from "socket.io/dist/typed-events";

type SocketType = Socket<
  DefaultEventsMap,
  DefaultEventsMap,
  DefaultEventsMap,
  any
>;

const CURRENT_GAMES: Map<string, Game> = new Map();
const CURRENT_ROOMS_BY_USER: Map<string, string[]> = new Map(); //socket.id -> gameCode[]

const createGame = (gameCode: string, host: User, callback: any) => {
  if (CURRENT_GAMES.has(gameCode)) {
    callback({
      status: httpStatus.CONFLICT,
      error: "Game code already exists",
    });
    return;
  }

  const game: Game = {
    host: host,
    players: {},
    roomCode: gameCode,
    status: GameStatus.WAITING_FOR_PLAYERS,
    config: defaultGameConfig,
  };

  CURRENT_GAMES.set(gameCode, game);

  callback({ status: httpStatus.CREATED, game });
};

const updateGame = (game: Game, gameCode: string, socket: SocketType) => {
  socket.broadcast.to(gameCode).emit("game-updated", game);
};

const joinGame = (
  gameCode: string,
  player: User,
  callback: any,
  socket: SocketType
) => {
  const game = CURRENT_GAMES.get(gameCode);
  if (!game) {
    callback({ status: httpStatus.NOT_FOUND, error: "Game not found" });
    return;
  }

  const updatedPlayers = game.players;
  updatedPlayers[socket.id] = player.name;

  const updatedGame: Game = {
    ...game,
    players: updatedPlayers,
  };
  CURRENT_GAMES.set(gameCode, updatedGame);

  const existing_user_games = CURRENT_ROOMS_BY_USER.get(socket.id) || [];
  CURRENT_ROOMS_BY_USER.set(socket.id, [...existing_user_games, gameCode]);

  socket.join(gameCode);

  updateGame(updatedGame, gameCode, socket);

  callback({ status: httpStatus.OK, game: updatedGame });
};

const leaveGame = (gameCode: string, socket: SocketType) => {
  const game = CURRENT_GAMES.get(gameCode);
  if (!game) {
    return;
  }

  const updatedPlayers = game.players;
  delete updatedPlayers[socket.id];

  const updatedGame: Game = {
    ...game,
    players: updatedPlayers,
  };
  CURRENT_GAMES.set(gameCode, updatedGame);

  socket.leave(gameCode);

  updateGame(updatedGame, gameCode, socket);
};

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const port = process.env.PORT || 8080;

app.get("/", function (req: Request, res: Response) {
  res.send("Hello world!");
});

server.listen(port, function () {
  console.log(`Listening on port ${port}`);
});

io.on("connection", (socket) => {
  socket.on(
    "create-game",
    ({ gameCode, host }: { gameCode: string; host: User }, callback: any) => {
      createGame(gameCode, host, callback);
    }
  );

  socket.on("join-game", (gameCode: string, player: User, callback: any) => {
    joinGame(gameCode, player, callback, socket);
  });

  socket.on("leave-game", (gameCode: string) => {
    leaveGame(gameCode, socket);
  });

  socket.on("fetch-game", (gameCode: string, callback: any) => {
    const game = CURRENT_GAMES.get(gameCode);
    if (!game) {
      callback({ status: httpStatus.NOT_FOUND, error: "Game not found" });
      return;
    }
    callback({ status: httpStatus.OK, game });
  });

  socket.on("disconnect", () => {
    const existing_user_games = CURRENT_ROOMS_BY_USER.get(socket.id) || [];
    existing_user_games.forEach((gameCode) => {
      leaveGame(gameCode, socket);
    });
  });
});
