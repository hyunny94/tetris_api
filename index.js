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
let playerToGameId = {}

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

			// two players are mapped to the same gameId
			playerToGameId[socket]         = gameId
			playerToGameId[opponentSocket] = gameId

			// set a timer for 2 minutes and have it delete the mappings in playerToGameId object 
			setTimeout(() => {
				delete playerToGameId.socket
				delete playerToGameId.opponentSocket
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

	// User Disconnect
	socket.on("disconnect", () => {
		console.log("a user disconnected")
	})
})


