const {Router} = require('express')
const router = Router()
const auth = require('../middleware/auth')
const Course = require('../models/course')

router.get('/', auth, (req, res) => {
    res.render('add', {
        'title': 'Добавление курса',
        'isAdd': true
    })
})

router.post('/', auth, async (req, res) => {
    const course = new Course({
        title: req.body.title,
        price: req.body.price,
        image: req.body.image,
        userId: req.user,
    })

    try {
        await course.save()
        res.redirect('/courses')
    } catch(e) {
        console.error(e)
    }
})

module.exports = router