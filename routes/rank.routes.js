const express = require('express')
const router = express.Router()
const rank = require('../models/rank.model')

module.exports = router

router.get('/', async (req, res) => {
    await rank.getRanks()
        .then(ranks => {
            return res.json(ranks);
        })
        .catch(err => {
            if (err.status) {
                res.status(err.status).json({ message: err.message })
            } else {
                res.status(500).json({ message: err.message })
            }
        })
})

router.post('/', async (req, res) => {
    await rank.insertRank(req.body)
        .then(rank => res.status(201).json({
            message: "The rank is created",
            content: rank
        }))
        .catch(err => res.status(500).json({ message: err.message }))
})