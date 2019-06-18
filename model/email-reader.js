const fs = require('fs');
const path = require('path');
const simpleParser = require('mailparser').simpleParser;
const SocketClient = require('./socket-client');

class EmailReader {
    constructor(host, port, userId, userPass, callback) {
        this.authenticated = false;
        this.client = new SocketClient(host, port, {
            key: fs.readFileSync(path.resolve(__dirname, '../certs/client-key.pem')),
            cert: fs.readFileSync(path.resolve(__dirname, '../certs/client-cert.pem')),
            requestCert: true
        });

        this.processing = 0;
        this.loading = null;
        this.listeners = {
            'auth': [],
            'progress': []
        };

        this.client
        .write(`USER recent:${userId}`)
        .write(`PASS ${userPass}`)
        .handle((res) => {
            this.authenticated = true;
            callback && callback(res);

            this.listeners['auth'].forEach(cb => cb(res));
        })
        .run();
    }

    on(event, cb) {
        if (event in this.listeners) {
            this.listeners[event].push(cb);
            if (event === 'auth' && this.authenticated) cb();
        }
    }

    getEmails(max, callback) {
        if (this.authenticated) {
            let emails = [];

            this.client
            .write(`STAT`)
            .handle(res => {
                clearInterval(this.loading);
                this.loading = setInterval(() => {
                    this.listeners.progress.forEach(cb => cb(this.processing));
                    if (this.processing >= 100) clearInterval(this.loading);
                }, 100);

                const emailsCount = parseInt(res.split(' ')[1]);
                for (let i = 0; i < max; i++) {
                    this.client
                    .write(`RETR ${emailsCount - i}`)
                    .handle(email => {
                        this.processing = ((i + 0.7) * 100) / max;
                        this.parseEmail(email)
                        .then(parsed => {
                            emails.push(parsed);
                            this.processing = ((i + 1) * 100) / max;
                        });
                    });
                }

                this.client
                .run(() => {
                    callback(emails);
                });
            })
            .run();
        } else {
            throw new Error('User class methods into authenticate callback.')
        }
    }

    parseEmail(sourceEmail) {
        return simpleParser(sourceEmail);
    }
}

module.exports = EmailReader;