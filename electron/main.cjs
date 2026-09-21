const { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage } = require("electron");
const path = require("node:path");
const fs = require("node:fs");
const http = require("node:http");
const https = require("node:https");
const os = require("node:os");

let mainWindow = null;
let tray = null;
let serverInstance = null;

// Local PC AppData Directory (Zero DB setup)
const userDataPath = app.getPath("userData");
const storageDir = path.join(userDataPath, "FastNetStorage");
if (!fs.existsSync(storageDir)) {
  fs.mkdirSync(storageDir, { recursive: true });
}

// Hardware ID Generator
function getMachineHwid() {
  const cpus = os.cpus();
  const raw = [
    os.platform(),
    os.arch(),
    os.hostname(),
    cpus.length > 0 ? cpus[0].model : "FastNetHost",
  ].join("::");
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    hash = (hash << 5) - hash + raw.charCodeAt(i);
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).toUpperCase().padStart(12, "0");
  return `FN-${hex.slice(0, 4)}-${hex.slice(4, 8)}-${hex.slice(8, 12)}`;
}

// Embedded HTTP Server for LAN Customer Access
function startEmbeddedServer(port = 8080) {
  if (serverInstance) {
    return { ok: true, message: "Server already running" };
  }

  const distPath = path.join(__dirname, "..", "dist");

  serverInstance = http.createServer(async (req, res) => {
    // MikroTik Proxy Endpoint
    if (req.url && req.url.startsWith("/api/mikrotik")) {
      try {
        const urlObj = new URL(req.url, `http://localhost:${port}`);
        const target = urlObj.searchParams.get("target");
        const pathSuffix = urlObj.searchParams.get("path") || "";
        if (!target) {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: "Missing target" }));
          return;
        }
        const fullUrl = new URL(pathSuffix ? `${target}/${pathSuffix}` : target);
        const isHttps = fullUrl.protocol === "https:";
        const client = isHttps ? https : http;

        const chunks = [];
        for await (const chunk of req) chunks.push(chunk);
        const bodyBuf = Buffer.concat(chunks);

        const headers = { ...req.headers };
        delete headers.host;
        headers.host = fullUrl.host;

        const proxyReq = client.request(
          fullUrl,
          {
            method: req.method,
            headers,
            rejectUnauthorized: false,
          },
          (proxyRes) => {
            res.writeHead(proxyRes.statusCode || 200, proxyRes.headers);
            proxyRes.pipe(res);
          }
        );

        proxyReq.on("error", (err) => {
          res.statusCode = 502;
          res.end(JSON.stringify({ error: `Proxy error: ${err.message}` }));
        });

        if (bodyBuf.length > 0) proxyReq.write(bodyBuf);
        proxyReq.end();
        return;
      } catch (e) {
        res.statusCode = 500;
        res.end(JSON.stringify({ error: e.message }));
        return;
      }
    }

    // Static Asset Serving from dist
    let reqPath = (req.url || "/").split("?")[0];
    if (reqPath === "/") reqPath = "/index.html";
    let filePath = path.join(distPath, reqPath);

    if (!fs.existsSync(filePath)) {
      filePath = path.join(distPath, "index.html");
    }

    const ext = path.extname(filePath);
    const mimeTypes = {
      ".html": "text/html",
      ".js": "application/javascript",
      ".css": "text/css",
      ".json": "application/json",
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".svg": "image/svg+xml",
    };

    const contentType = mimeTypes[ext] || "application/octet-stream";

    fs.readFile(filePath, (err, content) => {
      if (err) {
        res.statusCode = 404;
        res.end("Not Found");
        return;
      }
      res.writeHead(200, { "Content-Type": contentType });
      res.end(content);
    });
  });

  return new Promise((resolve) => {
    serverInstance.listen(port, "0.0.0.0", () => {
      resolve({ ok: true, port });
    });
    serverInstance.on("error", (err) => {
      resolve({ ok: false, message: err.message });
    });
  });
}

function stopEmbeddedServer() {
  if (serverInstance) {
    serverInstance.close();
    serverInstance = null;
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 840,
    minWidth: 960,
    minHeight: 640,
    title: "Wazobia FastNet - Desktop Host & Server",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  const isDev = process.env.NODE_ENV === "development";
  if (isDev) {
    mainWindow.loadURL("http://localhost:8443");
  } else {
    mainWindow.loadFile(path.join(__dirname, "..", "dist", "index.html"));
  }

  mainWindow.on("close", (e) => {
    // Minimize to tray instead of quitting if server is running
    if (serverInstance && !app.isQuitting) {
      e.preventDefault();
      mainWindow.hide();
    }
  });
}

// IPC Handlers
ipcMain.handle("get-hwid", () => getMachineHwid());
ipcMain.handle("start-server", async (event, config) => {
  const port = config?.port || 8080;
  return await startEmbeddedServer(port);
});
ipcMain.handle("stop-server", () => {
  stopEmbeddedServer();
  return { ok: true };
});

ipcMain.handle("read-storage", (event, key) => {
  const file = path.join(storageDir, `${key}.json`);
  if (!fs.existsSync(file)) return null;
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return null;
  }
});

ipcMain.handle("write-storage", (event, key, data) => {
  const file = path.join(storageDir, `${key}.json`);
  const tmpFile = `${file}.tmp`;
  fs.writeFileSync(tmpFile, JSON.stringify(data, null, 2), "utf8");
  fs.renameSync(tmpFile, file);
  return { ok: true };
});

app.whenReady().then(() => {
  createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    stopEmbeddedServer();
    app.quit();
  }
});
