const Position = require('./Position');

class Snake {
  constructor(props) {
    const {
      bodySize = 0,
      bodys = [],
      tailLength = 1,
    } = props;
    this.bodySize = bodySize;
    this.bodys = bodys;
    this.tailLength = tailLength;
    this.xDisplacement = 0;
    this.yDisplacement = 0;
    this.currentMoveDirection = null;
  }

  get headPosition() {
    return new Position(
      this.bodys[this.bodys.length - 1].x,
      this.bodys[this.bodys.length - 1].y,
    );
  }

  set headPosition(headPosition) {
    this.bodys = [...this.bodys, headPosition];
    while (this.bodys.length > this.tailLength) {
      this.bodys.shift();
    }
  }

  isAteApple(apple) {
    return this.headPosition.x === apple.x && this.headPosition.y === apple.y;
  }

  isTouchBody(newSnakeHeadPosition) {
    const isSnakeHeadTouchBody = (snakeBodyX, snakeBodyY) => (
      snakeBodyX === newSnakeHeadPosition.x && snakeBodyY === newSnakeHeadPosition.y
    );

    return this.bodys.some(body => (
      isSnakeHeadTouchBody(body.x, body.y)
    ));
  }

  addLength(increaseLength) {
    this.tailLength += increaseLength;
  }

  setDisplacement(x, y) {
    this.xDisplacement = x;
    this.yDisplacement = y;
  }
}

module.exports = Snake;
