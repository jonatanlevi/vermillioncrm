const { app, BrowserWindow, dialog } = require("electron");
const { spawn, execSync } = require("child_process");
const http = require("http");
const path = require("path");
const fs = require("fs");
const { loadEnvFile, resolveDataPaths } = require("./env-utils");

const PORT = 3001;
let win;
let nextServer;
let logStream = null;

function resourcesPath() {
  return app.isPackaged
    ? path.join(process.resourcesPath)
    : path.join(__dirname, "..");
}

function standaloneDir() {
  return app.isPackaged
    ? path.join(process.resourcesPath, "standalone")
    : path.join(__dirname, "..", ".next", "standalone");
}

function openLogStream() {
  try {
    const logsDir = path.join(app.getPath("userData"), "logs");
    fs.mkdirSync(logsDir, { recursive: true });
    const logFile = path.join(logsDir, "crm.log");
    logStream = fs.createWriteStream(logFile, { flags: "a" });
    const stamp = new Date().toISOString();
    logStream.write(`\n========== START ${stamp} ==========\n`);
    return logStream;
  } catch {
    return null;
  }
}

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  process.stdout.write(line);
  logStream?.write(line);
}

function killPortWin(port) {
  try {
    const out = execSync(`netstat -ano -p tcp 2>nul`, { encoding: "utf8", timeout: 3000 });
    const re = new RegExp(`TCP\\s+\\S+:${port}\\s+\\S+\\s+LISTENING\\s+(\\d+)`, "gi");
    const pids = new Set();
    let m;
    while ((m = re.exec(out)) !== null) pids.add(m[1]);
    for (const pid of pids) {
      try {
        execSync(`taskkill /pid ${pid} /f /t 2>nul`, { timeout: 3000 });
        log(`[electron] killed stale PID ${pid} on port ${port}`);
      } catch {}
    }
  } catch {}
}

function waitForServer(timeoutMs = 60_000) {
  const deadline = Date.now() + timeoutMs;
  return new Promise((resolve, reject) => {
    // Fail fast if server process dies before becoming ready
    const onExit = (code) => {
      reject(new Error(`שרת CRM קרס בהפעלה (exit ${code}) — בדוק ${path.join(app.getPath("userData"), "logs", "crm.log")}`));
    };
    nextServer.once("exit", onExit);

    const tick = () => {
      const req = http.get(`http://127.0.0.1:${PORT}`, (res) => {
        res.resume();
        nextServer.removeListener("exit", onExit);
        resolve();
      });
      req.on("error", () => {
        if (Date.now() > deadline) {
          nextServer.removeListener("exit", onExit);
          reject(new Error(`שרת CRM לא עלה תוך ${timeoutMs / 1000} שניות — בדוק ${path.join(app.getPath("userData"), "logs", "crm.log")}`));
          return;
        }
        setTimeout(tick, 500);
      });
      req.setTimeout(2000, () => req.destroy());
    };
    tick();
  });
}

function buildChildEnv() {
  const userData = app.getPath("userData");
  const exampleEnv = path.join(resourcesPath(), ".env.example");
  const templateDb = path.join(resourcesPath(), "prisma", "template.db");

  const paths = resolveDataPaths({
    isPackaged: app.isPackaged,
    execPath: process.execPath,
    userDataDir: userData,
    exampleEnv,
    templateDb,
  });

  const fileEnv = loadEnvFile(paths.envPath);
  const dbUrl = `file:${paths.dbPath.replace(/\\/g, "/")}`;

  log(`[electron] DB מקור: ${paths.source} → ${paths.dbPath}`);

  const appUrl = `http://127.0.0.1:${PORT}`;

  return {
    ...process.env,
    ...fileEnv,
    NODE_ENV: app.isPackaged ? "production" : "development",
    PORT: String(PORT),
    HOSTNAME: "127.0.0.1",
    DATABASE_URL: dbUrl,
    AUTH_URL: appUrl,
    NEXTAUTH_URL: appUrl,
    ELECTRON_RUN_AS_NODE: "1",
  };
}

async function startNextServer() {
  // Kill any stale process holding port 3001 (leftover from previous crash/install)
  if (process.platform === "win32") killPortWin(PORT);

  const childEnv = buildChildEnv();

  if (!app.isPackaged) {
    const cwd = path.join(__dirname, "..");
    const cmd = process.platform === "win32" ? "npm.cmd" : "npm";
    nextServer = spawn(cmd, ["run", "dev"], {
      cwd,
      env: { ...childEnv, ELECTRON_RUN_AS_NODE: undefined },
      shell: true,
    });
  } else {
    const serverJs = path.join(standaloneDir(), "server.js");
    if (!fs.existsSync(serverJs)) {
      throw new Error(`לא נמצא server.js ב: ${serverJs}`);
    }
    nextServer = spawn(process.execPath, [serverJs], {
      cwd: standaloneDir(),
      env: childEnv,
      windowsHide: true,
    });
  }

  nextServer.stdout?.on("data", (d) => {
    log(`[crm] ${d.toString().trimEnd()}`);
  });
  nextServer.stderr?.on("data", (d) => {
    log(`[crm:err] ${d.toString().trimEnd()}`);
  });
  nextServer.on("error", (err) => log(`[crm] spawn error: ${err.message}`));

  return waitForServer();
}

function createWindow() {
  const iconPath = path.join(__dirname, "icon.ico");
  win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 680,
    icon: fs.existsSync(iconPath) ? iconPath : undefined,
    title: "VerMillion CRM",
    backgroundColor: "#0a0a0a",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    autoHideMenuBar: true,
  });

  win.webContents.on('console-message', (e, level, msg, line, src) => {
    log(`[renderer:${level}] ${msg} (${src}:${line})`);
  });
  win.webContents.on('render-process-gone', (e, details) => {
    log(`[renderer:GONE] reason=${details.reason} exitCode=${details.exitCode}`);
  });
  win.loadURL(`http://127.0.0.1:${PORT}`);
}

app.whenReady().then(async () => {
  openLogStream();
  log("[electron] app starting");
  try {
    await startNextServer();
    log("[electron] server ready — opening window");
    createWindow();
  } catch (err) {
    log(`[electron] FATAL: ${err.message}`);
    dialog.showErrorBox(
      "VerMillion CRM — שגיאת הפעלה",
      `${err instanceof Error ? err.message : String(err)}\n\nנתונים: ${app.getPath("userData")}`
    );
    app.quit();
  }
});

app.on("window-all-closed", () => {
  if (nextServer && !nextServer.killed) {
    try {
      if (process.platform === "win32") {
        spawn("taskkill", ["/pid", String(nextServer.pid), "/f", "/t"], { shell: true });
      } else {
        nextServer.kill("SIGTERM");
      }
    } catch {
      nextServer.kill();
    }
  }
  logStream?.end();
  app.quit();
});

app.on("before-quit", () => {
  if (nextServer && !nextServer.killed) nextServer.kill();
});
