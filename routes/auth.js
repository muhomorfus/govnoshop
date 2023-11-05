const {Router} = require('express')
const User = require('../models/user')
const router = Router()
const bcrypt = require('bcryptjs')
const mail = require('../mail')
const config = require('../config')
const fs = require('fs')
const Handlebars = require('handlebars')
const path = require('path')
const token = require('../token')
const {validationResult} = require('express-validator')
const {registerValidators} = require('../utils/validators')

mail.makeTransporter()
config.load()

router.post('/login', async (req, res) => {
    try {
        const {email, password} = req.body

        const candidate = await User.findOne({email: email})
        if (candidate) {
            const areSame = await bcrypt.compare(password, candidate.password)
            if (areSame) {
                if (candidate.confirmed) {
                    req.session.user = candidate
                    req.session.isAuthenticated = true

                    req.session.save(err => {
                        if (err) {
                            throw err
                        } else {
                            return res.redirect('/')
                        }
                    })
                } else {
                    req.flash('error', 'Email не подтвержден')
                    return res.redirect('/auth/login')
                }
            } else {
                req.flash('error', 'Неправильный email или пароль')
                return res.redirect('/auth/login')
            }
        } else {
            req.flash('error', 'Такого пользователя не существует')
            return res.redirect('/auth/login')
        }
    } catch (e) {
        console.error(e)
    }
})

router.post('/register', registerValidators, async (req, res) => {
    try {
        const {name, email, password} = req.body

        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            req.flash('error', errors.array()[0].msg)
            return res.status(422).redirect('/auth/register')
        }

        const hashedPassword = await bcrypt.hash(password, 10)

        const confirmToken = await token()
        const user = new User({
            email,
            name,
            password: hashedPassword,
            cart: {items: []},
            confirmToken,
        })

        await user.save()

        const fileBuf = fs.readFileSync(path.join(__dirname, '..', 'mail', 'templates', 'registration.hbs'))
        const template = fileBuf.toString()

        const message = Handlebars.compile(template)({
            name,
            email,
            url: config.BASE_URL,
            token: confirmToken,
        })

        mail.send({
            email: email,
            subject: 'Подтверждение регистрации',
            message,
        })
        req.flash('info', 'Для завершения регистрации подтвердите email')
        return res.redirect('/auth/login')
    } catch (e) {
        console.error(e)
    }
})

router.get('/', async (req, res) => {
    res.redirect('/auth/login')
})

router.get('/login', async (req, res) => {
    res.render('auth/login', {
        title: 'Авторизация',
        layout: 'auth',
        error: req.flash('error'),
        info: req.flash('info'),
        success: req.flash('success'),
    })
})

router.get('/register', async (req, res) => {
    res.render('auth/register', {
        title: 'Регистрация',
        layout: 'auth',
        error: req.flash('error')
    })
})

router.get('/logout', async (req, res) => {
    req.session.destroy(() => {
        res.redirect('/auth/login')
    })
})

router.get('/confirm/:token', async (req, res) => {
    const token = req.params.token

    const candidate = await User.findOneAndUpdate({confirmToken: token}, {confirmed: true})

    if (candidate) {
        req.flash('success', 'Теперь вы можете войти в свой аккаунт')
        return res.redirect('/auth/login')
    } else {
        req.flash('error', 'Не удалось подствердить аккаунт')
        return res.redirect('/auth/login')
    }
})

router.get('/recover', (req, res) => {
    res.render('auth/recover', {
        title: 'Восстановление пароля',
        layout: 'auth',
        error: req.flash('error'),
    })
})

router.post('/recover', async (req, res) => {
    try {
        const {email} = req.body

        const resetToken = await token()
        const resetTokenCorrect = true
        const resetTokenExpiration = Date.now() + 60 * 60 * 1000

        const candidate = await User.findOneAndUpdate({email}, {
            resetToken,
            resetTokenCorrect,
            resetTokenExpiration,
        })

        if (candidate) {
            const fileBuf = fs.readFileSync(path.join(__dirname, '..', 'mail', 'templates', 'recover.hbs'))
            const template = fileBuf.toString()

            const message = Handlebars.compile(template)({
                name: candidate.name,
                email,
                url: config.BASE_URL,
                token: resetToken,
            })

            mail.send({
                email,
                subject: 'Восстановление пароля',
                message,
            })

            req.flash('info', `На ${email} была отправлена ссылка для восстановления пароля`)
            return res.redirect('/auth/login')
        } else {
            req.flash('error', 'Пользователя с данным email не существует')
            return res.redirect('/auth/recover')
        }
    } catch (e) {

    }
})

router.get('/reset/:token', async (req, res) => {
    const token = req.params.token
    const candidate = await User.findOne({resetToken: token})

    if (!candidate) {
        req.flash('error', 'Пользователь не найден')
        return res.redirect('/auth/recover')
    }

    if (candidate.resetTokenExpiration < Date.now() || !candidate.resetTokenCorrect) {
        req.flash('error', 'Токен недействителен')
        return res.redirect('/auth/recover')
    }
    res.render('auth/newpassword', {
        title: 'Изменение пароля',
        layout: 'auth',
        token: token,
        error: req.flash('error'),
    })
})

router.post('/reset', async (req, res) => {
    const {newPassword, repeatPassword, token} = req.body
    const candidate = await User.findOne({resetToken: token})

    if (candidate) {
        if (candidate.resetTokenExpiration >= Date.now() && candidate.resetTokenCorrect) {
            if (newPassword === repeatPassword) {
                candidate.password = await bcrypt.hash(newPassword, 10)
                candidate.resetTokenCorrect = false
                candidate.save()

                req.flash('success', 'Пароль успешно изменен')
                return res.redirect('/auth/login')
            } else {
                req.flash('error', 'Пароли не совпадают')
                return res.redirect(`/auth/reset/${token}`)
            }
        } else {
            req.flash('error', 'Токен недействителен')
            return res.redirect('/auth/recover')
        }
    } else {
        req.flash('error', 'Неверный токен')
        return res.redirect('/auth/recover')
    }
})

module.exports = router