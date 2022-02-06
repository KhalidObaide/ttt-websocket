# Tic-Tac-Toe over websockets ( typescript )
It uses `ws` library to create a socket connection between the server and the
client.

The whole game is handled by the server, and there is also an interaction user
interface implmented in the client side.

As a client you can either create/join/spectate the game, but make sure to set
a fullname first as it is **required** in order to trigger those actions

### Setup & Usage
#### 1. Using devel environment
1. Clone the repo & change directory to `ttt-websocket`
2. Run `npm ci` in order install the required dependencies
3. Run `./run.sh` ( Only for unix based operating systems )
4. if you are using other operating system(s) use the following commands
```
npm run start:<client|server>
```

#### 2. Docker
1. Clone the repo & changethe directory to `ttt-websocket`
2. Build the project using Docker `docker build -t ttt-websocket:latest .`
3. Run the Docker image and make sure to jump into the `/bin/sh` shell
4. From there navigate to `/app` and run `./run.sh`
5. The rest of steps are user-friendly and well explained once the app is runned


### Notes
1. The socket server is listening for port 2020
2. The game logic is using OOP structure and the rest of logics such as socket
connections and handling requests and responses are done by Functional
prgoramming in Js (Ts).
3. In case of any failures, or help. please make sure to create a github issue.

