const {Router} = require('express')
const Order = require('../models/order')
const router = Router()
const auth = require('../middleware/auth')

router.get('/', auth, async (req, res) => {
    try {
        const orders = await Order.find({
            'user.userId': req.user._id,
        })
            .populate('user.userId')

        res.render('orders', {
            isOrders: true,
            title: 'Заказы',
            orders: orders.map(order => ({
                ...order._doc,
                total: order.courses.reduce((total, c) => {
                    return total + c.count * c.course.price
                }, 0)
            })).reverse()
        })
    } catch(e) {
        console.error(e)
    }
})

router.post('/new', auth, async (req, res) => {
    try {
        const user = await req.user
            .populate('cart.items.courseId')
            .execPopulate()

        const courses = user.cart.items.map(item => ({
            count: item.count,
            course: {...item.courseId._doc},
        }))

        const order = new Order({
            user: {
                name: req.user.name,
                userId: req.user,
            },
            courses: courses,
        })

        await order.save()
        await req.user.clearCart()
    } catch(e) {
        console.error(e)
    }

    res.redirect('/orders')
})

module.exports = router