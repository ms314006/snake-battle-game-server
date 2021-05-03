const Map = require('./Map');
const Position = require('./Position');
const Apple = require('./Apple');
const Snake = require('./Snake');

class SnakeGame {

  constructor(props) {
    this.map = new Map();
    const {
      isStartGame = false,
      isEndGame = false,
      isWinner = false,
      apple = new Apple({
        appleSize: 1,
        position: new Position(2, 2),
      }),
      snake = new Snake({
        bodySize: 1,
        bodys: [new Position(this.map.centerPosition.x, this.map.centerPosition.y)],
      }),
      fps = 6,
    } = props || {};

    this.isStartGame = isStartGame;
    this.isEndGame = isEndGame;
    this.isWinner = isWinner;
    this.apple = new Apple(apple);
    this.snake = new Snake(snake);
    this.fps = fps;
  }

  get score() {
    return this.snake.tailLength - 1;
  }

  isEmptyPosition(x, y) {
    return this.snake.bodys.every(
      snakeBody => snakeBody.x !== x || snakeBody.y !== y,
    );
  }

  generateNewApplePosition() {
    let { x, y } = this.apple.position;
    do {
      [x, y] = [
        Math.floor(Math.random() * this.map.columnSize),
        Math.floor(Math.random() * this.map.rowSize),
      ];
    } while (!this.isEmptyPosition(x, y));

    return new Position(x, y);
  }

  generateNextSnakePosition() {
    let { x, y } = this.snake.headPosition;

    x += this.snake.xDisplacement;
    y += this.snake.yDisplacement;

    if (x < 0) {
      x = this.map.columnSize - 1;
    }
    if (x > this.map.columnSize - 1) {
      x = 0;
    }
    if (y < 0) {
      y = this.map.rowSize - 1;
    }
    if (y > this.map.rowSize - 1) {
      y = 0;
    }
    return new Position(x, y);
  }
}

module.exports = SnakeGame;
