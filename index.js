const { app, BrowserWindow } = require('electron');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;

function createWindow() {
    let win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true
        }
    });

    win.loadFile('./view/pages/index/template.html');
}

app.on('ready', createWindow);

app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
    event.preventDefault();
    callback(true);
});
