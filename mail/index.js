const nodemailer = require('nodemailer')
const config = require('../config')

module.exports = {
    makeTransporter: () => {
        config.load()

        this._transport = nodemailer.createTransport({
            host: config.MAIL_HOST,
            secure: config.MAIL_SECURE,
            port: config.MAIL_PORT,
            auth: {user: config.MAIL_ADDRESS, pass: config.MAIL_PASSWORD},
            tls: {rejectUnauthorized: false}
        })
    },
    send: (cfg) => {
        const {email, subject, message, plain} = cfg
        const from = `${config.MAIL_NAME} <${config.MAIL_ADDRESS}>`
        this._transport.sendMail({
            from: from,
            to: email,
            subject: subject,
            text: plain,
            html: message
        }, function (err, info) {
            if (err) {
                console.error(err)
            }
        })
    },
}