import { GameStatus, ErrorCase } from './types';

/* Let's start with the class */
export default class Game {
    private gameId: string;
    private gameStatus: GameStatus = GameStatus.NotStarted;
    private player1: string;
    private player2: string;
    private board: string[][] = [
        ['', '', ''],
        ['', '', ''],
        ['', '', '']
    ];

    constructor(id: string) {
        this.gameId = id;
    }

    /* to register the players */
    joinPlayer(name: string): boolean | ErrorCase {
        if(this.player1 && this.player2) {
            return ErrorCase.GameFull;
        }

        if (this.player1) this.player2 = name;
        else this.player1 = name;

        return true;
    }

    /* to start the game */
    startGame(): boolean | ErrorCase {
        // check if two players are registered
        if (!this.player1 || !this.player2) {
            return ErrorCase.GameNotFull;
        }

        if (this.gameStatus === GameStatus.NotStarted) {
            this.gameStatus = GameStatus.Player1Turn;
        }
    }

    /* to make a move from 1-9 */
    makeMove(position: number): boolean | ErrorCase {
        // check if the position is valid
        if (position < 1 || position > 9) {
            return ErrorCase.InvalidPosition;
        }

        // check if the position is already taken
        if (this.board[Math.floor((position - 1) / 3)][(position - 1) % 3] !== '') {
            return ErrorCase.InvalidPosition;
        }

        // make the move
        const row: number = Math.floor((position - 1) / 3);
        const col: number = (position - 1) % 3;
        if (this.gameStatus === GameStatus.Player1Turn) {
            this.board[row][col] = 'X';
        } else if (this.gameStatus === GameStatus.Player2Turn) {
            this.board[row][col] = 'O';
        }

        // after each move we check if someone won
        this.checkWinner();

        if (this.gameStatus === GameStatus.Player1Turn) {
            this.gameStatus = GameStatus.Player2Turn;
        } else if (this.gameStatus === GameStatus.Player2Turn) {
            this.gameStatus = GameStatus.Player1Turn;
        }

        return true
    }

    /* to check if someone won */
    checkWinner() {
        /* we check the rows */
        for (let i: number = 0; i < 3; i++) {
            if (this.board[i][0] === this.board[i][1] && this.board[i][0] === this.board[i][2]) {
                if (this.board[i][0] === 'X') {
                    this.gameStatus = GameStatus.Player1Win;
                    return;
                } else if (this.board[i][0] === 'O') {
                    this.gameStatus = GameStatus.Player2Win;
                    return;
                }
            }
        }

        /* we check the columns */
        for (let i: number = 0; i < 3; i++) {
            if (this.board[0][i] === this.board[1][i] && this.board[0][i] === this.board[2][i]) {
                if (this.board[0][i] === 'X') {
                    this.gameStatus = GameStatus.Player1Win;
                    return;
                } else if (this.board[0][i] === 'O') {
                    this.gameStatus = GameStatus.Player2Win;
                    return;
                }
            }
        }

        /* we check the diagonals => \ */
        if (this.board[0][0] === this.board[1][1] && this.board[0][0] === this.board[2][2]) {
            if (this.board[0][0] === 'X') {
                this.gameStatus = GameStatus.Player1Win;
                return;
            } else if (this.board[0][0] === 'O') {
                this.gameStatus = GameStatus.Player2Win;
                return;
            }
        }

        /* we check the diagonals => / */
        if (this.board[0][2] === this.board[1][1] && this.board[0][2] === this.board[2][0]) {
            if (this.board[0][2] === 'X') {
                this.gameStatus = GameStatus.Player1Win;
                return;
            } else if (this.board[0][2] === 'O') {
                this.gameStatus = GameStatus.Player2Win;
                return;
            }
        }

        /* check the draw */
        if (this.gameStatus !== GameStatus.Player1Win && this.gameStatus !== GameStatus.Player2Win) {
            let draw: boolean = true;
            for (let i: number = 0; i < 3; i++) {
                for (let j: number = 0; j < 3; j++) {
                    if (this.board[i][j] === '') {
                        draw = false;
                    }
                }
            }

            if (draw) {
                this.gameStatus = GameStatus.Draw;
                return
            }
        }
    }

    /* to get the game status */
    getGameStatus() { return this.gameStatus; }
    // to get the board
    getBoard(): string[][] { return this.board; }
    getPlayer1(): string { return this.player1; }
    getPlayer2(): string { return this.player2; }
}

