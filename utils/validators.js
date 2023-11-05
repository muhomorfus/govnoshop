const {body} = require('express-validator')
const User = require('../models/user')

exports.registerValidators = [
    body('email')
        .isEmail()
        .withMessage('Введите корректный email')
        .custom(async (value, {req}) => {
            try {
                const candidate = await User.findOne({email: value})
                if (candidate) {
                    return Promise.reject('Пользователь с таким email уже существует')
                }
            } catch (e) {
                console.error(e)
            }
        })
        .normalizeEmail(),
    body('password', 'Пароль должен быть от 6 до 56 символов')
        .isLength({min: 6, max: 56})
        .trim(),
    body('repeat')
        .custom((value, {req}) => {
            if (value !== req.body.password) {
                throw new Error('Пароли не совпадают')
            } else {
                return true
            }
        })
        .trim(),
    body('name')
        .isLength({min: 3})
        .withMessage('Имя должно быть минимум 3 символа')
        .trim()
]