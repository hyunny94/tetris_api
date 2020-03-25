const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const socketIO = require('socket.io')

const app = express()
app.use(morgan('tiny'))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

const corsOptions = {
	origin: ['https://master.d1eay1f6v0z5km.amplifyapp.com', 'https://www.kyothrees.com', 'https://kyothrees.com']
}

app.use(cors(corsOptions))

app.use(require('./routes/index.routes'))

app.get('/', (req, res) => {
	res.json({ message: "yo" })
})

const server = app.listen('9000')

const io = socketIO(server)

// players that have been matched with an opponent has an entry in 
// this dictionary. value is the opponent's socket ID
const players = {}

// players waiting to be matched with an opponent
const lockerRoom = []

io.on("connection", socket => {
	console.log("New client connected");
	console.log("socket id is", socket.id);
	// new match
	if (lockerRoom.length == 1) {
		var playerOneSocket = lockerRoom.pop();
		var roomName = playerOneSocket.id + socket.id;
		console.log("roomName is ", roomName);
		players[socket.id] = roomName;
		players[playerOneSocket.id] = roomName;
		playerOneSocket.join(roomName);
		socket.join(roomName);
		io.to(roomName).emit("game start");
	}
	// wait in lockerRoom
	else {
		lockerRoom.push(socket);
	}

	socket.on("pause", () => {
		console.log("a player paused the game");
		io.to(players[socket.id]).emit("pause");
	});

	socket.on("unpause", () => {
		console.log("a player unpaused the game");
		io.to(players[socket.id]).emit("unpause");
	});
	
	socket.on("disconnect", () => {
			io.to(players[socket.id]).emit("opponent left");
			console.log("Client disconnected")
		}
	);
  });