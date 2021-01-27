const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const uuid = require('uuid')

const app = express()
app.use(morgan('tiny'))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

const corsOptions = {
	origin: [
		'https://master.d1eay1f6v0z5km.amplifyapp.com', 
		'https://www.kyothrees.com', 
		'https://kyothrees.com',
		'http://localhost:3000'
	]
}

app.use(cors(corsOptions))

app.use(require('./routes/index.routes'))

app.get('/', (req, res) => {
	res.json({ message: "yo" })
})

const socketIO = require('socket.io')(app.listen('9000'), {
	cors: {
	  origin: 'http://localhost:3000',
	  methods: ["GET", "POST"]
	}
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
		// if there is someone in the waiting room, match the new user
		if (waitingRoom.length !== 0) {
			const opponentSocket = waitingRoom.pop()
			// create a new unique game id
			const gameId = uuid.v1()
			// have the two players join the room 
			socket.join(gameId)
			opponentSocket.join(gameId)

			// initialize game state
			gameIdToState[gameId] = {paused: false, pausedBy: null, 
				pauseTimer: null, pauseSecLeft: null, pauseSecTimer: null, }

			// two players are mapped to the same gameId
			playerIdToGameId[socket.id]         = gameId
			playerIdToGameId[opponentSocket.id] = gameId

			// set a timer for 2 minutes and have it delete the mappings in playerToGameId object 
			// TODO: do i have to give socket and opponentSocket as parameters? 
			setTimeout(() => {
				delete playerIdToGameId[socket.id]
				delete playerIdToGameId[opponentSocket.id]
				socketIO.to(gameId).emit("game over")
				socket.leave(gameId)
				opponentSocket.leave(gameId)
			}, 120000, socket, opponentSocket)

			// Let the players know they are matched
			socketIO.to(gameId).emit("matched")
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

	// User Disconnect
	socket.on("disconnect", () => {
		console.log("a user disconnected")
	})
})


