const crypto = require('crypto')

module.exports = function () {
    return new Promise((resolve, reject) => {
        crypto.randomBytes(64, (err, buf) => {
            if (err) {
                reject(err)
            }

            const token = buf.toString('hex')
            resolve(token)
        })
    })
}