const filename = '../data/rankers.json'
let ranks = require(filename)
const helper = require('../helpers/helper.js')

function getRanks() {
    return new Promise((resolve, reject) => {
        var top10 = ranks.slice(0, 20);
        resolve(top10);
    })
}

function insertRank(newRank) {
    return new Promise((resolve, reject) => {
        ranks.push(newRank)
        ranks.sort((r1, r2) => r2['score'] - r1['score'])
        ranks = ranks.slice(0, 20);
        helper.writeJSONFile(ranks)
        resolve(newRank)
    })
}

module.exports = {
    getRanks,
    insertRank
}