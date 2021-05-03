const Position = require('./Position');

class Apple {
  constructor(props) {
    const {
      appleSize = 0,
      position = new Position(2, 2),
    } = props;

    this.appleSize = appleSize;
    this.position = position;
  }
}

module.exports = Apple;
