import * as http from 'http';
import * as WebSocket from 'ws';
import * as uuid from 'uuid';
import Game from './game';
import {
    Client,
    GameStatus,
    ErrorCase,
    Turn,
    ServerResponseStatus,
    ServerRequestTarget,
} from './types';


const socket: WebSocket.Server = new WebSocket.Server({ port: 2020 });
console.log('Websocket is listening on port 2020');

const games: { [key: string]: Game } = {};
const clients: { [key: string]: Client } = {};
const clientsOnGames: { [key: string]: string[] } = {};
const usernames: { [key: string]: string } = {};

socket.on('connection', (client: WebSocket) => {
    const clientId: string = uuid.v4();
    clients[clientId] = new Client(clientId, client);

    client.on('message', (message: string) => {
        const data: any = JSON.parse(message);
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
function updateClients(gameId: string) {
    // get all the clients in the game ( either playing or watching )
    const clientsInGame: string[] = clientsOnGames[gameId];
    const game: Game = games[gameId];
    if (clientsInGame) {
        clientsInGame.forEach((clientId: string) => {
            const client: Client = clients[clientId];
            if (client) {
                client.getConnection().send(JSON.stringify({
                    target: ServerRequestTarget.GameUpdate,
                    type: ServerResponseStatus.Success,
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
function middleware(clientId: string, target: ServerRequestTarget, next: Function) {
    if (!clients[clientId].getUsername()) {
        clients[clientId].getConnection().send(JSON.stringify({
            target: target,
            type: ServerResponseStatus.Failure,
            message: 'USERNAME_REQUIRED'
        }));
        return;
    }

    next();
}

/* handlers */
function updateProfile(clientId: string, username: string) {
    clients[clientId].setUsername(username);
    usernames[clientId] = username;

    clients[clientId].getConnection().send(JSON.stringify({
        target: ServerRequestTarget.UpdateProfile,
        type: ServerResponseStatus.Success,
        username: username
    }));
}

function createGame(clientId: string) {
    middleware(clientId, ServerRequestTarget.CreateGame, () => {
        const gameUuid = uuid.v4();
        games[gameUuid] = new Game(gameUuid);
        const res: ErrorCase | boolean = games[gameUuid].joinPlayer(clientId);

        if (res === true) {
            clientsOnGames[gameUuid] = [clientId];
            clients[clientId].setTurn(Turn.Player1);
            clients[clientId].getConnection().send(JSON.stringify({
                target: ServerRequestTarget.CreateGame,
                type: ServerResponseStatus.Success,
                gameId: gameUuid,
            }));
        } else {
            clients[clientId].getConnection().send(JSON.stringify({
                target: ServerRequestTarget.CreateGame,
                type: ServerResponseStatus.Failure,
                error: res
            }));
        }
    });
}

function listGames(clientId: string) {
    middleware(clientId, ServerRequestTarget.ListGames, () => {
        const gameIds: string[] = Object.keys(games);
        const gameList = [];
        gameIds.forEach((gameId: string) => {
            const game: Game = games[gameId];
            gameList.push({
                gameId: gameId,
                status: game.getGameStatus(),
                player1: usernames[game.getPlayer1()] || 'Not Joined',
                player2: usernames[game.getPlayer2()] || 'Not Joined',
                spectators: getSpectators(gameId),
            });
        });

        clients[clientId].getConnection().send(JSON.stringify({
            target: ServerRequestTarget.ListGames,
            type: ServerResponseStatus.Success,
            games: gameList
        }));
    });
}

function joinGame(clientId: string, gameId: string) {
    // check if the game exists
    if (!games[gameId]) {
        clients[clientId].getConnection().send(JSON.stringify({
            target: ServerRequestTarget.JoinGame,
            type: ServerResponseStatus.Failure,
            message: 'GAME_NOT_FOUND'
        }));
        return;
    }

    middleware(clientId, ServerRequestTarget.JoinGame, () => {
        const res: ErrorCase | boolean = games[gameId].joinPlayer(clientId);
        if (res === true) {
            clientsOnGames[gameId].push(clientId);
            clients[clientId].setTurn(Turn.Player2);
            games[gameId].startGame();
            clients[clientId].getConnection().send(JSON.stringify({
                target: ServerRequestTarget.JoinGame,
                type: ServerResponseStatus.Success,
                gameId: gameId,
            }));

            updateClients(gameId);
        } else {
            clients[clientId].getConnection().send(JSON.stringify({
                target: ServerRequestTarget.JoinGame,
                type: ServerResponseStatus.Failure,
                message: res
            }));
        }
    });
}


function spectateGame(clientId: string, gameId: string) {
    // check if the game exists
    if (!games[gameId]) {
        clients[clientId].getConnection().send(JSON.stringify({
            target: ServerRequestTarget.SpectateGame,
            type: ServerResponseStatus.Failure,
            message: 'GAME_NOT_FOUND'
        }));
        return;
    }

    middleware(clientId, ServerRequestTarget.SpectateGame, () => {
        clientsOnGames[gameId].push(clientId);
        clients[clientId].getConnection().send(JSON.stringify({
            target: ServerRequestTarget.SpectateGame,
            type: ServerResponseStatus.Success,
            gameId: gameId,
        }));

        updateClients(gameId);
    });
}

function makeMove(clientId: string, position: number) {
    middleware(clientId, ServerRequestTarget.MakeMove, () => {
        const gameId: string = Object.keys(clientsOnGames).find((gameId: string) => {
            return clientsOnGames[gameId].includes(clientId);
        });

        // check if the game doesn't exist
        if (!gameId) {
            clients[clientId].getConnection().send(JSON.stringify({
                target: ServerRequestTarget.MakeMove,
                type: ServerResponseStatus.Failure,
                error: 'GAME_NOT_FOUND'
            }));
            return;
        }

        const game: Game = games[gameId];
        const client: Client = clients[clientId];
        if (
            ( game.getGameStatus() === GameStatus.Player1Turn && client.getTurn() === Turn.Player1 ) ||
            ( game.getGameStatus() === GameStatus.Player2Turn && client.getTurn() === Turn.Player2 )
        ) {
            const res: ErrorCase | boolean = game.makeMove(position);
            if (res === true) {
                updateClients(gameId);
            } else {
                clients[clientId].getConnection().send(JSON.stringify({
                    target: ServerRequestTarget.MakeMove,
                    type: ServerResponseStatus.Failure,
                    error: res
                }));
            }
        } else {
            clients[clientId].getConnection().send(JSON.stringify({
                target: ServerRequestTarget.MakeMove,
                type: ServerResponseStatus.Failure,
                error: 'NOT_IN_TURN'
            }));
        }

        // check the game status
        if (game.getGameStatus() === GameStatus.Player1Win ||
            game.getGameStatus() === GameStatus.Player2Win ||
            game.getGameStatus() === GameStatus.Draw) {
            delete games[gameId];
            delete clientsOnGames[gameId];
        }
    });
}


/* little helpers */
function getSpectators(gameId: string): number {
    // check the game and return the clients that are not players
    const player1 = games[gameId].getPlayer1();
    const player2 = games[gameId].getPlayer2();
    const spectators = clientsOnGames[gameId].filter((clientId: string) => {
        return !(player1 === clientId || player2 === clientId);
    });

    return spectators.length;
}



