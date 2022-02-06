"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Client = exports.UserOption = exports.Turn = exports.Role = exports.ErrorCase = exports.GameStatus = exports.ServerRequestTarget = exports.ServerResponseStatus = void 0;
var ServerResponseStatus;
(function (ServerResponseStatus) {
    ServerResponseStatus["Success"] = "SUCCESS";
    ServerResponseStatus["Failure"] = "FAILURE";
})(ServerResponseStatus = exports.ServerResponseStatus || (exports.ServerResponseStatus = {}));
var ServerRequestTarget;
(function (ServerRequestTarget) {
    ServerRequestTarget["UpdateProfile"] = "PROFILE_UPDATE";
    ServerRequestTarget["CreateGame"] = "CREATE_GAME";
    ServerRequestTarget["ListGames"] = "LIST_GAMES";
    ServerRequestTarget["JoinGame"] = "JOIN_GAME";
    ServerRequestTarget["SpectateGame"] = "SPECTATE_GAME";
    ServerRequestTarget["GameUpdate"] = "GAME_UPDATE";
    ServerRequestTarget["MakeMove"] = "MAKE_MOVE";
})(ServerRequestTarget = exports.ServerRequestTarget || (exports.ServerRequestTarget = {}));
var GameStatus;
(function (GameStatus) {
    GameStatus["NotStarted"] = "Not Started";
    GameStatus["Player1Turn"] = "Player 1 Turn";
    GameStatus["Player2Turn"] = "Player 2 Turn";
    GameStatus["Player1Win"] = "Player 1 Win";
    GameStatus["Player2Win"] = "Player 2 Win";
    GameStatus["Draw"] = "Draw";
})(GameStatus = exports.GameStatus || (exports.GameStatus = {}));
var ErrorCase;
(function (ErrorCase) {
    ErrorCase["GameFull"] = "Game is full";
    ErrorCase["GameNotFull"] = "Game is not full";
    ErrorCase["InvalidPosition"] = "Invalid position";
})(ErrorCase = exports.ErrorCase || (exports.ErrorCase = {}));
var Role;
(function (Role) {
    Role[Role["Idle"] = 0] = "Idle";
    Role[Role["Player1"] = 1] = "Player1";
    Role[Role["Player2"] = 2] = "Player2";
    Role[Role["Spectator"] = 3] = "Spectator";
})(Role = exports.Role || (exports.Role = {}));
var Turn;
(function (Turn) {
    Turn[Turn["Player1"] = 0] = "Player1";
    Turn[Turn["Player2"] = 1] = "Player2";
    Turn[Turn["None"] = 2] = "None";
})(Turn = exports.Turn || (exports.Turn = {}));
var UserOption;
(function (UserOption) {
    UserOption[UserOption["UpdateProfile"] = 0] = "UpdateProfile";
    UserOption[UserOption["CreateGame"] = 1] = "CreateGame";
    UserOption[UserOption["JoinGame"] = 2] = "JoinGame";
    UserOption[UserOption["SpectateGame"] = 3] = "SpectateGame";
    UserOption[UserOption["ExitGame"] = 4] = "ExitGame";
})(UserOption = exports.UserOption || (exports.UserOption = {}));
class Client {
    constructor(id, connection) {
        this.turn = Turn.None;
        this.connection = connection;
        this.id = id;
    }
    setUsername(username) { this.username = username; }
    setTurn(turn) { this.turn = turn; }
    getConnection() { return this.connection; }
    getId() { return this.id; }
    getUsername() { return this.username; }
    getTurn() { return this.turn; }
}
exports.Client = Client;
//# sourceMappingURL=types.js.map