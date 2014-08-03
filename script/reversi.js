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

function ScoreBoard(game) {
	this._game = game;
	this.container = elm('div', {id:'scoreBoard'});
	this.turn = elm('h1',{},this.container);
	this.scores = elm('div', {className: 'scores'}, this.container);
	this.scoreBlack = elm('span', {}, this.scores);
	this.scoreWhite = elm('span', {}, this.scores);
}
ScoreBoard.prototype = {
	
}


function ReversiGame(parentElement) {
	if (parentElement === undefined) parentElement = document.body;
	this.board = new GameBoard(8, this);
	
	this.scoreBoard = new ScoreBoard(this);
	
	parentElement.appendChild(this.scoreBoard.container);
	parentElement.appendChild(this.board.element);
	
	// initial pieces
	this.board.cell(3,3).state = 0;
	this.board.cell(3,4).state = 1;
	this.board.cell(4,3).state = 1;
	this.board.cell(4,4).state = 0;
	
	// add players
	this.players.push(new Player('Human', 1, this));
	this.players.push(new Player('Computer', 3, this));
	
	this.updateScoreBoard();
	
	return this;
}

ReversiGame.prototype = {
	turn: 0,
	moves: 0,
	players: [],
	changeTurn: function(skipped) {
		this.turn = Math.abs(this.turn -1);
		var moves = this.movesAvailable();
		if (!moves) {
			console.log('no moves!');
			return skipped ? this.gameOver() : this.changeTurn(true);
		} else {
			this.moves++;
		}
		
		// player is a robot
		if (this.players[this.turn].type != 0 && moves) {
			var delay = 1;
			for (i in moves) moves[i].highlight(delay);
			var _game = this;
			setTimeout(function() {
				_game.players[_game.turn].think(moves, _game);
			}, delay);
		}
		this.updateScoreBoard();
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
			return (s > 0) ? s : false; // if search is not imediately next to cell

		// continue
		return this.isSandwich(c, d, (s + 1));
	},
	validMove: function(cell) {
		var st = 0; //score total
		// check the 8 directions
		var vd = []; // valid directions
		for (var x = -1; x <= 1; x++) {
			for (var y = -1; y <= 1; y++) {
				if (x == 0 && y == 0) continue;
				var d = {x:x, y:y};
				var s;
				if (s = this.isSandwich(cell, d)) {
					st += s;
					vd.push(d);
				}
			}
		}
		cell.score = st;
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
		this.scoreBoard.turn.innerHTML = this.players[this.turn].name+"'s Turn.";
		var scores = this.board.countCells();
		this.scoreBoard.scoreWhite.innerHTML = this.players[0].name+': '+scores[0];
		this.scoreBoard.scoreBlack.innerHTML = this.players[1].name+': '+scores[1];
		if (scores[0] + scores[1] >= 64) this.gameOver();
	},
	gameOver: function() {
		console.log('Game Over');
		this.players[0].type = 0;
		this.players[1].type = 1;
	}
}

function Player(name, type, game) {
	this.name = name;
	this._type = type;
	this._game = game;
}
Player.prototype = {
	name: 'player',
	get type() {
		return this._type;
	},
	set type(value) {
		this._type = value;
		this._game.turn = Math.abs(this._game.turn -1);
		// this._game.changeTurn(true);
	},
	
	// AI methods
	think: function(moves, game) {
		switch(this.type) {
			// case 1 is random
			case 2:
				moves = this.edgyFilter(moves, game);
				break;
			case 3:
				moves = this.greedyFilter(moves, game);
				break;
			case 4:
				moves = this.edgyFilter(moves, game);
				moves = this.greedyFilter(moves, game);
				break;
		}
		var r = randInt(0, moves.length);
		game.makeMove(moves[r]);
	},
	edgyFilter: function(moves, game) {
		console.log('AI: perfer edge');
		var preferred = [];
		for (i in moves) {
			var m = moves[i];
			if (m.x == 0 || m.x == game.board.size -1 || m.y == 0 || m.y == game.board.size -1) {
				preferred.push(m);
				console.log('preferred:'+m.x+','+m.y);
			}
		}
		if (preferred.length > 0) {
			return preferred;
		} else {
			return moves;
		}
	},
	greedyFilter: function(moves, game) {
		console.log('AI: filtering best score');
		var most = moves[0];
		for (var i in moves) {
			if (moves[i].score > most.score) {
				most = moves[i];
			}
		}
		var r = [];
		for (var i in moves) {
			if (moves[i].score == most.score) {
				r.push(moves[i]);
			}
		}
		return r;
	}
	
}

window.onload = function() {
	game = new ReversiGame();
}
