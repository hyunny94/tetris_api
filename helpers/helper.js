const fs = require('fs')

function writeJSONFile(content) {
    fs.writeFileSync('./data/rankers.json', JSON.stringify(content), 'utf8',
        (err) => {
            if (err) {
                return console.log(err)
            }
        })
    console.log('the file was saved!');
}

module.exports = {
    writeJSONFile
}