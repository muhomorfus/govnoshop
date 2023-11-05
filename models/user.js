const {Schema, model} = require('mongoose')

const userSchema = new Schema({
    email: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    confirmed: {
        type: Boolean,
        required: true,
        default: false,
    },
    confirmToken: String,
    resetToken: String,
    resetTokenCorrect: Boolean,
    resetTokenExpiration: Date,
    cart: {
        items: [
            {
                count: {
                    type: Number,
                    required: true,
                    default: 1,
                },
                courseId: {
                    type: Schema.Types.ObjectId,
                    ref: 'Course',
                    required: true,
                }
            }
        ]
    }
})

userSchema.methods.addToCart = function(course) {
    const items = [...this.cart.items]
    const idx = items.findIndex(item => {
        return item.courseId.toString() === course._id.toString()
    })

    if (idx >= 0) {
        items[idx].count++
    } else {
        items.push({
            courseId: course._id,
            count: 1,
        })
    }

    this.cart = {items}
    return this.save()
}

userSchema.methods.removeFromCart = function(id) {
    let items = [...this.cart.items]
    const idx = items.findIndex(item => {
        return item.courseId.toString() === id
    })

    if (idx >= 0) {
        if (items[idx].count > 1) {
            items[idx].count--
        } else {
            items = items.filter(item => item.courseId.toString() !== id)
        }
    }

    this.cart = {items}
    return this.save()
}

userSchema.methods.clearCart = function() {
    this.cart = {items: []}

    return this.save()
}

module.exports = model('User', userSchema)