"use strict";
/* Create a server which is using websocket to communicate with the client.
 * The server is listening on port 8001.
 * and it is going to have a list 10 games which can be created at the same time.
 * The games are simple tic-tac-toe games. and the game its self is stored in OOP structure in ./game.ts
 * but the server has to keep track of each game with a uuid, and also each client with a uuid.
 * what we have to do is to listen for clients they can send one of three values to the server:
 * 1. create a new game
 *    with this option a new game is created and the player is added to the game.
 * 2. join a game
 *    with this option a list of uuid(s) of games is sent to the client.
 *    The player then choose one room and join it.
 * 3. Spectate a game
 *    with this option a list of uuid(s) of games is sent to the client.
 *    The player then choose one room and spectate it.
 *
 * The game class has every method which is needed to play the game. such as ( makeMove, startGame, joinPlayer, getBoard, and so on)
 *
 *
 * AGAIN, make sure to use websocket to communicate with the client.
 * so when ever there is an update in the game, all the clients are notified.
 * And we have a client.ts file which is going to handle the client side of the application.
 *
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const WebSocket = __importStar(require("ws"));
const uuid = __importStar(require("uuid"));
const game_1 = __importDefault(require("./game"));
const client_1 = __importDefault(require("./client"));
const publicValues_1 = require("./publicValues"); // enums
// using the websocket request handle the following orders:
// 1. create a new game ( requires username )
// 2. join a game ( requires username )
// 3. spectate a game ( requires username )
// 4. make a move ( requires username, game uuid, and position )
//
// And the clients should be updated in the following way:
// 1. when a new game is created, the client should be notified.
// 2. when a game is joined, the client should be notified.
// 3. when a game is spectated, the client should be notified.
// 4. when a move is made, all the clients should be notified.
// 5. when the turn is changed all the players should be notified.
// 6. when a game is finished, the client should be notified.
/* let's start by creating a list of games */
const games = {};
const socket = new WebSocket.Server({ port: 8001 });
console.log('Websocket is listening on port 8001');
const clients = {};
const clientsOnGames = {};
socket.on('getConnection', (client) => {
    console.log('client connected');
    const clientId = uuid.v4();
    clients[clientId] = new client_1.default(clientId, client, publicValues_1.Mode.Idle);
    client.on('message', (message) => {
        const data = JSON.parse(message);
        console.log(data);
        switch (data.type) {
            case 'UPDATE_PROFILE':
                updateProfile(clientId, data.username);
                break;
            case 'CREATE_GAME':
                createGame(clientId);
                break;
            case 'JOIN_GAME':
                joinGame(clientId, data.gameId);
                break;
            case 'SPECTATE_GAME':
                spectateGame(clientId, data.gameId);
                break;
            case 'MAKE_MOVE':
                makeMove(clientId, data.position);
                break;
            default:
                console.log('unknown message type');
                // send a message back to the client with an error UNKNOWN_MESSAGE_TYPE
                client.send(JSON.stringify({
                    type: 'ERROR',
                    error: 'UNKNOWN_MESSAGE_TYPE'
                }));
                break;
        }
    });
    client.on('close', () => {
        console.log('client disconnected');
    });
});
/* helpers */
function updateClients(gameId) {
    // get all the clients in the game ( either playing or watching )
    const clientsInGame = clientsOnGames[gameId];
    const game = games[gameId];
    if (clientsInGame) {
        clientsInGame.forEach((clientId) => {
            const client = clients[clientId];
            if (client) {
                client.getConnection().send(JSON.stringify({
                    type: 'UPDATE_GAME',
                    game: {
                        board: game.getBoard(),
                        status: game.getGameStatus()
                    }
                }));
            }
        });
    }
}
/* create a middleware that checks if the client username is set or not */
function middleware(clientId, next) {
    if (!clients[clientId].getUsername()) {
        console.log('username is required');
        clients[clientId].getConnection().send(JSON.stringify({
            type: 'ERROR',
            error: 'USERNAME_REQUIRED'
        }));
        return;
    }
    next();
}
/* handlers */
function updateProfile(clientId, username) {
    clients[clientId].setUsername(username);
}
function createGame(clientId) {
    middleware(clientId, () => {
        const gameUuid = uuid.v4();
        games[gameUuid] = new game_1.default(gameUuid);
        const res = games[gameUuid].joinPlayer(clientId);
        if (res === true) {
            clientsOnGames[gameUuid] = [clientId];
            clients[clientId].setTurn(publicValues_1.Turn.Player1);
            clients[clientId].getConnection().send(JSON.stringify({
                type: 'CREATE_GAME',
                gameUuid: gameUuid,
            }));
        }
        else {
            clients[clientId].getConnection().send(JSON.stringify({
                type: 'ERROR',
                error: res
            }));
        }
    });
}
function joinGame(clientId, gameId) {
    // check if the game exists
    if (!games[gameId]) {
        clients[clientId].getConnection().send(JSON.stringify({
            type: 'ERROR',
            error: 'GAME_NOT_FOUND'
        }));
        return;
    }
    middleware(clientId, () => {
        const res = games[gameId].joinPlayer(clientId);
        if (res === true) {
            clientsOnGames[gameId].push(clientId);
            clients[clientId].setTurn(publicValues_1.Turn.Player2);
            games[gameId].startGame();
            clients[clientId].getConnection().send(JSON.stringify({
                type: 'JOIN_GAME',
                gameUuid: gameId,
            }));
            updateClients(gameId);
        }
        else {
            clients[clientId].getConnection().send(JSON.stringify({
                type: 'ERROR',
                error: res
            }));
        }
    });
}
function spectateGame(clientId, gameId) {
    // check if the game exists
    if (!games[gameId]) {
        clients[clientId].getConnection().send(JSON.stringify({
            type: 'ERROR',
            error: 'GAME_NOT_FOUND'
        }));
        return;
    }
    middleware(clientId, () => {
        clientsOnGames[gameId].push(clientId);
        clients[clientId].getConnection().send(JSON.stringify({
            type: 'SPECTATE_GAME',
            gameUuid: gameId,
        }));
        updateClients(gameId);
    });
}
function makeMove(clientId, position) {
    middleware(clientId, () => {
        const gameId = Object.keys(clientsOnGames).find((gameId) => {
            return clientsOnGames[gameId].includes(clientId);
        });
        // check if the game doesn't exist
        if (!gameId) {
            clients[clientId].getConnection().send(JSON.stringify({
                type: 'ERROR',
                error: 'GAME_NOT_FOUND'
            }));
            return;
        }
        const game = games[gameId];
        const client = clients[clientId];
        if ((game.getGameStatus() === publicValues_1.GameStatus.Player1Turn && client.getTurn() === publicValues_1.Turn.Player1) ||
            (game.getGameStatus() === publicValues_1.GameStatus.Player2Turn && client.getTurn() === publicValues_1.Turn.Player2)) {
            const res = game.makeMove(position);
            if (res === true) {
                updateClients(gameId);
            }
            else {
                clients[clientId].getConnection().send(JSON.stringify({
                    type: 'ERROR',
                    error: res
                }));
            }
        }
        else {
            clients[clientId].getConnection().send(JSON.stringify({
                type: 'ERROR',
                error: 'NOT_IN_TURN'
            }));
        }
        // check the game status
        if (game.getGameStatus() === publicValues_1.GameStatus.Player1Win ||
            game.getGameStatus() === publicValues_1.GameStatus.Player2Win ||
            game.getGameStatus() === publicValues_1.GameStatus.Draw) {
            delete games[gameId];
            delete clientsOnGames[gameId];
        }
    });
}
//# sourceMappingURL=app.js.map