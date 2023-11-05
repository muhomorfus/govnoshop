const fs = require('fs')
const toml = require('toml')
const path = require('path')

module.exports = {
    load: function () {
        const appRoot = path.dirname(require.main.filename || process.mainModule.filename)
        const cfgPath = path.join(appRoot, 'config.toml')
        const file = fs.readFileSync(cfgPath, 'utf-8')

        const cfg = toml.parse(file)
        for (let option of Object.keys(cfg)) {
            this[option] = cfg[option]
        }
    },
}