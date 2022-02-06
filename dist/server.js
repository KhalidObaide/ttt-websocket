"use strict";
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
const types_1 = require("./types");
const socket = new WebSocket.Server({ port: 2020 });
console.log('Websocket is listening on port 2020');
const games = {};
const clients = {};
const clientsOnGames = {};
const usernames = {};
socket.on('connection', (client) => {
    const clientId = uuid.v4();
    clients[clientId] = new types_1.Client(clientId, client);
    client.on('message', (message) => {
        const data = JSON.parse(message);
        switch (data.type) {
            case 'UPDATE_PROFILE':
                updateProfile(clientId, data.username);
                break;
            case 'CREATE_GAME':
                createGame(clientId);
                break;
            case 'LIST_GAMES':
                listGames(clientId);
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
                    target: types_1.ServerRequestTarget.GameUpdate,
                    type: types_1.ServerResponseStatus.Success,
                    game: {
                        player1: usernames[game.getPlayer1()],
                        player2: usernames[game.getPlayer2()],
                        spectators: getSpectators(gameId),
                        status: game.getGameStatus(),
                        board: game.getBoard(),
                    },
                }));
            }
        });
    }
}
/* create a middleware that checks if the client username is set or not */
function middleware(clientId, target, next) {
    if (!clients[clientId].getUsername()) {
        clients[clientId].getConnection().send(JSON.stringify({
            target: target,
            type: types_1.ServerResponseStatus.Failure,
            message: 'USERNAME_REQUIRED'
        }));
        return;
    }
    next();
}
/* handlers */
function updateProfile(clientId, username) {
    clients[clientId].setUsername(username);
    usernames[clientId] = username;
    clients[clientId].getConnection().send(JSON.stringify({
        target: types_1.ServerRequestTarget.UpdateProfile,
        type: types_1.ServerResponseStatus.Success,
        username: username
    }));
}
function createGame(clientId) {
    middleware(clientId, types_1.ServerRequestTarget.CreateGame, () => {
        const gameUuid = uuid.v4();
        games[gameUuid] = new game_1.default(gameUuid);
        const res = games[gameUuid].joinPlayer(clientId);
        if (res === true) {
            clientsOnGames[gameUuid] = [clientId];
            clients[clientId].setTurn(types_1.Turn.Player1);
            clients[clientId].getConnection().send(JSON.stringify({
                target: types_1.ServerRequestTarget.CreateGame,
                type: types_1.ServerResponseStatus.Success,
                gameId: gameUuid,
            }));
        }
        else {
            clients[clientId].getConnection().send(JSON.stringify({
                target: types_1.ServerRequestTarget.CreateGame,
                type: types_1.ServerResponseStatus.Failure,
                error: res
            }));
        }
    });
}
function listGames(clientId) {
    middleware(clientId, types_1.ServerRequestTarget.ListGames, () => {
        const gameIds = Object.keys(games);
        const gameList = [];
        gameIds.forEach((gameId) => {
            const game = games[gameId];
            gameList.push({
                gameId: gameId,
                status: game.getGameStatus(),
                player1: usernames[game.getPlayer1()] || 'Not Joined',
                player2: usernames[game.getPlayer2()] || 'Not Joined',
                spectators: getSpectators(gameId),
            });
        });
        clients[clientId].getConnection().send(JSON.stringify({
            target: types_1.ServerRequestTarget.ListGames,
            type: types_1.ServerResponseStatus.Success,
            games: gameList
        }));
    });
}
function joinGame(clientId, gameId) {
    // check if the game exists
    if (!games[gameId]) {
        clients[clientId].getConnection().send(JSON.stringify({
            target: types_1.ServerRequestTarget.JoinGame,
            type: types_1.ServerResponseStatus.Failure,
            message: 'GAME_NOT_FOUND'
        }));
        return;
    }
    middleware(clientId, types_1.ServerRequestTarget.JoinGame, () => {
        const res = games[gameId].joinPlayer(clientId);
        if (res === true) {
            clientsOnGames[gameId].push(clientId);
            clients[clientId].setTurn(types_1.Turn.Player2);
            games[gameId].startGame();
            clients[clientId].getConnection().send(JSON.stringify({
                target: types_1.ServerRequestTarget.JoinGame,
                type: types_1.ServerResponseStatus.Success,
                gameId: gameId,
            }));
            updateClients(gameId);
        }
        else {
            clients[clientId].getConnection().send(JSON.stringify({
                target: types_1.ServerRequestTarget.JoinGame,
                type: types_1.ServerResponseStatus.Failure,
                message: res
            }));
        }
    });
}
function spectateGame(clientId, gameId) {
    // check if the game exists
    if (!games[gameId]) {
        clients[clientId].getConnection().send(JSON.stringify({
            target: types_1.ServerRequestTarget.SpectateGame,
            type: types_1.ServerResponseStatus.Failure,
            message: 'GAME_NOT_FOUND'
        }));
        return;
    }
    middleware(clientId, types_1.ServerRequestTarget.SpectateGame, () => {
        clientsOnGames[gameId].push(clientId);
        clients[clientId].getConnection().send(JSON.stringify({
            target: types_1.ServerRequestTarget.SpectateGame,
            type: types_1.ServerResponseStatus.Success,
            gameId: gameId,
        }));
        updateClients(gameId);
    });
}
function makeMove(clientId, position) {
    middleware(clientId, types_1.ServerRequestTarget.MakeMove, () => {
        const gameId = Object.keys(clientsOnGames).find((gameId) => {
            return clientsOnGames[gameId].includes(clientId);
        });
        // check if the game doesn't exist
        if (!gameId) {
            clients[clientId].getConnection().send(JSON.stringify({
                target: types_1.ServerRequestTarget.MakeMove,
                type: types_1.ServerResponseStatus.Failure,
                error: 'GAME_NOT_FOUND'
            }));
            return;
        }
        const game = games[gameId];
        const client = clients[clientId];
        if ((game.getGameStatus() === types_1.GameStatus.Player1Turn && client.getTurn() === types_1.Turn.Player1) ||
            (game.getGameStatus() === types_1.GameStatus.Player2Turn && client.getTurn() === types_1.Turn.Player2)) {
            const res = game.makeMove(position);
            if (res === true) {
                updateClients(gameId);
            }
            else {
                clients[clientId].getConnection().send(JSON.stringify({
                    target: types_1.ServerRequestTarget.MakeMove,
                    type: types_1.ServerResponseStatus.Failure,
                    error: res
                }));
            }
        }
        else {
            clients[clientId].getConnection().send(JSON.stringify({
                target: types_1.ServerRequestTarget.MakeMove,
                type: types_1.ServerResponseStatus.Failure,
                error: 'NOT_IN_TURN'
            }));
        }
        // check the game status
        if (game.getGameStatus() === types_1.GameStatus.Player1Win ||
            game.getGameStatus() === types_1.GameStatus.Player2Win ||
            game.getGameStatus() === types_1.GameStatus.Draw) {
            delete games[gameId];
            delete clientsOnGames[gameId];
        }
    });
}
/* little helpers */
function getSpectators(gameId) {
    // check the game and return the clients that are not players
    const player1 = games[gameId].getPlayer1();
    const player2 = games[gameId].getPlayer2();
    const spectators = clientsOnGames[gameId].filter((clientId) => {
        return !(player1 === clientId || player2 === clientId);
    });
    return spectators.length;
}
//# sourceMappingURL=server.js.map