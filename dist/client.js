"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ws_1 = require("ws");
const types_1 = require("./types");
const prompt_sync_1 = __importDefault(require("prompt-sync"));
const promptSync = (0, prompt_sync_1.default)();
const connection = new ws_1.WebSocket('ws://localhost:2020');
let role = types_1.Role.Idle;
// check if the connection is open and successful
connection.onerror = (error) => {
    console.log(`[X] WebSocket error: Not able to reach the server`);
    process.exit(1);
};
connection.onopen = () => {
    console.log('We are connected! [port 2020]');
    run();
};
/* server updates */
connection.onmessage = (message) => {
    const data = JSON.parse(message.data);
    switch (data.target) {
        case types_1.ServerRequestTarget.UpdateProfile:
            responseUpdateProfile(data);
            break;
        case types_1.ServerRequestTarget.CreateGame:
            responseCreateGame(data);
            break;
        case types_1.ServerRequestTarget.ListGames:
            responseListGames(data);
            break;
        case types_1.ServerRequestTarget.JoinGame:
            responseJoinGame(data);
            break;
        case types_1.ServerRequestTarget.SpectateGame:
            responseSpectateGame(data);
            break;
        case types_1.ServerRequestTarget.GameUpdate:
            responseGameUpdate(data);
            break;
    }
};
function getUserOption() {
    console.log(`
        [1]. Set/Update profile name
        [2]. Create a game
        [3]. Join a game
        [4]. Spectate a game
        [5]. Exit
    `);
    const allOptions = {
        '1': types_1.UserOption.UpdateProfile,
        '2': types_1.UserOption.CreateGame,
        '3': types_1.UserOption.JoinGame,
        '4': types_1.UserOption.SpectateGame,
        '5': types_1.UserOption.ExitGame
    };
    while (true) {
        const userInput = promptSync('Choose an option: ');
        if (allOptions[userInput] != undefined) {
            return allOptions[userInput];
        }
        console.log('Invalid option, please try again.');
    }
}
/* start running it */
function run() {
    /* reset values to origin */
    role = types_1.Role.Idle;
    const userOption = getUserOption();
    let handler = () => { };
    switch (userOption) {
        case types_1.UserOption.UpdateProfile:
            handler = updateProfile;
            break;
        case types_1.UserOption.CreateGame:
            handler = createGame;
            break;
        case types_1.UserOption.JoinGame:
            handler = joinGame;
            break;
        case types_1.UserOption.SpectateGame:
            handler = spectateGame;
            break;
        case types_1.UserOption.ExitGame:
            handler = exitGame;
            break;
    }
    handler();
}
/* controllers */
function exitGame() {
    process.exit(0);
}
/* Profile Update */
function updateProfile() {
    const username = promptSync('Enter your name: ');
    connection.send(JSON.stringify({
        type: 'UPDATE_PROFILE',
        username
    }));
}
function responseUpdateProfile(data) {
    if (data.type === types_1.ServerResponseStatus.Success) {
        console.log('Profile updated successfully!');
    }
    else if (data.type === types_1.ServerResponseStatus.Failure) {
        console.log('Profile update failed!');
    }
    run();
}
/* Create Game */
function createGame() {
    connection.send(JSON.stringify({
        type: 'CREATE_GAME'
    }));
}
function responseCreateGame(data) {
    if (data.type === types_1.ServerResponseStatus.Success) {
        console.log('\n###############################');
        console.log('Game created successfully!');
        console.log('Waiting for other players to join...');
        console.log('Game ID: ', data.gameId);
        console.log('###############################\n');
        role = types_1.Role.Player1;
    }
    else if (data.type === types_1.ServerResponseStatus.Failure) {
        console.log('Game creation failed!');
        console.log('Error message: ', data.message);
        run();
    }
}
/* list games */
let TMP_CALLBACK = () => { }; // a trick to pass the callback
function listGames(callback) {
    connection.send(JSON.stringify({
        type: 'LIST_GAMES'
    }));
    TMP_CALLBACK = callback;
}
function responseListGames(data) {
    if (data.type === types_1.ServerResponseStatus.Success) {
        console.log('\n###############################');
        console.log('List of available games:\n');
        data.games.forEach((game) => {
            console.log(`Game ID: ${game.gameId}`);
            console.log(`Game status: ${game.status}`);
            console.log(`Player 1: ${game.player1}`);
            console.log(`Player 2: ${game.player2}`);
            console.log(`Spectators : ${game.spectators}`);
            console.log('###############################\n');
        });
        TMP_CALLBACK();
        TMP_CALLBACK = () => { };
    }
    else if (data.type === types_1.ServerResponseStatus.Failure) {
        console.log('List of available games failed!');
        console.log('Error message: ', data.message);
        run();
    }
}
/* Join Game */
function joinGame() {
    listGames(() => {
        const gameId = promptSync('Enter the game ID: ');
        connection.send(JSON.stringify({
            type: 'JOIN_GAME',
            gameId
        }));
    });
}
function responseJoinGame(data) {
    if (data.type === types_1.ServerResponseStatus.Success) {
        console.log('\n###############################');
        console.log('Game joined successfully!');
        console.log('Game ID: ', data.gameId);
        console.log('###############################\n');
        role = types_1.Role.Player2;
    }
    else if (data.type === types_1.ServerResponseStatus.Failure) {
        console.log('Game join failed!');
        console.log('Error message: ', data.message);
        run();
    }
}
/* Spectate Game */
function spectateGame() {
    listGames(() => {
        const gameId = promptSync('Enter the game ID: ');
        connection.send(JSON.stringify({
            type: 'SPECTATE_GAME',
            gameId
        }));
    });
}
function responseSpectateGame(data) {
    if (data.type === types_1.ServerResponseStatus.Success) {
        console.log('\n###############################');
        console.log('Game joined successfully!');
        console.log('Game ID: ', data.gameId);
        console.log('###############################\n');
        role = types_1.Role.Spectator;
    }
    else if (data.type === types_1.ServerResponseStatus.Failure) {
        console.log('Game join failed!');
        console.log('Error message: ', data.message);
        run();
    }
}
/* Making Moves */
function makeMove() {
    const position = promptSync('Enter your move: ');
    if (isNaN(parseInt(position))) {
        console.log('Invalid move, please try again.');
        makeMove();
        return;
    }
    connection.send(JSON.stringify({
        type: 'MAKE_MOVE',
        position
    }));
}
function responseMakeMove(data) {
    if (data.type === types_1.ServerResponseStatus.Success) {
        console.log('[+] Move made successfully!');
    }
    else if (data.type === types_1.ServerResponseStatus.Failure) {
        console.log('Move failed!');
        console.log('Error message: ', data.message);
        makeMove();
    }
}
/* server updates */
function responseGameUpdate(data) {
    const board = data.game.board.map((row, idx) => {
        return row.map((cell, i) => {
            return cell || (idx * 3 + i + 1).toString();
        });
    });
    console.log(`
        Status: ${data.game.status}
        Player1: ${data.game.player1}
        Player2: ${data.game.player2}
        Spectators: ${data.game.spectators}
        ┌───┬───┬───┐
        │ ${board[0][0]} │ ${board[0][1]} │ ${board[0][2]} │
        ├───┼───┼───┤
        │ ${board[1][0]} │ ${board[1][1]} │ ${board[1][2]} │
        ├───┼───┼───┤
        │ ${board[2][0]} │ ${board[2][1]} │ ${board[2][2]} │
        └───┴───┴───┘
    `);
    // check if it's the player turn or if the game is over
    if ((role === types_1.Role.Player1 && data.game.status === types_1.GameStatus.Player1Turn) ||
        (role === types_1.Role.Player2 && data.game.status === types_1.GameStatus.Player2Turn)) {
        makeMove();
    }
    else if (data.game.status === types_1.GameStatus.Player1Win ||
        data.game.status === types_1.GameStatus.Player2Win ||
        data.game.status === types_1.GameStatus.Draw) {
        console.log(data.game.status, 'status');
        switch (data.game.status) {
            case types_1.GameStatus.Player1Win:
                if (role === types_1.Role.Player1) {
                    console.log('\n###############################');
                    console.log('You won!');
                    console.log('###############################\n');
                }
                else {
                    console.log('\n###############################');
                    console.log('${data.game.player1} won!');
                    console.log('###############################\n');
                }
                break;
            case types_1.GameStatus.Player2Win:
                if (role === types_1.Role.Player2) {
                    console.log('\n###############################');
                    console.log('You won!');
                    console.log('###############################\n');
                }
                else {
                    console.log('\n###############################');
                    console.log('${data.game.player2} won!');
                    console.log('###############################\n');
                }
                break;
            case types_1.GameStatus.Draw:
                console.log('\n###############################');
                console.log('Draw!');
                console.log('###############################\n');
                break;
        }
        run();
    }
}
//# sourceMappingURL=client.js.map