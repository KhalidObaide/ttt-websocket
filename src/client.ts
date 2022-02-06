import { WebSocket } from 'ws';
import {
    UserOption,
    ServerResponseStatus,
    ServerRequestTarget,
    Role,
    GameStatus
} from './types';
import prompt from 'prompt-sync';
const promptSync = prompt();

const connection = new WebSocket('ws://localhost:2020');
let role: Role = Role.Idle

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
        case ServerRequestTarget.UpdateProfile:
            responseUpdateProfile(data);
            break;
        case ServerRequestTarget.CreateGame:
            responseCreateGame(data);
            break;
        case ServerRequestTarget.ListGames:
            responseListGames(data);
            break;
        case ServerRequestTarget.JoinGame:
            responseJoinGame(data);
            break;
        case ServerRequestTarget.SpectateGame:
            responseSpectateGame(data);
            break;
        case ServerRequestTarget.GameUpdate:
            responseGameUpdate(data);
            break;
    }
}

function getUserOption(): UserOption {
    console.log(`
        [1]. Set/Update profile name
        [2]. Create a game
        [3]. Join a game
        [4]. Spectate a game
        [5]. Exit
    `)

    const allOptions = {
        '1': UserOption.UpdateProfile,
        '2': UserOption.CreateGame,
        '3': UserOption.JoinGame,
        '4': UserOption.SpectateGame,
        '5': UserOption.ExitGame
    }

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
    role = Role.Idle;

    const userOption: UserOption = getUserOption();
    let handler: Function = () => {};

    switch (userOption) {
        case UserOption.UpdateProfile:
            handler = updateProfile;
            break;
        case UserOption.CreateGame:
            handler = createGame;
            break;
        case UserOption.JoinGame:
            handler = joinGame;
            break;
        case UserOption.SpectateGame:
            handler = spectateGame;
            break;
        case UserOption.ExitGame:
            handler = exitGame;
            break;
    }

    handler();
}

/* controllers */
function exitGame(): void {
    process.exit(0);
}


/* Profile Update */
function updateProfile(): void {
    const username = promptSync('Enter your name: ');
    connection.send(JSON.stringify({
        type: 'UPDATE_PROFILE',
        username
    }));
}

function responseUpdateProfile(data) {
    if (data.type === ServerResponseStatus.Success) {
        console.log('Profile updated successfully!');
    } else if (data.type === ServerResponseStatus.Failure) {
        console.log('Profile update failed!');
    }

    run();
}



/* Create Game */
function createGame(): void {
    connection.send(JSON.stringify({
        type: 'CREATE_GAME'
    }));
}

function responseCreateGame(data) {
    if (data.type === ServerResponseStatus.Success) {
        console.log('\n###############################');
        console.log('Game created successfully!');
        console.log('Waiting for other players to join...');
        console.log('Game ID: ', data.gameId);
        console.log('###############################\n');

        role = Role.Player1;
    } else if (data.type === ServerResponseStatus.Failure) {
        console.log('Game creation failed!');
        console.log('Error message: ', data.message);
        run();
    }
}


/* list games */
let TMP_CALLBACK: Function = () => {}; // a trick to pass the callback
function listGames(callback: Function) {
    connection.send(JSON.stringify({
        type: 'LIST_GAMES'
    }));
    TMP_CALLBACK = callback;
}

function responseListGames(data) {
    if (data.type === ServerResponseStatus.Success) {
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
        TMP_CALLBACK = () => {};
    } else if (data.type === ServerResponseStatus.Failure) {
        console.log('List of available games failed!');
        console.log('Error message: ', data.message);

        run();
    }
}


/* Join Game */
function joinGame() {
    listGames(()=>{
        const gameId = promptSync('Enter the game ID: ');
        connection.send(JSON.stringify({
            type: 'JOIN_GAME',
            gameId
        }));
    });
}

function responseJoinGame(data) {
    if (data.type === ServerResponseStatus.Success) {
        console.log('\n###############################');
        console.log('Game joined successfully!');
        console.log('Game ID: ', data.gameId);
        console.log('###############################\n');
        role = Role.Player2;
    } else if (data.type === ServerResponseStatus.Failure) {
        console.log('Game join failed!');
        console.log('Error message: ', data.message);
        run();
    }
}

/* Spectate Game */
function spectateGame() {
    listGames(()=>{
        const gameId = promptSync('Enter the game ID: ');
        connection.send(JSON.stringify({
            type: 'SPECTATE_GAME',
            gameId
        }));
    });
}

function responseSpectateGame(data) {
    if (data.type === ServerResponseStatus.Success) {
        console.log('\n###############################');
        console.log('Game joined successfully!');
        console.log('Game ID: ', data.gameId);
        console.log('###############################\n');
        role = Role.Spectator;
    } else if (data.type === ServerResponseStatus.Failure) {
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
    if (data.type === ServerResponseStatus.Success) {
        console.log('[+] Move made successfully!');
    } else if (data.type === ServerResponseStatus.Failure) {
        console.log('Move failed!');
        console.log('Error message: ', data.message);
        makeMove();
    }
}

/* server updates */
function responseGameUpdate(data) {
    const board: string[][] = data.game.board.map((row, idx) => {
        return row.map((cell, i) => {
            return cell || (idx*3 + i + 1).toString();
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
    if ( (role === Role.Player1 && data.game.status === GameStatus.Player1Turn) ||
          (role === Role.Player2 && data.game.status === GameStatus.Player2Turn)) {
        makeMove();

    }else if ( data.game.status === GameStatus.Player1Win ||
               data.game.status === GameStatus.Player2Win ||
               data.game.status === GameStatus.Draw ) {
        console.log(data.game.status, 'status')
        switch ( data.game.status ) {
            case GameStatus.Player1Win:
                if (role === Role.Player1) {
                    console.log('\n###############################');
                    console.log('You won!');
                    console.log('###############################\n');
                } else {
                    console.log('\n###############################');
                    console.log('${data.game.player1} won!');
                    console.log('###############################\n');
                }
                break;
            case GameStatus.Player2Win:
                if (role === Role.Player2) {
                    console.log('\n###############################');
                    console.log('You won!');
                    console.log('###############################\n');
                } else {
                    console.log('\n###############################');
                    console.log('${data.game.player2} won!');
                    console.log('###############################\n');
                }
                break;

            case GameStatus.Draw:
                console.log('\n###############################');
                console.log('Draw!');
                console.log('###############################\n');
                break;
        }

        run();
    }

}

