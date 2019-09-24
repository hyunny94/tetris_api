const express = require('express')
const morgan = require('morgan')
const cors = require('cors')

const app = express()
app.use(morgan('tiny'))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(require('./routes/index.routes'))

//allow OPTIONS on just one resource
app.options("https://master.d1eay1f6v0z5km.amplifyapp.com", cors())

app.get('/', (req, res) => {
	res.json({ message: "yo" })
})

app.listen('9000')
