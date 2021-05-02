const { GRID_COUNT, GAME_SCREEN_WIDTH } = require('../constants/snakeGame');
  
class Map {
  constructor() {
    this.gridScreenWidth = GAME_SCREEN_WIDTH;
    this.rowSize = GRID_COUNT;
    this.columnSize = GRID_COUNT;
  }

  get gridSize() {
    return Math.floor(this.gridScreenWidth / this.columnSize);
  }

  get centerPosition() {
    return {
      x: (Math.floor(this.rowSize / 2) - 1) * this.gridSize,
      y: (Math.floor(this.columnSize / 2) - 1) * this.gridSize,
    };
  }
}

module.exports = Map;
