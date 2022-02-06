"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const types_1 = require("./types");
/* Let's start with the class */
class Game {
    constructor(id) {
        this.gameStatus = types_1.GameStatus.NotStarted;
        this.board = [
            ['', '', ''],
            ['', '', ''],
            ['', '', '']
        ];
        this.gameId = id;
    }
    /* to register the players */
    joinPlayer(name) {
        if (this.player1 && this.player2) {
            return types_1.ErrorCase.GameFull;
        }
        if (this.player1)
            this.player2 = name;
        else
            this.player1 = name;
        return true;
    }
    /* to start the game */
    startGame() {
        // check if two players are registered
        if (!this.player1 || !this.player2) {
            return types_1.ErrorCase.GameNotFull;
        }
        if (this.gameStatus === types_1.GameStatus.NotStarted) {
            this.gameStatus = types_1.GameStatus.Player1Turn;
        }
    }
    /* to make a move from 1-9 */
    makeMove(position) {
        // check if the position is valid
        if (position < 1 || position > 9) {
            return types_1.ErrorCase.InvalidPosition;
        }
        // check if the position is already taken
        if (this.board[Math.floor((position - 1) / 3)][(position - 1) % 3] !== '') {
            return types_1.ErrorCase.InvalidPosition;
        }
        // make the move
        const row = Math.floor((position - 1) / 3);
        const col = (position - 1) % 3;
        if (this.gameStatus === types_1.GameStatus.Player1Turn) {
            this.board[row][col] = 'X';
        }
        else if (this.gameStatus === types_1.GameStatus.Player2Turn) {
            this.board[row][col] = 'O';
        }
        // after each move we check if someone won
        this.checkWinner();
        if (this.gameStatus === types_1.GameStatus.Player1Turn) {
            this.gameStatus = types_1.GameStatus.Player2Turn;
        }
        else if (this.gameStatus === types_1.GameStatus.Player2Turn) {
            this.gameStatus = types_1.GameStatus.Player1Turn;
        }
        return true;
    }
    /* to check if someone won */
    checkWinner() {
        /* we check the rows */
        for (let i = 0; i < 3; i++) {
            if (this.board[i][0] === this.board[i][1] && this.board[i][0] === this.board[i][2]) {
                if (this.board[i][0] === 'X') {
                    this.gameStatus = types_1.GameStatus.Player1Win;
                    return;
                }
                else if (this.board[i][0] === 'O') {
                    this.gameStatus = types_1.GameStatus.Player2Win;
                    return;
                }
            }
        }
        /* we check the columns */
        for (let i = 0; i < 3; i++) {
            if (this.board[0][i] === this.board[1][i] && this.board[0][i] === this.board[2][i]) {
                if (this.board[0][i] === 'X') {
                    this.gameStatus = types_1.GameStatus.Player1Win;
                    return;
                }
                else if (this.board[0][i] === 'O') {
                    this.gameStatus = types_1.GameStatus.Player2Win;
                    return;
                }
            }
        }
        /* we check the diagonals => \ */
        if (this.board[0][0] === this.board[1][1] && this.board[0][0] === this.board[2][2]) {
            if (this.board[0][0] === 'X') {
                this.gameStatus = types_1.GameStatus.Player1Win;
                return;
            }
            else if (this.board[0][0] === 'O') {
                this.gameStatus = types_1.GameStatus.Player2Win;
                return;
            }
        }
        /* we check the diagonals => / */
        if (this.board[0][2] === this.board[1][1] && this.board[0][2] === this.board[2][0]) {
            if (this.board[0][2] === 'X') {
                this.gameStatus = types_1.GameStatus.Player1Win;
                return;
            }
            else if (this.board[0][2] === 'O') {
                this.gameStatus = types_1.GameStatus.Player2Win;
                return;
            }
        }
        /* check the draw */
        if (this.gameStatus !== types_1.GameStatus.Player1Win && this.gameStatus !== types_1.GameStatus.Player2Win) {
            let draw = true;
            for (let i = 0; i < 3; i++) {
                for (let j = 0; j < 3; j++) {
                    if (this.board[i][j] === '') {
                        draw = false;
                    }
                }
            }
            if (draw) {
                this.gameStatus = types_1.GameStatus.Draw;
                return;
            }
        }
    }
    /* to get the game status */
    getGameStatus() { return this.gameStatus; }
    // to get the board
    getBoard() { return this.board; }
    getPlayer1() { return this.player1; }
    getPlayer2() { return this.player2; }
}
exports.default = Game;
//# sourceMappingURL=game.js.map