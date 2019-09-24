function checkFieldsRank(req, res, next) {
    const { score, name } = req.body

    if (score && name) {
        next()
    } else {
        res.status(400).json({ message: "fields are not good" })
    }

}

module.exports = {
    checkFieldsRank
}