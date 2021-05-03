const { GRID_COUNT } = require('../constants/snakeGame');
  
class Map {
  constructor() {
    this.rowSize = GRID_COUNT;
    this.columnSize = GRID_COUNT;
  }

  get centerPosition() {
    return {
      x: Math.floor(this.rowSize / 2) - 1,
      y: Math.floor(this.columnSize / 2) - 1,
    };
  }
}

module.exports = Map;
