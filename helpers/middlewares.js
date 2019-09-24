function checkFieldsRank(req, res, next) {
    console.log("checking if the fields are good");
    const { score, name } = req.body

    if (score && name) {
        console.log("fields are good");
        next()
    } else {
        res.status(400).json({ message: "fields are not good" })
    }

}

module.exports = {
    checkFieldsRank
}