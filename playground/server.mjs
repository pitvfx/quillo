// The Quillo playground: a page to try Quillo in, and a guided tour.
//
// node playground/server.mjs        then open http://127.0.0.1:7070/
//
// It runs the code typed in the page with the real `quillo` binary (QUILLO_BIN, else
// target/release/quillo, else `quillo` on the PATH), one program at a time:
//
//   POST /__pg/api/run   { code }  ->  { check, kind, stdout, stderr, exit }
//   GET  /__pg/api/log?from=N      ->  { text, next, running }   the server program's log
//   POST /__pg/api/stop
//
// A program that declares routes keeps running, and every path outside /__pg/ is passed
// on to it (WebSockets too), so the page's preview and the tour's checks reach it on the
// playground's own origin. A program runs in a fresh temporary folder, under a policy
// that allows only the db, time and random effects (no files, network or environment),
// with a time limit; the playground listens on 127.0.0.1 only. It is a tool for your own
// machine: do not put it on the internet.

import http from "node:http";
import net from "node:net";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 7070);
const HOST = process.env.HOST || "127.0.0.1";
const BIN = process.env.QUILLO_BIN || [
  path.join(HERE, "..", "target", "release", "quillo"),
  path.join(HERE, "..", "target", "debug", "quillo"),
].find((p) => fs.existsSync(p)) || "quillo";

const MAX_CODE = 100_000;          // bytes of source accepted
const MAX_OUT = 64 * 1024;         // bytes of output kept per stream
const SCRIPT_TIMEOUT = 6000;       // ms a program that serves nothing may run
const START_TIMEOUT = 8000;        // ms a server program has to start listening
const SERVER_LIFETIME = 15 * 60e3; // ms a server program is kept before it is stopped

const POLICY = `[effects]
allow = ["db", "time", "random"]

[limits]
max_compute = "2s"
max_body = "1MB"
workers = 8
`;

const STATIC = {
  "/__pg/": ["index.html", "text/html; charset=utf-8"],
  "/__pg/index.html": ["index.html", "text/html; charset=utf-8"],
  "/__pg/app.js": ["app.js", "text/javascript; charset=utf-8"],
  "/__pg/tour.js": ["tour.js", "text/javascript; charset=utf-8"],
  "/__pg/examples.js": ["examples.js", "text/javascript; charset=utf-8"],
  "/__pg/style.css": ["style.css", "text/css; charset=utf-8"],
};

// The one program running now, if it serves.
let current = null; // { child, port, dir, log, timer }

function childEnv() {
  // Only what quillo needs: nothing of this shell's secrets reaches the program.
  const env = { PATH: process.env.PATH || "/usr/bin:/bin", HOME: os.tmpdir(), NO_COLOR: "1" };
  for (const k of ["SystemRoot", "TEMP", "TMP", "LANG"]) if (process.env[k]) env[k] = process.env[k];
  return env;
}

function capped(buf, chunk) {
  if (buf.length >= MAX_OUT) return buf;
  const s = buf + chunk.toString("utf8");
  return s.length > MAX_OUT ? s.slice(0, MAX_OUT) + "\n… (output cut at 64 KB)\n" : s;
}

function freePort() {
  return new Promise((resolve, reject) => {
    const s = net.createServer();
    s.unref();
    s.on("error", reject);
    s.listen(0, "127.0.0.1", () => {
      const { port } = s.address();
      s.close(() => resolve(port));
    });
  });
}

function exec(args, cwd, timeout) {
  return new Promise((resolve) => {
    let stdout = "", stderr = "", done = false;
    const child = spawn(BIN, args, { cwd, env: childEnv() });
    const timer = setTimeout(() => {
      if (done) return;
      stderr = capped(stderr, `\nplayground: stopped after ${timeout / 1000} s\n`);
      child.kill("SIGKILL");
    }, timeout);
    child.stdout.on("data", (d) => (stdout = capped(stdout, d)));
    child.stderr.on("data", (d) => (stderr = capped(stderr, d)));
    child.on("error", (e) => {
      done = true;
      clearTimeout(timer);
      resolve({ stdout, stderr: `playground: cannot start ${BIN}: ${e.message}`, exit: -1 });
    });
    child.on("close", (code, signal) => {
      done = true;
      clearTimeout(timer);
      resolve({ stdout, stderr, exit: code ?? (signal ? 137 : -1) });
    });
  });
}

function stopCurrent() {
  if (!current) return;
  const c = current;
  current = null;
  clearTimeout(c.timer);
  try { c.child.kill("SIGKILL"); } catch {}
  setTimeout(() => fs.rm(c.dir, { recursive: true, force: true }, () => {}), 500);
}

async function run(code) {
  stopCurrent();
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "quillo-pg-"));
  fs.writeFileSync(path.join(dir, "main.qwe"), code);
  fs.writeFileSync(path.join(dir, "policy.toml"), POLICY);

  const check = await exec(["check", "main.qwe", "--policy", "policy.toml"], dir, 10000);
  const checkText = (check.stdout + check.stderr).replace(/^quillo: policy .*\n/m, "");
  const result = { check: { ok: check.exit === 0, output: checkText.trim() } };
  if (check.exit !== 0) {
    fs.rm(dir, { recursive: true, force: true }, () => {});
    return { ...result, kind: "error", stdout: "", stderr: "", exit: check.exit };
  }

  const port = await freePort();
  const args = ["run", "main.qwe", "--no-check", "--policy", "policy.toml", "--port", String(port),
    "--host", "127.0.0.1", "--no-prefetch", "--no-wt", "--drain", "1s"];
  return await new Promise((resolve) => {
    let stdout = "", stderr = "", settled = false;
    const child = spawn(BIN, args, { cwd: dir, env: childEnv() });
    const finish = (value) => {
      if (settled) return;
      settled = true;
      clearTimeout(killer);
      resolve({ ...result, ...value });
    };
    const killer = setTimeout(() => {
      // A script that neither ends nor listens: a loop that never stops.
      stderr = capped(stderr, `\nplayground: stopped after ${SCRIPT_TIMEOUT / 1000} s\n`);
      child.kill("SIGKILL");
    }, SCRIPT_TIMEOUT);
    child.stdout.on("data", (d) => {
      stdout = capped(stdout, d);
      if (current?.child === child) current.log = capped(current.log, d);
    });
    child.stderr.on("data", (d) => {
      stderr = capped(stderr, d);
      if (current?.child === child) current.log = capped(current.log, d);
      if (!settled && /listening on http/.test(stderr)) {
        clearTimeout(killer);
        current = {
          child, port, dir, log: stdout + stderr,
          timer: setTimeout(() => current?.child === child && stopCurrent(), SERVER_LIFETIME),
        };
        finish({ kind: "server", stdout, stderr: clean(stderr), exit: null });
      }
    });
    child.on("error", (e) => finish({ kind: "error", stdout, stderr: `playground: cannot start ${BIN}: ${e.message}`, exit: -1 }));
    child.on("close", (code, signal) => {
      if (current?.child === child) {
        current.log = capped(current.log, `\nquillo: the program stopped (${signal || "exit " + code})\n`);
        current.stopped = true;
      }
      if (!settled) {
        fs.rm(dir, { recursive: true, force: true }, () => {});
        finish({ kind: "script", stdout, stderr: clean(stderr), exit: code ?? (signal ? 137 : -1) });
      }
    });
    setTimeout(() => {
      if (!settled) { stderr += `\nplayground: the server did not start in ${START_TIMEOUT / 1000} s\n`; child.kill("SIGKILL"); }
    }, START_TIMEOUT);
  });
}

// The policy banner and the listening line say nothing a learner needs.
function clean(s) {
  return s.replace(/^quillo: policy .*\n/gm, "");
}

function sendJSON(res, status, value) {
  const body = JSON.stringify(value);
  res.writeHead(status, { "content-type": "application/json", "cache-control": "no-store" });
  res.end(body);
}

function readBody(req, limit) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const parts = [];
    req.on("data", (d) => {
      size += d.length;
      if (size > limit) { reject(new Error("too large")); req.destroy(); return; }
      parts.push(d);
    });
    req.on("end", () => resolve(Buffer.concat(parts).toString("utf8")));
    req.on("error", reject);
  });
}

const NOTHING_RUNNING = `<!doctype html><meta charset="utf-8"><title>Not running</title>
<style>body{font:15px system-ui,sans-serif;color:#667;display:grid;place-items:center;height:90vh;margin:0}
@media (prefers-color-scheme:dark){body{background:#16181d;color:#9aa}}</style>
<p>No server program is running. Write a <code>route</code> and press <b>Run</b>.</p>`;

function proxy(req, res) {
  if (!current || current.stopped) {
    res.writeHead(503, { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" });
    res.end(NOTHING_RUNNING);
    return;
  }
  const headers = { ...req.headers, host: `127.0.0.1:${current.port}` };
  const up = http.request({ host: "127.0.0.1", port: current.port, method: req.method, path: req.url, headers }, (r) => {
    res.writeHead(r.statusCode, r.statusMessage, r.headers);
    r.pipe(res);
  });
  up.on("error", (e) => {
    if (!res.headersSent) res.writeHead(502, { "content-type": "text/plain; charset=utf-8" });
    res.end(`playground: the program did not answer (${e.code || e.message})`);
  });
  req.pipe(up);
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://x");
  try {
    if (url.pathname === "/" && (!current || current.stopped) && req.method === "GET"
        && req.headers["sec-fetch-dest"] !== "iframe") {
      res.writeHead(302, { location: "/__pg/" });
      return res.end();
    }
    if (url.pathname === "/__pg" ) { res.writeHead(302, { location: "/__pg/" }); return res.end(); }
    if (!url.pathname.startsWith("/__pg/")) return proxy(req, res);

    if (req.method === "GET" && STATIC[url.pathname]) {
      const [file, type] = STATIC[url.pathname];
      res.writeHead(200, { "content-type": type, "cache-control": "no-cache" });
      return res.end(fs.readFileSync(path.join(HERE, file)));
    }
    if (req.method === "POST" && url.pathname === "/__pg/api/run") {
      const { code } = JSON.parse(await readBody(req, MAX_CODE * 2));
      if (typeof code !== "string" || Buffer.byteLength(code) > MAX_CODE) return sendJSON(res, 400, { error: "code must be text under 100 KB" });
      return sendJSON(res, 200, await run(code));
    }
    if (req.method === "POST" && url.pathname === "/__pg/api/stop") {
      stopCurrent();
      return sendJSON(res, 200, { stopped: true });
    }
    if (req.method === "GET" && url.pathname === "/__pg/api/log") {
      const from = Number(url.searchParams.get("from") || 0);
      const log = current?.log || "";
      return sendJSON(res, 200, { text: log.slice(from), next: log.length, running: !!current && !current.stopped });
    }
    if (req.method === "GET" && url.pathname === "/__pg/api/info") {
      const v = await exec(["version"], os.tmpdir(), 5000);
      return sendJSON(res, 200, { version: (v.stdout || v.stderr).trim(), bin: BIN });
    }
    res.writeHead(404, { "content-type": "text/plain" });
    res.end("not found");
  } catch (e) {
    sendJSON(res, 500, { error: String(e.message || e) });
  }
});

// WebSockets (live data, channels) go to the program as they are.
server.on("upgrade", (req, socket, head) => {
  if (!current || current.stopped || req.url.startsWith("/__pg/")) return socket.destroy();
  const up = net.connect(current.port, "127.0.0.1", () => {
    let lines = `${req.method} ${req.url} HTTP/${req.httpVersion}\r\n`;
    for (let i = 0; i < req.rawHeaders.length; i += 2) {
      const [k, v] = [req.rawHeaders[i], req.rawHeaders[i + 1]];
      lines += `${k}: ${k.toLowerCase() === "host" ? `127.0.0.1:${current.port}` : v}\r\n`;
    }
    up.write(lines + "\r\n");
    if (head?.length) up.write(head);
    up.pipe(socket);
    socket.pipe(up);
  });
  up.on("error", () => socket.destroy());
  socket.on("error", () => up.destroy());
});

for (const sig of ["SIGINT", "SIGTERM"]) process.on(sig, () => { stopCurrent(); process.exit(0); });
process.on("exit", stopCurrent);

server.listen(PORT, HOST, () => {
  console.log(`Quillo playground on http://${HOST}:${PORT}/  (quillo: ${BIN})`);
});
