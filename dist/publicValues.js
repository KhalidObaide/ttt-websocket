"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Turn = exports.Mode = exports.ErrorCase = exports.GameStatus = void 0;
var GameStatus;
(function (GameStatus) {
    GameStatus[GameStatus["NotStarted"] = 0] = "NotStarted";
    GameStatus[GameStatus["Player1Turn"] = 1] = "Player1Turn";
    GameStatus[GameStatus["Player2Turn"] = 2] = "Player2Turn";
    GameStatus[GameStatus["Player1Win"] = 3] = "Player1Win";
    GameStatus[GameStatus["Player2Win"] = 4] = "Player2Win";
    GameStatus[GameStatus["Draw"] = 5] = "Draw";
})(GameStatus = exports.GameStatus || (exports.GameStatus = {}));
var ErrorCase;
(function (ErrorCase) {
    ErrorCase["GameFull"] = "Game is full";
    ErrorCase["GameNotFull"] = "Game is not full";
    ErrorCase["InvalidPosition"] = "Invalid position";
})(ErrorCase = exports.ErrorCase || (exports.ErrorCase = {}));
var Mode;
(function (Mode) {
    Mode[Mode["Idle"] = 0] = "Idle";
    Mode[Mode["Playing"] = 1] = "Playing";
    Mode[Mode["Waiting"] = 2] = "Waiting";
    Mode[Mode["Spectating"] = 3] = "Spectating";
})(Mode = exports.Mode || (exports.Mode = {}));
var Turn;
(function (Turn) {
    Turn[Turn["Player1"] = 0] = "Player1";
    Turn[Turn["Player2"] = 1] = "Player2";
    Turn[Turn["None"] = 2] = "None";
})(Turn = exports.Turn || (exports.Turn = {}));
//# sourceMappingURL=publicValues.js.map