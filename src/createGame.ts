if (CURRENT_GAMES.has(gameCode)) {
      callback({
        status: httpStatus.CONFLICT,
        error: "Game code already exists",
      });
      return;
    }

    const game: Game = {
      host: host,
      players: [host],
      roomCode: gameCode,
      status: GameStatus.WAITING_FOR_PLAYERS,
      config: defaultGameConfig,
    };

    CURRENT_GAMES.set(gameCode, game);

    socket.join(gameCode);
    callback({ status: httpStatus.CREATED, game });