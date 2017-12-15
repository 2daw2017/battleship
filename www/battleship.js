"use strict";
var dragdata = {};
window.addEventListener('load', function() {
  Performance.test(function() {
    document.querySelectorAll('.battleship').forEach(function(battleship) {
      var config = JSON.parse(battleship.dataset.config);
      
      var battleshipController = new BattleshipController(new BattleshipModel(), new BattleshipView());
      battleshipController.init(config);
      battleshipController.view.render(battleship);
    });
  }, 1);
});

/*
 * Aquí está declarada la clase CellModel.
 * Sus propiedades son definadas para que notifiquen a los observers con su mismo nombre cuando cambien.
 *
 * @constructor
 * @param {integer} row
 * @param {integer} col
 * @returns {CellModel}
 * @extends {Subject}
 */
function CellModel(row, col) {
  Subject.call(this);
  this.row = row;
  this.col = col;
  var _available = true, _ship = false, _hit = false;
  Object.defineProperties(this, {
    available: {
      get: function() { return _available; },
      set: function(value) { _available = value; },
      enumerable: true, configurable: true
    },
    ship: {
      get: function() { return _ship; },
      set: function(value) { _ship = value; },
      enumerable: true, configurable: true
    },
    hit: {
      get: function() { return _hit; },
      set: function(value) { _hit = value; this.notify('hit', {ship: _ship});},
      enumerable: true, configurable: true
    }
  });
}

/*
 * Aquí está declarada la clase CellView.
 * Declara los elementos html que conformarán la celda.
 * Declara las funciones que harán cambiar la vista.
 * 
 * @constructor
 * @returns {CellView}
 */
function CellView() {
  this.cell = document.createElement('div');
  this.render = function(HTMLElement) {
//    Añadir la clase cell y añadir la celda al elemento pasado como parámetro.
    this.cell.classList.add('cell');
    HTMLElement.appendChild(this.cell);
  };
  this.hit = function(update) {
//    Añadir una clase u otra dependiendo de si la celda es barco o no.
    if(update.ship)       this.cell.classList.add('hit');
    else if(!update.ship) this.cell.classList.add('water');
  }.bind(this);
  
  this.sunk = function() {
    this.cell.classList.add('sunk');
  }.bind(this);
}

/*
 * Aquí está declarada la clase CellController.
 * Suscribe la vista a los cambios de las propiedades del modelo.
 * 
 * @constructor
 * @param {CellModel} model
 * @param {CellView} view
 * @returns {CellController}
 */
function CellController(model, view) {
  this.model = model;
  this.view = view;
//  Suscribir la función hit de la vista a la propiedad hit del modelo.
  this.model.subscribe('hit', this.view.hit);
  this.init = function() {};
  this.reset = function() {
    this.model.available = true;
    this.model.ship = false;
    this.model.observers["hit"] = undefined;
    this.model.subscribe('hit', this.view.hit);
  };
}

/*
 * Aquí está declarada la clase AdversaryCellController.
 * Añade eventos específicos de las celdas enemigas a la clase CellController (click).
 * 
 * @constructor
 * @param {CellModel} model
 * @param {CellView} view
 * @returns {AdversaryCellController}
 * @extends {CellController}
 */
function AdversaryCellController(model, view) {
  CellController.call(this, model, view);
//  CellController.prototype.init.call(this);
  this.init = function() {
    bindEvents(this);
  };
  function bindEvents(controller) {
    var _model = controller.model, _view = controller.view;
    //  Añadir un evento click a la vista que modifique la propiedad hit del modelo.
    _view.cell.addEventListener('click', function() { _model.hit = true; });
  }
}

/*
 * Aquí está declarada la clase PlayerCellController.
 * Añade propiedades específicas de las celdas del jugador.
 * 
 * @constructor
 * @param {CellModel} model
 * @param {CellView} view
 * @returns {PlayerCellController}
 * @extends {CellController}
 */
function PlayerCellController(model, view) {
  CellController.call(this, model, view);
//  Añadir los dataset al html. Necesarios para el localizar la celda sobre la que se ha soltado un barco.
  this.view.cell.dataset.row = this.model.row;
  this.view.cell.dataset.col = this.model.col;
}

/*
 * Aquí está declarada la clase BoardModel.
 * 
 * @constructor
 * @param {integer} rows
 * @param {integer} cols
 * @param {Array} ships
 * @returns {BoardModel}
 * @extends {Subject}
 */
function BoardModel(rows, cols, ships) {
  Subject.call(this);
  this.rows = rows;
  this.cols = cols;
  this.ships = ships;
}

/*
 * Aquí está declarada la clase BoardView.
 * Declara los elementos html que conformarán el tablero.
 * 
 * @constructor
 * @returns {BoardView}
 * @extends {Subject}
 */
function BoardView() {
  this.board = document.createElement('div');
  this.render = function(HTMLElement) {
    this.board.classList.add('board');
    HTMLElement.appendChild(this.board);
  };
  
}

/*
 * Aquí está declarada la clase BoardController.
 * 
 * @constructor
 * @param {BoardModel} model
 * @param {BoardView} view
 * @returns {BoardController}
 */
function BoardController(model, view) {
  this.model = model;
  this.view = view;
  this.cells = [];
  this.placeFleetRandomly = function(fleetController) {
    for(var i = 0; i < fleetController.ships.length; i++) {
      this.placeShipRandomly(fleetController.ships[i].model);
    }
  };
  this.placeShipRandomly = function(shipModel) {
    do{
      var shipCells = [];
      var rndRow = Math.floor(Math.random() * this.model.rows);
      var rndCol = Math.floor(Math.random() * this.model.cols);
      var rndDir = Math.floor(Math.random() * 2);
      shipCells = this.canPlaceShip(rndRow, rndCol, shipModel.size, rndDir);
    }while(!shipCells);
    this.placeShip(shipModel, shipCells);
//    console.log(shipCells);
    return shipCells;
  };
  this.canPlaceShip = function(row, col, size, vertical) {
//    console.log(row, col, size, vertical);
    var shipCells = [], valid = true;
    for(var i = 0; valid && i < size; i++ ) {
      if(vertical) {
        if(row + i >= 0 && row + i < 10 && this.cells[row + i][col].model.available) shipCells.push(this.cells[row + i][col]); else valid = false;
      } else {
        if(col + i >= 0 && col + i < 10 && this.cells[row][col + i].model.available) shipCells.push(this.cells[row][col + i]); else valid = false;
      }
    }
    return valid ? shipCells : false;
  };
  this.placeShip = function(shipModel, shipCells) {
    for(var i = 0; i < shipCells.length; i++) {
//      Subscribir el barco para ser notificado cuando una de sus celdas sea tocada.
      shipCells[i].model.subscribe('hit', shipModel.hit);
//      Subscribir la celda para ser notificada cuando el barco lance la notificación de que ha sido hundido.
      shipModel.subscribe('sunk', shipCells[i].view.sunk);
      this.drawShipCell(shipCells[i].model.row, shipCells[i].model.col, false);
    }
  };
  this.removeShip = function(shipModel, shipCells) {
    for(var i = 0; i < shipCells.length; i++) {
//      El barco ya no necesitará ser notificado cuando una de sus celdas sea tocada.
      shipCells[i].model.unsubscribe('hit', shipModel.hit);
//      La celda ya no necesitará ser notificada cuando el barco sea hundido.
      shipModel.unsubscribe('sunk', shipCells[i].view.sunk);
      this.drawShipCell(shipCells[i].model.row, shipCells[i].model.col, true);
    }
  };
  this.drawShipCell = function(row, col, available) {
    this.cells[row][col].model.ship = !available;
    this.cells[row][col].model.available = available;
    
    if(row + 1 >= 0 && row + 1 < 10) this.cells[row + 1][col].model.available = available;
    if(row - 1 >= 0 && row - 1 < 10) this.cells[row - 1][col].model.available = available;
    if(col + 1 >= 0 && col + 1 < 10) this.cells[row][col + 1].model.available = available;
    if(col - 1 >= 0 && col - 1 < 10) this.cells[row][col - 1].model.available = available;

    if(row + 1 >= 0 && row + 1 < 10 && col + 1 >= 0 && col + 1 < 10) this.cells[row + 1][col + 1].model.available = available;
    if(row + 1 >= 0 && row + 1 < 10 && col - 1 >= 0 && col - 1 < 10) this.cells[row + 1][col - 1].model.available = available;
    if(row - 1 >= 0 && row - 1 < 10 && col + 1 >= 0 && col + 1 < 10) this.cells[row - 1][col + 1].model.available = available;
    if(row - 1 >= 0 && row - 1 < 10 && col - 1 >= 0 && col - 1 < 10) this.cells[row - 1][col - 1].model.available = available;
  };
  this.clear = function() {
    for(var row = 0; row < this.model.rows; row++) {
      for(var col = 0; col < this.model.cols; col++) {
        this.cells[row][col].reset();
      }
    }
    console.log(this.cells);
  };
}

/*
 * Aquí está declarada la clase AdversaryBoardController.
 * Contiene las funciones específicas del tablero del adversario.
 * 
 * @constructor
 * @param {BoardModel} model
 * @param {BoardView} view
 * @returns {AdversaryBoardController}
 * @extends {BoardController}
 */
function AdversaryBoardController(model, view) {
  BoardController.call(this, model, view);
  this.init = function() {
//    Generar las celdas.
    for(var row = 0; row < this.model.rows; row++) {
      this.cells[row] = [];
      for(var col = 0; col < this.model.cols; col++) {
        this.cells[row][col] = genCell(row, col, this.view.board);
      }
    }

    function genCell(row, col, HTMLElement) {
      var cell = new AdversaryCellController(new CellModel(row, col), new CellView());
      cell.init();
      cell.view.render(HTMLElement);
      return cell;
    }
  };
  
}

/*
 * Aquí está declarada la clase PlayerBoardController.
 * Contiene las funciones específicas del tablero del jugador.
 * 
 * @constructor
 * @param {BoardModel} model
 * @param {BoardView} view
 * @returns {PlayerBoardController}
 * @extends {BoardController}
 */
function PlayerBoardController(model, view) {
  BoardController.call(this, model, view);
  this.init = function() {
    for(var row = 0; row < this.model.rows; row++) {
      this.cells[row] = [];
      for(var col = 0; col < this.model.cols; col++) {
        this.cells[row][col] = genCell(row, col, this.view.board);
      }
    }
    function genCell(row, col, HTMLElement) {
      var cell = new PlayerCellController(new CellModel(row, col), new CellView());
      cell.init();
      cell.view.render(HTMLElement);
      return cell;
    }
    bindEvents(this);
  };
  this.drawShipPreview = function(shipCells) {
    for(var i = 0; i < shipCells.length; i++) {
      shipCells[i].view.cell.classList.add('ship-preview');
    }
  };
  this.removeShipPreview = function(shipCells) {
    for(var i = 0; i < shipCells.length; i++) {
      shipCells[i].view.cell.classList.remove('ship-preview');
    }
  };
  function bindEvents(controller) {
    var _model = controller.model, _view = controller.view;
    _view.board.ondragenter = function(event) {
      setTimeout(function() {
        console.log("in");
        if(dragdata.ship) {
          var row = Number(event.target.dataset.row);
          var col = Number(event.target.dataset.col);
          var size = dragdata.ship.model.size;
          var vertical = dragdata.ship.view.ship.classList.contains('vertical');
          dragdata.cells = controller.canPlaceShip(row, col, size, vertical);
          if(dragdata.cells) controller.drawShipPreview(dragdata.cells);
        }
      }, 1);
    };
    _view.board.ondragleave = function() {
        console.log("out");
        if(dragdata.ship) {
          if(dragdata.cells) controller.removeShipPreview(dragdata.cells);
        }
    };
    _view.board.ondrop = function(event) {
      if(dragdata.ship) {
        if(dragdata.cells) {
          if(dragdata.cells) controller.removeShipPreview(dragdata.cells);
          controller.placeShip(dragdata.ship.model, dragdata.cells);
          event.target.appendChild(dragdata.ship.view.ship);
        } else {
          
        }
      }
    };
    _view.board.ondragstart = function(event) {
      console.log("board dragstart", dragdata.ship);
      if(dragdata.ship) {
//        Obtener los datos necesarios.
        var row = Number(event.target.parentNode.dataset.row);
        var col = Number(event.target.parentNode.dataset.col);
        var size = dragdata.ship.model.size;
        var vertical = dragdata.ship.view.ship.classList.contains('vertical');
        var shipCells = [];
        console.log("board dragstart", row, col, size, vertical);
//        Obtener las celdas involucradas.
        for(var i = 0; i < size; i++ ) {
          if(vertical) {
            if(row + i >= 0 && row + i < 10) shipCells.push(controller.cells[row + i][col]);
          }
          else {
            if(col + i >= 0 && col + i < 10) shipCells.push(controller.cells[row][col + i]);
          }
        }
        console.log("board dragstart", shipCells);
//        Remover el barco.
        controller.removeShip(dragdata.ship.model, shipCells);
//        Redibujar las zonas de control alrededor de los barcos.
        for(var r = 0; r < _model.rows; r++) {
          for(var c = 0; c < _model.cols; c++) {
            if(controller.cells[r][c].model.ship) {
              controller.drawShipCell(r, c, false);
            }
          }
        }
      }
    };
    _view.board.ondragover = function() {
      event.preventDefault();
    };
  }
}

/*
 * Aquí está declarada la clase Shipmodel.
 * 
 * @constructor
 * @param {integer} pSize
 * @returns {ShipModel}
 * @extends {Subject}
 */
function ShipModel(pSize) {
  Subject.call(this);
  var _size = pSize, _lives = pSize, _sunk = false;
  Object.defineProperties(this, {
    size: {
      get: function() { return _size; },
      set: function(value) { _size = value; },
      enumerable: true, configurable: true
    },
    lives: {
      get: function() { return _lives; },
      set: function(value) { _lives = value; if(!_lives) this.sunk = true; },
      enumerable: true, configurable: true
    },
    sunk: {
      get: function() { return _sunk; },
      set: function(value) { _sunk = value; this.notify('sunk', {sunk: _sunk}); },
      enumerable: true, configurable: true
    }
  });
  
  this.hit = function() {
    this.lives--;
  }.bind(this);
}

function ShipView() {
  this.ship = document.createElement('div');
  
  this.render = function(HTMLElement, size) {
    this.ship.classList.add('ship');
    this.ship.dataset.size = size;
    this.ship.draggable = true;
    HTMLElement.appendChild(this.ship);
  };
}

function ShipController(model, view) {
  this.model = model;
  this.view = view;
  
  this.init = function() {
    bindEvents(this);
  };
  
  function bindEvents(controller) {
    var _model = controller.model, _view = controller.view;
    _view.ship.ondragstart = function(event) {
      console.log("ship dragstart", event.target);
      dragdata.ship = controller;
      console.log("dragdata", dragdata);
    };
    _view.ship.onclick = function() {
      if(!_view.ship.parentNode.classList.contains('cell')) {
        _view.ship.classList.toggle('vertical');
      }
    };
  }
}


function FleetModel(shipsSize) {
  Subject.call(this);
  this.shipsSize = shipsSize;
  this.shipsPlaced = 0;
  var _lose = false, _shipsAfloat = shipsSize.length;
  Object.defineProperties(this, {
    lose: {
      get: function() { return _lose; },
      set: function(value) { _lose = value; this.notify('lose', {lose: _lose}); },
      enumerable: true, configurable: true
    },
    shipsAfloat: {
      get: function() { return _shipsAfloat; },
      set: function(value) { _shipsAfloat = value; if(!_shipsAfloat) this.lose = true; },
      enumerable: true, configurable: true
    }
  });
}

function FleetView() {
  this.area = document.createElement('div');
  this.render = function(HTMLElement) {
    this.area.classList.add('ship-area');
    HTMLElement.appendChild(this.area);
  };
}

function AdversaryFleetController(model) {
  this.model = model;
  this.ships = [];
  this.init = function() {
    for(var i = 0; i < this.model.shipsSize.length; i++) {
      this.ships[i] = new ShipController(new ShipModel(this.model.shipsSize[i]), new ShipView());
      this.ships[i].model.subscribe('sunk', function() { this.shipsAfloat--; console.log("A", this.shipsAfloat); }.bind(this.model));
    }
  };
}

function PlayerFleetController(model, view) {
  this.model = model;
  this.view = view;
  this.ships = [];
  this.shipsAfloat = model.shipsSize.length;
  this.init = function() {
    for(var i = 0; i < this.model.shipsSize.length; i++) {
      this.ships[i] = new ShipController(new ShipModel(this.model.shipsSize[i]), new ShipView());
      this.ships[i].model.subscribe('sunk', function() { this.shipsAfloat--; console.log("B", this.shipsAfloat); }.bind(this.model));
      this.ships[i].init();
      this.ships[i].view.render(this.view.area, this.model.shipsSize[i]);
    }
  };
}


function BattleshipModel() {
  
}

function BattleshipView() {
  this.battleship = document.createElement('div');
  this.placeRndButton = document.createElement('button');
  this.render = function(HTMLElement) {
    this.placeRndButton .innerHTML = "Colocar Aleatoriamente";
    this.battleship.appendChild(this.placeRndButton);
    HTMLElement.appendChild(this.battleship);
  };
}

function BattleshipController(model, view) {
  this.model = model;
  this.view = view;
  this.boards = [];
  this.fleets = [];
  this.config = null;
  
  this.init = function(config) {
    this.config = config;
    
    this.boards[0] = new AdversaryBoardController(new BoardModel(config.rows, config.cols), new BoardView());
    this.boards[0].init();
    this.boards[0].view.render(this.view.battleship);
      
    this.fleets[0] = new AdversaryFleetController(new FleetModel(config.ships));
    this.fleets[0].init();
    this.boards[0].placeFleetRandomly(this.fleets[0]);

    this.boards[1] = new PlayerBoardController(new BoardModel(config.rows, config.cols), new BoardView());
    this.boards[1].init();
    this.boards[1].view.render(this.view.battleship);
      
    this.fleets[1] = new PlayerFleetController(new FleetModel(config.ships), new FleetView());
    this.fleets[1].init();
    this.fleets[1].view.render(this.view.battleship);
    
    bindEvents(this);
  };
  
  this.iaPlay = function (board) {
    do{
      var rndRow = Math.floor(Math.random() * this.config.rows);
      var rndCol = Math.floor(Math.random() * this.config.cols);
    } while(board.cells[rndRow][rndCol].model.hit);
    board.cells[rndRow][rndCol].model.hit = true;
  };
  
  function bindEvents(controller) {
    controller.view.placeRndButton.addEventListener('click', function() {
        controller.fleets[1].view.area.innerHTML = '';
        controller.fleets[1] = new PlayerFleetController(new FleetModel(controller.config.ships), new FleetView());
        controller.fleets[1].init();
        controller.boards[1].clear();
        controller.boards[1].placeFleetRandomly(controller.fleets[1]);
    });
    controller.boards[0].view.board.addEventListener('click', function() {
      setTimeout(function() {
          controller.iaPlay(controller.boards[1]);
          console.log("ia play");
        }, Math.random() * 100);
    });
  }
}

/*
 * Aquí está declarada la clase Subject.
 * Necesaria para el modelo Subject - Observer.
 * Los objetos que extienden de ella pueden registrar observers y notificarles a voluntad.
 * 
 * @constructor
 * @returns {Subject}
 */
function Subject() {
  this.observers = {};
  this.subscribe = function(event, fn) {
    if(!this.observers[event]) this.observers[event] = []; 
    this.observers[event].push(fn);
  };
  this.unsubscribe = function(event, fn) {
    this.observers[event] = this.observers[event].filter(
      function(item) { if (item !== fn) return item; }
    );
  };
  this.notify = function(event, update, thisObj) {
    var scope = thisObj || window;
    if(!this.observers[event]) this.observers[event] = [];
    this.observers[event].forEach(function(item) { item.call(scope, update); });
  };
  this.notifyAll = function(update, thisObj) {
    for (var property in this.observers) {
      if (this.observers.hasOwnProperty(property)) {
        this.notify(property, update, thisObj);
      }
    }
  };
}

var Performance = {
  test: function(fn, times) {
    var t1 = performance.now();
    for(var i = 0; i < times; i++) fn(i);
    var t2 = performance.now();
    console.log("El tiempo transcurrido ha sido " + (t2 - t1) + " milisegundos.");
  }
};
