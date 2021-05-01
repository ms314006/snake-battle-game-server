const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
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

  socket.on('joinInToRoom', (roomId) => {
    if (roomsMap[roomId] === undefined) {
      roomsMap[roomId] = [];
    }
    socket.join(roomId);
    roomsMap[roomId].push(socket);
    if (roomsMap[roomId].length === 1) {
      socket.emit('waitingForAnotherPlayer');
    }

    if (roomsMap[roomId].length === 2) {
      roomsMap[roomId].forEach((playerSocket) => {
        playerSocket.emit('playersIsReady');
      });

      startSnakeGame(roomId);
    }
  });
});

const startSnakeGame = (roomId) => {
  roomsMap[roomId].forEach((playerSocket) => {
    playerSocket.emit('updateSnakeGame', 'start');
  });

  setTimeout(() => {
    requestAnimationFrame(() => startSnakeGame(roomId));
  }, 1000 / 30);
}
