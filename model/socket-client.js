const tls = require('tls');

class SocketClient {
    constructor(host, port, options) {
        this.authorized = false;

        try {
            this.client = tls.connect(port, host, options);
        } catch (err) {
            process.stdout.write(err);
        }

        this.client.setEncoding('utf8');

        this.client.setMaxListeners(1000);
        this.client.once('data', () => {
            this.authorized = true;
        });
        this.pipeline = [];
    }

    onConnect(callback) {
        this.client.on('connect', callback);
    }

    write(command) {
        this.pipeline.push(command + '\n');
        return this;
    }
    
    handle(handler) {
        this.pipeline.push(handler);
        return this;
    }

    send(command) {
        return new Promise((resolve, reject) => {
            let data = '';
            const dataHandler = () => {
                data = '';
                this.client.on('data', chunk => {
                    let chunkLines = chunk.toString('utf8').split('\r\n');
                    if (chunkLines.length === 2 && /[+-]/.test(chunk[0])) {
                        resolve(chunk);
                    } else {
                        if (chunkLines[chunkLines.length - 2] === '.') {
                            resolve(data)
                        } else {
                            data += chunk;
                        }
                    }
                });
            };

            const flushed = this.client.write(command);
            if (!flushed) {
                this.client.once('drain', dataHandler);
            } else {
                process.nextTick(dataHandler);
            }

            this.client.on('error', reject);
        });
    };

    run(callback=()=>{}) {
        const pipeline = Array.from(this.pipeline);
        this.pipeline = [];

        const loopInPipeline = (i = 0, response = null) => {
            let cmd = pipeline[i];
            if (typeof cmd === 'string') {
                this.send(cmd).then(res => {
                    loopInPipeline(++i, res);
                });
            } else if (typeof cmd === 'function') {
                cmd(response);
                loopInPipeline(++i);
            } else {
                if (i < pipeline.length) loopInPipeline(++i);
                else if (i === pipeline.length) {
                    callback();
                };
            }
        }
        
        if (this.authorized) loopInPipeline();
        else this.client.once('data', () => loopInPipeline());
    }
}

module.exports = SocketClient;
