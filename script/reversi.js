var game = null;

function elm(type, attr, prnt) {
	if(!attr) attr = {};
	var e = document.createElement(type);
	for(var i in attr) e[i] = attr[i];
	if(prnt !== undefined) prnt.appendChild(e);
	return e;
}

function getEl(id) {
	return document.getElementById(id);
}

function randInt(max, min) {
	return Math.floor(Math.random() * (max - min)) + min;
}

function GameBoard(size, game) {
	this.size = size;
	this.element = elm('div', {id:'gameBoard'});
	
	var _board = this;
		
	var Square = function(container, x, y){
		var _this = this;
		this.x = x;
		this.y = y;
		this.element = elm('div', {
			className: 'cell',
			onclick: function() {
				game.makeMove(_this);
			}
		}, container);
	}
	Square.prototype = {
		_state: null,
		get state() {
			return this._state;
		},
		set state(value) {
			this._state = value;
			this.element.innerHTML = '';
			if (value !== null) {
				var piece = elm('div', {
					className: 'gamePiece '+['white', 'black'][value]
				}, this.element);
			}
		},
		highlight: function(time) {
			var _this = this;
			this.element.style.backgroundColor = 'rgba(100,0,0,0.4)';
			setTimeout(function() {
				_this.element.style.backgroundColor = '';
			}, time);
		}
	}
	
	for (y = 0; y < size; y++) {
		var row = [];
		this.push(row);
		
		var rowElement = elm('div', {className: 'row'}, this.element);
		
		for (x = 0; x < size; x++) {
			row.push(new Square(rowElement, x, y));
		}
	}
	
}
GameBoard.prototype = new Array();
GameBoard.prototype.cell = function(x,y) {
	var fake = {state: null, highlight: function() {}};
	if (this[y] === undefined) return fake;
	if (this[y][x] === undefined) return fake;
	return this[y][x];
}
GameBoard.prototype.eachCell = function(callback) {
	for (y = 0; y < this.size; y++) {
		for (x = 0; x < this.size; x++) {
			callback(this[y][x]);
		}
	}
}
GameBoard.prototype.countCells = function() {
	var scores = [0,0];
	for (y = 0; y < this.size; y++) {
		for (x = 0; x < this.size; x++) {
			var s = this[y][x].state;
			if (s === null) continue;
			scores[s]++;
		}
	}
	return scores;
}

function ReversiGame(parentElement) {
	if (parentElement === undefined) parentElement = document.body;
	this.board = new GameBoard(8, this);
	this.scoreBoard = elm('div', {id:'scoreBoard'}, parentElement);
	parentElement.appendChild(this.board.element);
	
	// initial pieces
	this.board.cell(3,3).state = 0;
	this.board.cell(4,3).state = 1;
	this.board.cell(3,4).state = 1;
	this.board.cell(4,4).state = 0;
	
	this.updateScoreBoard();
	
	return this;
}

ReversiGame.prototype = {
	turn: 0,
	moves: 0,
	players: [{
		name: 'white',
		type: 0
	}, {
		name: 'black',
		type: 1
	}],
	changeTurn: function() {
		this.turn = Math.abs(this.turn -1)
		console.log(this.players[this.turn].name+"'s turn.");
		var moves = this.movesAvailable();
		if (!moves) {
			console.log('no moves!');
			this.turn = Math.abs(this.turn -1);
		}
		this.updateScoreBoard();
		
		// player is a robot
		if (this.players[this.turn].type != 0) {
			var ai = new ReversiAI(this.players[this.turn].type);
			var _game = this;
			setTimeout(function() {
				ai.makeMove(moves, _game);
			}, 250);
		}
	},
	movesAvailable: function() {
		var _this = this;
		var found = [];
		for (y = 0; y < this.board.size; y++) {
			for (x = 0; x < this.board.size; x++) {
				var c = this.board[y][x];
				if (c.state != null) continue;
				if (this.validMove(c)) {
					// c.highlight(1000);
					found.push(c);
				}
			}
		}
		return (found.length > 0) ? found : false;;
	},
	makeMove: function(cell) {
		if (cell.state == null) {
			vds = this.validMove(cell);
			if (vds) {
				cell.state = this.turn;
				for (var i in vds) this.claim(cell, vds[i]);
				this.changeTurn();
			} else {
				cell.highlight(100);
			}
		}
	},
	// cell, direction, search
	isSandwich: function(c,d,s) {
		if (d.x == 0 && d.y == 0)
			return false;
		if (c.x === undefined)
			return false;
		if (s == undefined)
			s = 0;

		// next cell in direction
		c = this.board.cell(c.x + d.x, c.y + d.y);
		
		if (c.state === null)
			return false;

		if (c.state == this.turn)
			return (s > 0); // if search is not imediately next to cell

		// continue
		return this.isSandwich(c, d, (s + 1));
	},
	validMove: function(cell) {
		// check the 8 directions
		var vd = []; // valid directions
		for (var x = -1; x <= 1; x++) {
			for (var y = -1; y <= 1; y++) {
				if (x == 0 && y == 0) continue;
				var d = {x:x, y:y};
				if (this.isSandwich(cell, d)) vd.push(d);
			}
		}
		// return valid directions or false if none
		return (vd.length > 0) ? vd : false;
	},
	claim: function(c, d) {
		c = this.board.cell(c.x + d.x, c.y + d.y);
		if (c.state === null || c.state === Math.abs(this.turn -1)) {
			c.state = this.turn;
			// c.highlight(500);
			this.claim(c,d);
		}
	},
	updateScoreBoard: function() {
		this.scoreBoard.innerHTML = '';
		this.scoreBoard.appendChild(elm('h1', {
			innerHTML: this.players[this.turn].name+"'s Turn."
		}));
		var scores = this.board.countCells();
		this.scoreBoard.appendChild(elm('p', {
			innerHTML: this.players[0].name+': '+scores[0]+', '+this.players[1].name+': '+scores[1]
		}));
	}
}

function ReversiAI(type) {
	this.type = type;
};
ReversiAI.prototype = {
	makeMove: function(moves, game) {
		var move = randInt(0, moves.length);
		console.log(moves);
		console.log('Move:'+move);
		game.makeMove(moves[move]);
	}
}

window.onload = function() {
	game = new ReversiGame();
}
