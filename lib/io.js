const fs = require('fs')

// Get the JSON data
exports.readJSON = (file) => {
    try {
        const json = fs.readFileSync(`${__dirname}/../data/${file}.json`, 'utf8')
        return JSON.parse(json)
    } catch (err) {
        console.error("File read failed:", err)
    }
}
