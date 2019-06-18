const EmailReader = require('../model/email-reader');

module.exports = (host, port, user, pwd) => {
    let emailReader = new EmailReader(host, port, user, pwd);
    return new Promise((resolve, reject) => {
        emailReader.on('auth', () => {
            resolve(emailReader);
        });
    });
};