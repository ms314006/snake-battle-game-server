const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const SnakeGame = require('./class/SnakeGame');
const app = express();

app.use(cors());
const port = process.env.PORT || 3000;
const server = require('http').Server(app)
  .listen(port,()=>{console.log('open server!')});

const io = require('socket.io')(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const socketQueue = [];
const roomsMap = {};
const intervalMap = {};

io.on('connection', socket => {
  socketQueue.unshift(socket);
  console.log('current queue', socketQueue);
  if (socketQueue.length >= 2) {
    const player1 = socketQueue.pop();
    const player2 = socketQueue.pop();
    const roomId = uuidv4();
    [player1, player2].forEach((player) => {
      player.emit('foundCompetitor', roomId);
    });
  }

  socket.on('joinInToRoom', ({ playerId, playerRoomId }) => {
    if (roomsMap[playerRoomId] === undefined) {
      roomsMap[playerRoomId] = {};
    }
    socket.join(playerRoomId);
    roomsMap[playerRoomId][playerId] = {
      socket,
      playerId,
      snakeGame: new SnakeGame(),
    };
    const players = Object.keys(roomsMap[playerRoomId]);
    if (players.length === 1) {
      socket.emit('waitingForAnotherPlayer');
    }

    if (players.length === 2) {
      players.forEach((playerId) => {
        const { socket } = roomsMap[playerRoomId][playerId];
        socket.emit('playersIsReady');
      });
      const increaseSpeed = () => {
        const fps = roomsMap[playerRoomId][playerId].snakeGame.fps;
        if (fps <= 20) {
          const intervalId = setInterval(
            () => startSnakeGame(playerRoomId), 1000 / fps
          );
          clearInterval(intervalMap[playerRoomId]);
          intervalMap[playerRoomId] = intervalId;
          roomsMap[playerRoomId][playerId].snakeGame.fps += 1;
        }
      };
      increaseSpeed();
      setInterval(increaseSpeed, 15000);
    }
  });

  socket.on('setSnakeDirection', ({ playerId, playerRoomId, directionKeyCode }) => {
    const { snakeGame } = roomsMap[playerRoomId][playerId];
    const [TOP, RIGHT, BOTTOM, LEFT] = [38, 39, 40, 37];
    switch (directionKeyCode) {
      case TOP:
        if (snakeGame.snake.currentMoveDirection === BOTTOM) return;
        snakeGame.snake.setDisplacement(0, -1);
        break;
      case RIGHT:
        if (snakeGame.snake.currentMoveDirection === LEFT) return;
        snakeGame.snake.setDisplacement(1, 0);
        break;
      case BOTTOM:
        if (snakeGame.snake.currentMoveDirection === TOP) return;
        snakeGame.snake.setDisplacement(0, 1);
        break;
      case LEFT:
        if (snakeGame.snake.currentMoveDirection === RIGHT) return;
        snakeGame.snake.setDisplacement(-1, 0);
        break;
      default:
        return;
    }

    snakeGame.isStartGame = true;
    snakeGame.snake.currentMoveDirection = directionKeyCode;
  });
});

const startSnakeGame = (playerRoomId) => {
  const players = Object.keys(roomsMap[playerRoomId]);

  for (const [index, playerId] of players.entries()) {
    let { socket, snakeGame } = roomsMap[playerRoomId][playerId];
    const competitor = roomsMap[playerRoomId][players[index === 1 ? 0 : 1]];

    if (snakeGame.snake.isAteApple(snakeGame.apple.position)) {
      snakeGame.snake.addLength(1);
      competitor.snakeGame.snake.addLength(2);
      const nextApplePosition = snakeGame.generateNewApplePosition();
      snakeGame.apple.position = nextApplePosition;
    }
    const nextSnakeHeadPosition = snakeGame.generateNextSnakePosition();

    if (snakeGame.isStartGame && snakeGame.snake.isTouchBody(nextSnakeHeadPosition)) {
      snakeGame = new SnakeGame({ ...snakeGame, isEndGame: true, isWinner: false });
      competitor.snakeGame =  new SnakeGame({
        ...competitor.snakeGame,
        isWinner: true,
        isEndGame: true
      });
      socket.emit(
        'updateSnakeGame',
        { playerId, snakeGame, competitorSnakeGame: competitor.snakeGame }
      );
      competitor.socket.emit(
        'updateSnakeGame',
        { playerId, snakeGame: competitor.snakeGame, competitorSnakeGame: snakeGame }
      );
      clearInterval(intervalMap[playerRoomId]);

      delete intervalMap[playerRoomId];
      delete roomsMap[playerRoomId];
      break;
    }
    snakeGame.snake.headPosition = nextSnakeHeadPosition;

    if (!snakeGame.isEndGame && !competitor.snakeGame.isEndGame) {
      socket.emit(
        'updateSnakeGame',
        { playerId, snakeGame, competitorSnakeGame: competitor.snakeGame }
      );
    }
  }
}
