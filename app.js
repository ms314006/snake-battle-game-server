const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const SnakeGame = require('./class/SnakeGame');
const app = express();

app.use(cors());

const server = require('http').Server(app)
  .listen(3000,()=>{console.log('open server!')});

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
      const fps = roomsMap[playerRoomId][playerId].snakeGame.fps;
      const intervalId = setInterval(
        () => startSnakeGame(playerRoomId), 150
      );
      intervalMap[playerRoomId] = intervalId;
    }
  });

  socket.on('setSnakeDirection', ({ playerId, playerRoomId, directionKeyCode }) => {
    const { snakeGame } = roomsMap[playerRoomId][playerId];
    const [TOP, RIGHT, BOTTOM, LEFT] = [38, 39, 40, 37];
    switch (directionKeyCode) {
      case TOP:
        if (snakeGame.snake.currentMoveDirection === BOTTOM) return;
        snakeGame.snake.setDisplacement(0, -snakeGame.map.gridSize);
        break;
      case RIGHT:
        if (snakeGame.snake.currentMoveDirection === LEFT) return;
        snakeGame.snake.setDisplacement(snakeGame.map.gridSize, 0);
        break;
      case BOTTOM:
        if (snakeGame.snake.currentMoveDirection === TOP) return;
        snakeGame.snake.setDisplacement(0, snakeGame.map.gridSize);
        break;
      case LEFT:
        if (snakeGame.snake.currentMoveDirection === RIGHT) return;
        snakeGame.snake.setDisplacement(-snakeGame.map.gridSize, 0);
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
  players.forEach((playerId, index) => {
    const { socket, snakeGame } = roomsMap[playerRoomId][playerId];
    const competitor = roomsMap[playerRoomId][players[index === 1 ? 0 : 1]];

    if (snakeGame.snake.isAteApple(snakeGame.apple.position)) {
      snakeGame.snake.addLength(1);
      competitor.snakeGame.snake.addLength(2);
      const nextApplePosition = snakeGame.generateNewApplePosition();
      snakeGame.apple.position = nextApplePosition;
    }
    const nextSnakeHeadPosition = snakeGame.generateNextSnakePosition();

    if (snakeGame.isStartGame && snakeGame.snake.isTouchBody(nextSnakeHeadPosition)) {
      /*
      setSnakeGame(new SnakeGame({ ...snakeGame, isGameOver: true }));
      */
      return;
    }
    snakeGame.snake.headPosition = nextSnakeHeadPosition;

    socket.emit(
      'updateSnakeGame',
      { playerId, snakeGame, competitorSnakeGame: competitor.snakeGame }
    );
  });
}
