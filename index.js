const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const uuid = require('uuid')

const app = express()
app.use(morgan('tiny'))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

const TETRIS_BATTLE_DURATION_IN_SEC = 120;

const corsOptions = {
	origin: [
		'https://master.d1eay1f6v0z5km.amplifyapp.com', 
		'https://www.kyothrees.com', 
		'https://kyothrees.com',
		'http://localhost:3000'
	], 
	methods: ["GET", "POST"]
}

app.use(cors(corsOptions))

app.use(require('./routes/index.routes'))

app.get('/', (req, res) => {
	res.json({ message: "yo" })
})

const socketIO = require('socket.io')(app.listen('9000'), {
	cors: corsOptions
  })

// Object mapping player socket to active game id
let playerIdToGameId = {}

let gameIdToState = {}

// sockets of players waiting to be matched
let waitingRoom = []

socketIO.on('connection', (socket) => {
	const playerId = socket.id
	console.log("a user connected: ", playerId)
	 
	// Quick Match Request
	socket.on("playTetrisBattleWithSomeone", () => {
		console.log("Quick match request received. playerId: ", playerId)
		// if there is someone in the waiting room
		if (waitingRoom.length !== 0) {
			// If the person in the waiting room is myself.. still has to wait.
			if (!(waitingRoom[0].id === playerId)) {
				const opponentSocket = waitingRoom.pop()
				// create a new unique game id
				const gameId = uuid.v1()
				const sockets = [socket, opponentSocket]
				sockets.forEach(socket => {
					// have the two players join the room 
					socket.join(gameId)
					// two players are mapped to the same gameId
					playerIdToGameId[socket.id]         = gameId
				})
	
				// initialize game state
				gameIdToState[gameId] = {paused: false, pausedBy: null, 
					pauseTimer: null, pauseSecLeft: null, pauseSecTimer: null, 
					timeUpdateInterval: null, secLeft: TETRIS_BATTLE_DURATION_IN_SEC, sockets}
	
				// Let the players know they are matched
				socketIO.to(gameId).emit("matched")

				// Start an interval that updates players of remaining time every second. 
				gameIdToState[gameId].timeUpdateInterval = setInterval(() => {
					socketIO.to(gameId).emit("timeUpdate")
					gameIdToState[gameId].secLeft -= 1
					// Game over: 2 minutes of tetris battle ran out
					if (gameIdToState[gameId].secLeft === 0) {
						socketIO.to(gameId).emit("game over")
						gameIdToState[gameId].sockets.forEach(socket => {
							delete playerIdToGameId[socket.id]
							socket.leave(gameId)
						})
						clearInterval(gameIdToState[gameId].timeUpdateInterval);
					}
				}, 1000)
			}
		}
		// else the new user is put into the waiting room.
		else {
			waitingRoom.unshift(socket)
			console.log(playerId, " entered the waiting room.")
			socket.emit("entered waiting room")
		}
	})

	// pause or resume
	socket.on("pauseOrResume", () => {
		console.log("pause or resume");
		let gameId = playerIdToGameId[socket.id];
		let gameState = gameIdToState[gameId];
		// if the game is running, anyone can pause the game.
		if (!gameState.paused) {
			// stop the game clock
			clearInterval(gameState.timeUpdateInterval)
			gameState.paused = true;
			gameState.pausedBy = playerId;
			// automatically resume the game after 5 seconds.
			gameState.pauseTimer = setTimeout(() => {
				clearInterval(gameState.pauseSecTimer)
				gameState.paused = false;
				gameState.pausedBy = null;
				gameState.pauseTimer = null;
				gameState.pauseSecLeft = null;
				gameState.pauseSecTimer = null;
				gameState.timeUpdateInterval = setInterval(() => {
					socketIO.to(gameId).emit("timeUpdate")
					gameIdToState[gameId].secLeft -= 1
					// Game over: 2 minutes of tetris battle ran out
					if (gameIdToState[gameId].secLeft === 0) {
						socketIO.to(gameId).emit("game over")
						gameIdToState[gameId].sockets.forEach(socket => {
							delete playerIdToGameId[socket.id]
							socket.leave(gameId)
						})
						clearInterval(gameIdToState[gameId].timeUpdateInterval);
					}
				}, 1000)
				gameIdToState.gameId = gameState;
				socketIO.to(gameId).emit("pauseOrResume");
			}, 5000)
			gameState.pauseSecLeft = 5;
			gameState.pauseSecTimer = setInterval(() => {
				socketIO.to(gameId).emit("displayPauseSecLeft", gameState.pauseSecLeft);
				gameState.pauseSecLeft -= 1;
			}, 1000)

			gameIdToState.gameId = gameState;
			// emit "pauseOrResume" to everyone else in the room.
			socketIO.to(gameId).emit("pauseOrResume");
		}
		// if the game is paused, the one who paused it can only unpause it. 
		else {
			if (gameState.pausedBy === playerId) {
				// cancel the 5 second timer for resuming
				clearTimeout(gameState.pauseTimer);
				clearInterval(gameState.pauseSecTimer);
				gameState.paused = false;
				gameState.pausedBy = null;
				gameState.pauseTimer = null;
				gameState.pauseSecLeft = null;
				gameState.pauseSecTimer = null;
				gameState.timeUpdateInterval = setInterval(() => {
					socketIO.to(gameId).emit("timeUpdate")
					gameIdToState[gameId].secLeft -= 1
					// Game over: 2 minutes of tetris battle ran out
					if (gameIdToState[gameId].secLeft === 0) {
						socketIO.to(gameId).emit("game over")
						gameIdToState[gameId].sockets.forEach(socket => {
							delete playerIdToGameId[socket.id]
							socket.leave(gameId)
						})
						clearInterval(gameIdToState[gameId].timeUpdateInterval);
					}
				}, 1000)
				gameIdToState.gameId = gameState;
				socketIO.to(gameId).emit("pauseOrResume");
			}
		}
	})

	// Send lines
	socket.on("addGarbageLines", (numLines) => {
		console.log("send ", numLines, " lines.");
		let gameId = playerIdToGameId[socket.id];
		socket.to(gameId).emit("addGarbageLines", numLines);
	})

	// Send gameBoard and active updates
	socket.on("boardChange", (gameBoard, active, nextTetType) => {
		let gameId = playerIdToGameId[socket.id];
		socket.to(gameId).emit("boardChange", gameBoard, active, nextTetType);
	})

	// Send heldBlock update
	socket.on("heldBlockChange", (heldBlock) => {
		let gameId = playerIdToGameId[socket.id];
		socket.to(gameId).emit("heldBlockChange", heldBlock);
	})

	// KOed
	socket.on("KOed", () => {
		let gameId = playerIdToGameId[socket.id];
		socket.to(gameId).emit("KOed");
	})

	// totalLinesSent changed
	socket.on("linesSentChanged", (totalLinesSent) => {
		let gameId = playerIdToGameId[socket.id];
		socket.to(gameId).emit("linesSentChanged", totalLinesSent);
	})

	// communicating name to opponent 
	socket.on("myNameIs", (name) => {
		let gameId = playerIdToGameId[socket.id];
		socket.to(gameId).emit("myNameIs", name);
	})

	// User Disconnect
	socket.on("disconnect", () => {
		console.log("a user disconnected")
		// if a player exits out of tetris battle, make sure he is kicked out of the waiting room
		if (waitingRoom.length > 0 && waitingRoom[0].id === socket.id) {
			console.log("exitTetrisBattle2")
			waitingRoom.pop();
		}
	})
})


