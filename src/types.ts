export enum ServerResponseStatus {
    Success = 'SUCCESS',
    Failure = 'FAILURE',
}

export enum ServerRequestTarget {
    UpdateProfile = 'PROFILE_UPDATE',
    CreateGame = 'CREATE_GAME',
    ListGames = 'LIST_GAMES',
    JoinGame = 'JOIN_GAME',
    SpectateGame = 'SPECTATE_GAME',
    GameUpdate = 'GAME_UPDATE',
    MakeMove = 'MAKE_MOVE',
}

export enum GameStatus {
    NotStarted = 'Not Started',
    Player1Turn = 'Player 1 Turn',
    Player2Turn = 'Player 2 Turn',
    Player1Win = 'Player 1 Win',
    Player2Win = 'Player 2 Win',
    Draw = 'Draw',
}

export enum ErrorCase {
    GameFull = 'Game is full',
    GameNotFull = 'Game is not full',
    InvalidPosition = 'Invalid position'
}

export enum Role {
    Idle,
    Player1,
    Player2,
    Spectator
}

export enum Turn {
    Player1,
    Player2,
    None
}

export enum UserOption {
    UpdateProfile,
    CreateGame,
    JoinGame,
    SpectateGame,
    ExitGame
}


export class Client {
    private id: string;
    private connection: WebSocket;
    private username: string;
    private turn: Turn = Turn.None;

    constructor(id: string, connection: WebSocket) {
        this.connection = connection;
        this.id  = id;
    }

    setUsername(username: string): void { this.username = username; }
    setTurn(turn: Turn): void { this.turn = turn; }

    getConnection(): WebSocket { return this.connection; }
    getId(): string { return this.id; }
    getUsername(): string { return this.username; }
    getTurn(): Turn { return this.turn; }

}

