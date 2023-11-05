module.exports = {
    ifeq(a, b, options) {
        if (a === b) {
            return options.fn(this)
        } else {
            if (a !== null && b !== null) {
                if (a.toString() === b.toString()) {
                    return options.fn(this)
                } else {
                    return options.inverse(this)
                }
            } else {
                return options.inverse(this)
            }
        }
    }
}