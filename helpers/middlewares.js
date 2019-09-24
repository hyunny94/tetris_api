function checkFieldsRank(req, res, next) {
    console.log("checking if the fields are good");
    const { score, name } = req.body;
    console.log("request ");
    console.log(req)
    console.log("score" + score);
    console.log("name" + name);
    if (score && name) {
        console.log("fields are good");
        next()
    } else {
        console.log("fields are bad")
        res.status(400).json({ message: "fields are not good" })
    }

}

module.exports = {
    checkFieldsRank
}