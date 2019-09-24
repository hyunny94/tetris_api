const express = require('express')
const router = express.Router()
const rank = require('../models/rank.model')
const m = require('../helpers/middlewares')

module.exports = router

router.get('/', async (req, res) => {
    res.header("Access-Control-Allow-Origin", "https://master.d1eay1f6v0z5km.amplifyapp.com");
    await rank.getRanks()
        .then(ranks => {
            // console.log(res);
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

router.post('/', m.checkFieldsRank, async (req, res) => {
    res.header("Access-Control-Allow-Origin", "https://master.d1eay1f6v0z5km.amplifyapp.com");
    await rank.insertRank(req.body)
        .then(rank => res.status(201).json({
            message: "The rank is created",
            content: rank
        }))
        .catch(err => res.status(500).json({ message: err.message }))
})