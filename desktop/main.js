const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { spawn, exec } = require('child_process');
const http = require('http');
const net = require('net');
const fs = require('fs');

let mainWindow = null;
let splashWindow = null;
let backendProcess = null;

const HEALTH_URL = 'http://localhost:8080/actuator/health';

function checkPostgresPort(port = 5432, host = '127.0.0.1') {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(1500);
    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.on('error', () => {
      socket.destroy();
      resolve(false);
    });
    socket.connect(port, host);
  });
}

function startPostgresService() {
  return new Promise((resolve) => {
    console.log('[Electron] Attempting to dynamically start PostgreSQL Windows service...');
    if (process.platform === 'win32') {
      exec('powershell -Command "Start-Service -Name postgresql* -ErrorAction SilentlyContinue"', { windowsHide: true }, (err) => {
        if (err) {
          exec('net start postgresql-x64-17', { windowsHide: true }, () => resolve(true));
        } else {
          resolve(true);
        }
      });
    } else {
      resolve(false);
    }
  });
}

async function ensurePostgresRunning() {
  console.log('[Electron] Checking PostgreSQL availability on port 5432...');
  let isUp = await checkPostgresPort(5432);
  if (!isUp) {
    console.log('[Electron] PostgreSQL port 5432 unreachable. Dynamically starting service...');
    await startPostgresService();
    // Poll up to 10 seconds for PostgreSQL to accept TCP connections
    for (let i = 0; i < 20; i++) {
      await new Promise(r => setTimeout(r, 500));
      isUp = await checkPostgresPort(5432);
      if (isUp) {
        console.log('[Electron] PostgreSQL service dynamically started and ready!');
        break;
      }
    }
  } else {
    console.log('[Electron] PostgreSQL database is actively running.');
  }
}

function checkBackendHealth() {
  return new Promise((resolve) => {
    http.get(HEALTH_URL, (res) => {
      if (res.statusCode === 200) {
        resolve(true);
      } else {
        resolve(false);
      }
    }).on('error', () => {
      resolve(false);
    });
  });
}

// Load desktop/.env (git-ignored) so the Gemini API key and any local overrides
// can be supplied without committing secrets. Tiny hand-parser — no dotenv dependency.
function loadDesktopEnv() {
  const out = {};
  // Search order lets the SAME git-ignored .env work in dev *and* in the
  // packaged app. In dev, __dirname is desktop/. When packaged, __dirname is
  // inside app.asar (read-only, not user-writable), so also look next to the
  // .exe and in the resources/ folder — both are plain folders the user can
  // drop a .env into. First match wins.
  const candidates = [path.join(__dirname, '.env')];
  try {
    if (app.isPackaged) {
      candidates.push(path.join(path.dirname(app.getPath('exe')), '.env'));
      if (process.resourcesPath) {
        candidates.push(path.join(process.resourcesPath, '.env'));
      }
    }
  } catch (_) { /* app not ready — dev candidate still applies */ }

  const envPath = candidates.find((p) => {
    try { return fs.existsSync(p); } catch (_) { return false; }
  });
  if (!envPath) return out;

  try {
    const raw = fs.readFileSync(envPath, 'utf8');
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      if (key) out[key] = value;
    }
    // Log the source path only (never the values) so key loading is debuggable.
    console.log('[Electron] Loaded desktop env from:', envPath);
  } catch (e) {
    console.error('[Electron] Failed to read .env:', e);
  }
  return out;
}

function startBackend() {
  console.log('[Electron] Starting Spring Boot backend process...');

  const isPackaged = app.isPackaged;
  let jarPath = '';

  if (isPackaged) {
    jarPath = path.join(process.resourcesPath, 'reviser.jar');
  } else {
    jarPath = path.join(__dirname, '../target/Reviser-0.0.1-SNAPSHOT.jar');
  }

  // Local secrets (Gemini key, optional model + datasource overrides) come from
  // desktop/.env. Spread it first so an explicit process.env value still wins.
  const fileEnv = loadDesktopEnv();

  const env = {
    ...fileEnv,
    ...process.env,
    SPRING_DATASOURCE_URL: process.env.SPRING_DATASOURCE_URL || fileEnv.SPRING_DATASOURCE_URL || 'jdbc:postgresql://localhost:5432/Reviser',
    SPRING_DATASOURCE_USERNAME: process.env.SPRING_DATASOURCE_USERNAME || fileEnv.SPRING_DATASOURCE_USERNAME || 'postgres',
    SPRING_DATASOURCE_PASSWORD: process.env.SPRING_DATASOURCE_PASSWORD || fileEnv.SPRING_DATASOURCE_PASSWORD || 'postgresql'
  };

  if (env.GEMINI_API_KEY) {
    console.log('[Electron] Gemini API key loaded — AI features enabled.');
  } else {
    console.log('[Electron] No GEMINI_API_KEY in desktop/.env or environment — chat will use the offline fallback.');
  }

  let logFd = 'ignore';
  try {
    const logPath = path.join(app.getPath('userData'), 'backend.log');
    logFd = fs.openSync(logPath, 'a');
  } catch (e) {
    console.error('[Electron] Could not open backend log file:', e);
  }

  if (fs.existsSync(jarPath)) {
    console.log('[Electron] Spawning JAR from:', jarPath);
    const javaCmd = process.platform === 'win32' ? 'javaw' : 'java';
    backendProcess = spawn(javaCmd, ['-XX:TieredStopAtLevel=1', '-jar', jarPath], {
      env,
      stdio: ['ignore', logFd, logFd],
      detached: false,
      windowsHide: true
    });
  } else {
    // Fallback to maven run in dev environment
    console.log('[Electron] JAR not found, falling back to mvnw...');
    const rootDir = path.join(__dirname, '..');
    const isWindows = process.platform === 'win32';
    const cmd = isWindows ? 'mvnw.cmd' : './mvnw';
    backendProcess = spawn(cmd, ['spring-boot:run'], {
      cwd: rootDir,
      shell: true,
      env,
      stdio: ['ignore', logFd, logFd],
      windowsHide: true
    });
  }

  backendProcess.on('error', (err) => {
    console.error('[Electron] Failed to start backend process:', err);
  });
}

function getAppIcon() {
  const icoPath = path.join(__dirname, 'icon.ico');
  const pngPath = path.join(__dirname, 'icon.png');
  if (process.platform === 'win32' && fs.existsSync(icoPath)) {
    return icoPath;
  }
  return fs.existsSync(pngPath) ? pngPath : undefined;
}

function createSplashWindow() {
  const appIcon = getAppIcon();
  splashWindow = new BrowserWindow({
    width: 480,
    height: 420,
    frame: false,
    transparent: true,
    resizable: false,
    center: true,
    alwaysOnTop: true,
    icon: appIcon,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  splashWindow.loadFile(path.join(__dirname, 'splash.html'));
}

function createMainWindow() {
  const appIcon = getAppIcon();
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 840,
    minWidth: 1024,
    minHeight: 700,
    title: 'Reviser — Spaced Repetition Almanac',
    backgroundColor: '#eef1f6',
    show: false,
    icon: appIcon,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      // Keep the renderer fully active even when unfocused. Throttling can leave
      // input hit-testing in a stale state, contributing to dead clicks until a
      // resize wakes the compositor.
      backgroundThrottling: false
    }
  });

  const isPackaged = app.isPackaged;
  const distIndex = path.join(__dirname, '../frontend/dist/index.html');
  const localDist = path.join(__dirname, 'dist-frontend/index.html');

  if (isPackaged) {
    // The bundled jar serves the built SPA at :8080 (same origin as the API),
    // and bootSequence() only calls createMainWindow() after /actuator/health
    // is UP — so load over http rather than file://. This keeps API calls
    // same-origin and matches the Render deployment exactly.
    mainWindow.loadURL('http://localhost:8080');
  } else {
    // In dev mode, check if Vite dev server is running on :5173 for live changes
    http.get('http://localhost:5173', (res) => {
      mainWindow.loadURL('http://localhost:5173');
    }).on('error', () => {
      // Check if Spring Boot backend is serving at :8080
      http.get('http://localhost:8080', (res2) => {
        mainWindow.loadURL('http://localhost:8080');
      }).on('error', () => {
        if (fs.existsSync(distIndex)) {
          mainWindow.loadFile(distIndex);
        } else if (fs.existsSync(localDist)) {
          mainWindow.loadFile(localDist);
        } else {
          mainWindow.loadURL('http://localhost:5173');
        }
      });
    });
  }

  mainWindow.once('ready-to-show', () => {
    if (splashWindow) {
      splashWindow.close();
      splashWindow = null;
    }
    mainWindow.show();
    mainWindow.focus();

    // Windows/Electron sometimes paints the first frame before input
    // hit-testing is attached, so clicks in inputs (chat box, etc.) do nothing
    // until the window is manually resized. Nudge the width by 1px and restore
    // it to force a compositor reflow that re-attaches input handling at launch.
    try {
      const b = mainWindow.getBounds();
      mainWindow.setBounds({ ...b, width: b.width + 1 });
      setTimeout(() => {
        try {
          mainWindow.setBounds(b);
          mainWindow.webContents.focus();
        } catch (_) {}
      }, 80);
    } catch (_) {}
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

ipcMain.on('app-close', () => {
  if (mainWindow) {
    mainWindow.close();
  }
});

async function bootSequence() {
  createSplashWindow();

  // 1. Dynamically verify and launch PostgreSQL database
  await ensurePostgresRunning();

  // 2. Check and start Spring Boot backend
  const alreadyRunning = await checkBackendHealth();
  if (!alreadyRunning) {
    startBackend();
  }

  // Poll health endpoint
  let attempts = 0;
  const maxAttempts = 200; // 40 seconds max (200 * 200ms)
  const pollInterval = setInterval(async () => {
    attempts++;
    const isUp = await checkBackendHealth();

    if (isUp || attempts >= maxAttempts) {
      clearInterval(pollInterval);
      createMainWindow();
    }
  }, 200);
}

app.whenReady().then(() => {
  bootSequence();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

function killBackend() {
  if (backendProcess) {
    console.log('[Electron] Terminating backend process...');
    if (process.platform === 'win32') {
      exec(`taskkill /pid ${backendProcess.pid} /T /F`, { windowsHide: true }, () => { });
    } else {
      backendProcess.kill('SIGTERM');
    }
    backendProcess = null;
  }
}

app.on('window-all-closed', () => {
  killBackend();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  killBackend();
});
