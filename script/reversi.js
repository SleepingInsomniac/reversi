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

function ReversiGame(parentElement) {
	if (!parentElement) parentElement = document.body;
	
	this.turn = 0; // white = 0, black = 1
	this.board = [];
	this.moves = -4;
	this.infoDiv = elm('div', {className: 'info'});
	
	var _this = this;
	var players = ['white', 'black'];
	
	var simulateGameBoard = function() {
		_this.board = [];
		for(var i = 0; i < 8; i++) {
			row = [];
			for(var j = 0; j < 8; j++)
				row.push(null); // state 0 = white, 1 = black 
			_this.board.push(row);
		}
		_this.board.state = function(cords) {
			if (cords[0] < 0 || cords[0] > 7 || cords[1] < 0 || cords[1] > 7) return null;
			return _this.board[cords[0]][cords[1]];
		}
	}
	
	var createGameBoard = function() {
		var board = elm('div', {id: 'gameBoard'});
		for(var i = 0; i < 8; i++) {
			var row = elm('div', {className: 'row', id: 'row_'+i}, board);
			for(var j = 0; j < 8; j++) {
				var cell = elm('div', {
					className: 'cell',
					id: i.toString()+j.toString(),
					onclick: function() {
						var d;
						if (vd = validMove(this)) {
							_this.placePiece(this);
							for (var d in vd)
								claim(this, vd[d]);
							changeTurn();
							// _this.placePiece(this);
						}
					}
				}, row);
			}
		}
		return board;
	}
	
	var countScore = function() {
		var whiteScore = 0;
		var blackScore = 0;
		
		for (var i = 0; i < 7; i++) {
			for (var j = 0; j < 7; j++) {
				var state = _this.board.state([i,j]);
				if (state == 0) whiteScore++;
				if (state == 1) blackScore++;
			}
		}
		
		return [whiteScore, blackScore];
	}
	
	var resolvePos = function(cell) {
		return cell.id.split('').map(function(s) {
			return parseInt(s);
		});
	}
	
	var changeTurn = function() {
		_this.turn = Math.abs(_this.turn - 1);
		var scores = countScore();
		_this.infoDiv.innerHTML = '';
		elm('h1', {innerHTML: players[_this.turn]+"'s turn."}, _this.infoDiv);
		elm('p', {innerHTML: 'White: '+scores[0]+', Black: '+scores[1]}, _this.infoDiv);
	}
	
	var validMove = function(cell) {
		var pos = resolvePos(cell);
		if (_this.board.state(pos) != null) return false; // occupied
		
		// position, direction, search
		var sandwich = function(p, d, s) {
			p = [p[0] + d[0], p[1] + d[1]] // update position
			
			if (_this.board.state(p) == null) {
				return false;
			}
			
			if (_this.board.state(p) == _this.turn) {
				return (s > 0);
			}
			
			return sandwich(p, d, (s + 1)); // continue
		}
		
		// check the 8 directions
		var vd = [];
		for (var y = -1; y < 2; y++) {
			for (var x = -1; x < 2; x++) {
				if (sandwich(pos, [y,x], 0)) vd.push([y,x]);
			}
		}
		
		if (vd.length > 0) return vd;
		
		return false;
	}
	
	var claim = function(cell, d, s) {
		if (!s) s = 0;
		p = resolvePos(cell);
		p = [p[0] + d[0], p[1] + d[1]] // update position

		while (_this.board.state(p) == Math.abs(_this.turn - 1)) {
			_this.placePiece(getEl(p.join('')));
			p = [p[0] + d[0], p[1] + d[1]] // update position
		}
		
	}
	
	this.placePiece = function(cell) {
		// console.log(cell);
		var pos = resolvePos(cell);
		_this.moves++;
		_this.board[pos[0]][pos[1]] = _this.turn;
		cell.innerHTML = '';
		var piece = elm('div', {
			className: 'gamePiece '+players[_this.turn]
		}, cell);
		// changeTurn();
	}
	
	// set up initial state
	simulateGameBoard();
	parentElement.appendChild(this.infoDiv);
	parentElement.appendChild(createGameBoard());
	var cords = ['33', '34', '44', '43'];
	for(var i in cords) {
		this.placePiece(getEl(cords[i]));
		changeTurn();
	}
	
	return this;
}

window.onload = function() {
	game = new ReversiGame();
}
