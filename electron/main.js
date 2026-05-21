const { app, BrowserWindow } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const waitOn = require('wait-on');

const PORT = 3001;
let win;
let nextServer;

function createWindow() {
  win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 680,
    icon: path.join(__dirname, 'icon.ico'),
    title: 'VerMillion CRM',
    backgroundColor: '#0a0a0a',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    autoHideMenuBar: true,
  });

  win.loadURL(`http://localhost:${PORT}`);
}

function startNextServer() {
  const cwd = app.isPackaged
    ? path.join(process.resourcesPath, 'app')
    : path.join(__dirname, '..');

  const cmd   = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const args  = app.isPackaged ? ['run', 'start'] : ['run', 'dev'];

  nextServer = spawn(cmd, args, { cwd, env: { ...process.env, PORT: String(PORT) }, shell: true });

  nextServer.stdout?.on('data', d => process.stdout.write(`[next] ${d}`));
  nextServer.stderr?.on('data', d => process.stderr.write(`[next] ${d}`));

  return waitOn({ resources: [`http://localhost:${PORT}`], timeout: 60_000, interval: 500 });
}

app.whenReady().then(async () => {
  try {
    await startNextServer();
    createWindow();
  } catch (err) {
    console.error('[electron] failed to start Next.js:', err);
    app.quit();
  }
});

app.on('window-all-closed', () => {
  nextServer?.kill();
  app.quit();
});

app.on('before-quit', () => nextServer?.kill());
