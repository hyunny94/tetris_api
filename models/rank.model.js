const filename = '../data/rankers.json'
let ranks = require(filename)
const helper = require('../helpers/helper.js')

function getRanks() {
    return new Promise((resolve, reject) => {
        if (ranks.length === 0) {
            reject({
                message: 'no ranks available',
                status: 202
            })
        }
        resolve(ranks)
    })
}
function insertRank(newRank) {
    return new Promise((resolve, reject) => {
        ranks.push(newRank)
        helper.writeJSONFile(ranks)
        resolve(newRank)
    })
}

module.exports = {
    getRanks,
    insertRank
}