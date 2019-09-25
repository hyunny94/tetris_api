const express = require('express')
const morgan = require('morgan')
const cors = require('cors')

const app = express()
app.use(morgan('tiny'))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

const corsOptions = {
	origin: ['https://master.d1eay1f6v0z5km.amplifyapp.com', 'https://kyothrees.com']
}

app.use(cors(corsOptions))

app.use(require('./routes/index.routes'))

app.get('/', (req, res) => {
	res.json({ message: "yo" })
})

app.listen('9000')
