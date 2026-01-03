const { app, BrowserWindow } = require("electron");
const path = require("path");
const { spawn } = require("child_process");

let apiProcess;

function createWindow() {
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
    });

    win.loadURL("http://localhost:5173");
}

app.whenReady().then(() => {
    // Hono API 起動
    apiProcess = spawn("node", [
        path.join(__dirname, "../api/dist/node.js"),
    ]);

    createWindow();
});

app.on("window-all-closed", () => {
    if (apiProcess) apiProcess.kill();
    app.quit();
});