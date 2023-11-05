const {Router} = require('express')
const Course = require('../models/course')
const router = Router()
const auth = require('../middleware/auth')

function mapCartItems(cart) {
    return cart.items.map((item) => ({
        ...item.courseId._doc,
        id: item.courseId.id,
        count: item.count,
    }))
}

function computeTotal(courses) {
    return courses.reduce((total, c) => {
        return total + c.count * c.price
    }, 0)
}

router.post('/add', auth, async (req, res) => {
    const course = await Course.findById(req.body.id)
    await req.user.addToCart(course)

    res.redirect('/cart')
})

router.delete('/remove/:id', auth, async (req, res) => {
    await req.user.removeFromCart(req.params.id)
    const user = await req.user
        .populate('cart.items.courseId')
        .execPopulate()

    const courses = mapCartItems(user.cart)
    const cart = {
        courses, total: computeTotal(courses)
    }

    res.status(200).json(cart)
})

router.get('/', auth, async (req, res) => {
    const user = await req.user
        .populate('cart.items.courseId')
        .execPopulate()

    const courses = mapCartItems(user.cart)
    const total = computeTotal(courses)

    res.render('cart', {
        'isCart': true,
        'title': 'Корзина',
        'courses': courses,
        'total': total,
    })
})

module.exports = router