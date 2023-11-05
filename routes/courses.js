const {Router} = require('express')
const router = Router()
const Course = require('../models/course')
const auth = require('../middleware/auth')

function isOwner(course, req) {
    if (req.user !== undefined) {
        return course.userId.toString() === req.user._id.toString()
    }

    return false
}

router.get('/', async (req, res) => {
    try {
        const courses = await Course.find().populate('userId', 'name')

        res.render('courses', {
            'title': 'Страница курсов',
            'isCourses': true,
            'userId': req.user ? req.user._id : '',
            'courses': courses
        })
    } catch (e) {
        console.error(e)
    }
})

router.get('/:id/edit', auth, async (req, res) => {
    if (!req.query.allow) {
        return res.redirect('/')
    }

    try {
        const course = await Course.findById(req.params.id)

        if (!isOwner(course, req)) {
            return res.redirect('/courses')
        }

        res.render('course-edit', {
            'title': `Редактировать ${course.title}`,
            'course': course,
            'id': req.params.id,
        })
    } catch (e) {
        console.error(e)
    }
})

router.post('/edit', auth, async (req, res) => {
    try {
        const id = req.body.id
        delete req.body.id

        const course = await Course.findById(id)
        if (!isOwner(course, req)) {
            return res.redirect('/courses')
        }

        Object.assign(course, req.body)
        await course.save()
        return res.redirect('/courses')
    } catch (e) {
        console.error(e)
    }
})

router.post('/remove', auth, async (req, res) => {
    try {
        await Course.deleteOne({
            _id: req.body.id,
            userId: req.user._id
        })
    } catch (e) {
        console.error(e)
    }

    res.redirect('/courses')
})

router.get('/:id', async (req, res) => {
    const course = await Course.findById(req.params.id)
    res.render('course', {
        'layout': 'empty',
        'title': `Курс ${course.title}`,
        'course': course
    })
})

module.exports = router