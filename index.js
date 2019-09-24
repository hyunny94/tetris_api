const express = require('express')
const morgan = require('morgan')
const cors = require('cors')

const app = express()
app.use(morgan('tiny'))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use(cors())

app.use(require('./routes/index.routes'))



app.get('/', (req, res) => {
	res.json({ message: "yo" })
})

app.listen('9000')
