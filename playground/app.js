import { STEPS } from "./tour.js";
import { EXAMPLES } from "./examples.js";

const MARK = "@@quillo-tour@@";
const $ = (id) => document.getElementById(id);
const store = {
  get(k, d) { try { const v = localStorage.getItem("qpg." + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem("qpg." + k, JSON.stringify(v)); } catch {} },
};

const state = {
  mode: store.get("mode", "tour"),
  step: 0,
  done: new Set(store.get("done", [])),
  fails: store.get("fails", {}),
  example: store.get("example", 0),
  running: false,
  logFrom: 0,
  logTimer: null,
};

// ───────────────────────── Editor ─────────────────────────

const ta = $("code"), hl = $("highlight"), gutter = $("gutter");
ta.setAttribute("wrap", "off");

const KEYWORDS = new Set(("let fn view route use return if else match for in as reply component while true false null " +
  "with type state service mount server import routes").split(" "));

function escapeHtml(s) {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
}

function highlight(src) {
  const re = /(\/\/[^\n]*)|("(?:\\.|[^"\\\n])*"?|'(?:\\.|[^'\\\n])*'?|`(?:\\.|[^`\\])*`?)|(<\/?[A-Za-z][\w.-]*|\/>|(?<=<[A-Za-z][^<>]*)>)|(\b\d[\d_]*(?:\.\d+)?(?:e[+-]?\d+)?m?\b)|([A-Za-z_][\w]*)(?=\s*\()|([A-Za-z_]\w*)/g;
  let out = "", last = 0, m;
  while ((m = re.exec(src))) {
    out += escapeHtml(src.slice(last, m.index));
    const [tok, com, str, tag, num, call, word] = m;
    if (com) out += `<span class="c">${escapeHtml(tok)}</span>`;
    else if (str) out += `<span class="s">${escapeHtml(tok)}</span>`;
    else if (tag) out += `<span class="t">${escapeHtml(tok)}</span>`;
    else if (num) out += `<span class="n">${tok}</span>`;
    else if (call) out += KEYWORDS.has(call) ? `<span class="k">${call}</span>` : `<span class="f">${call}</span>`;
    else if (word) out += KEYWORDS.has(word) || /^(GET|POST|PUT|PATCH|DELETE|ANY)$/.test(word) ? `<span class="k">${word}</span>` : word;
    last = re.lastIndex;
  }
  return out + escapeHtml(src.slice(last)) + "\n";
}

let errorLines = new Set();
function refreshEditor() {
  hl.innerHTML = highlight(ta.value);
  const n = ta.value.split("\n").length;
  let g = "";
  for (let i = 1; i <= n; i++) g += errorLines.has(i) ? `<span class="err">${i}</span>\n` : `${i}\n`;
  gutter.innerHTML = g;
  ta.style.height = "auto";
  ta.style.width = "auto";
  ta.style.height = ta.scrollHeight + "px";
  ta.style.width = Math.max(ta.scrollWidth, ta.parentElement.clientWidth) + "px";
}

function setCode(code) {
  ta.value = code;
  errorLines = new Set();
  refreshEditor();
}

ta.addEventListener("input", () => {
  errorLines = new Set();
  refreshEditor();
  saveCode();
});

ta.addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") { e.preventDefault(); run(); return; }
  const { selectionStart: s, selectionEnd: end, value: v } = ta;
  if (e.key === "Tab" && !e.ctrlKey && !e.metaKey && !e.altKey) {
    e.preventDefault();
    if (e.shiftKey) {
      const lineStart = v.lastIndexOf("\n", s - 1) + 1;
      const strip = v.slice(lineStart, lineStart + 4).match(/^ {1,4}/)?.[0].length || 0;
      if (strip) { ta.setRangeText("", lineStart, lineStart + strip, "end"); ta.selectionStart = ta.selectionEnd = Math.max(lineStart, s - strip); }
    } else {
      ta.setRangeText("    ", s, end, "end");
    }
    ta.dispatchEvent(new Event("input"));
  } else if (e.key === "Enter" && !e.shiftKey) {
    const lineStart = v.lastIndexOf("\n", s - 1) + 1;
    let indent = v.slice(lineStart).match(/^[ \t]*/)[0];
    const before = v.slice(lineStart, s).trimEnd();
    if (/[{([]$|=>$/.test(before)) indent += "    ";
    e.preventDefault();
    ta.setRangeText("\n" + indent, s, end, "end");
    ta.dispatchEvent(new Event("input"));
  } else if (e.key === "}" && s === end) {
    const lineStart = v.lastIndexOf("\n", s - 1) + 1;
    if (/^ {4,}$/.test(v.slice(lineStart, s))) {
      e.preventDefault();
      ta.setRangeText("}", s - 4, s, "end");
      ta.dispatchEvent(new Event("input"));
    }
  }
});
window.addEventListener("resize", refreshEditor);

function saveCode() {
  if (state.mode === "tour") store.set("code." + STEPS[state.step].id, ta.value);
  else store.set("play.code." + state.example, ta.value);
}

// ───────────────────────── Tabs, modes ─────────────────────────

function showTab(name) {
  for (const b of document.querySelectorAll(".tabs [role=tab]")) b.setAttribute("aria-selected", String(b.dataset.tab === name));
  $("tab-console").hidden = name !== "console";
  $("tab-preview").hidden = name !== "preview";
}
for (const b of document.querySelectorAll(".tabs [role=tab]")) b.onclick = () => showTab(b.dataset.tab);

function setMode(mode) {
  state.mode = mode;
  store.set("mode", mode);
  for (const b of document.querySelectorAll(".modes button")) b.setAttribute("aria-selected", String(b.dataset.mode === mode));
  $("layout").classList.toggle("play", mode === "play");
  $("examples").hidden = mode !== "play";
  $("run-label").textContent = mode === "tour" ? "Run & check" : "Run";
  $("reset").title = mode === "tour" ? "Put back the code this step starts with" : "Put back the example's code";
  if (mode === "tour") loadStep(state.step);
  else loadExample(state.example);
}
for (const b of document.querySelectorAll(".modes button")) b.onclick = () => setMode(b.dataset.mode);

$("examples").innerHTML = EXAMPLES.map((e, i) => `<option value="${i}">${escapeHtml(e.name)}</option>`).join("");
$("examples").onchange = (e) => loadExample(Number(e.target.value));

function loadExample(i) {
  state.example = Math.min(i, EXAMPLES.length - 1);
  store.set("example", state.example);
  $("examples").value = String(state.example);
  setCode(store.get("play.code." + state.example, EXAMPLES[state.example].code));
}

$("reset").onclick = () => {
  if (!confirm("Replace the code in the editor with the starting code?")) return;
  if (state.mode === "tour") setCode(STEPS[state.step].starter);
  else setCode(EXAMPLES[state.example].code);
  saveCode();
};

// ───────────────────────── Tour ─────────────────────────

const firstOpen = () => { const i = STEPS.findIndex((s) => !state.done.has(s.id)); return i < 0 ? STEPS.length - 1 : i; };
const reachable = (i) => i <= firstOpen();

function renderProgress() {
  const n = STEPS.filter((s) => state.done.has(s.id)).length;
  $("progress-text").textContent = `${n} of ${STEPS.length} done`;
  $("meter-fill").style.width = `${(100 * n) / STEPS.length}%`;
  let html = "", level = "";
  STEPS.forEach((s, i) => {
    if (s.level !== level) { if (level) html += "</optgroup>"; level = s.level; html += `<optgroup label="${s.level}">`; }
    const mark = state.done.has(s.id) ? "✓" : reachable(i) ? "→" : "🔒";
    html += `<option value="${i}" ${reachable(i) ? "" : "disabled"}>${mark} ${i + 1}. ${escapeHtml(s.title)}</option>`;
  });
  $("step-select").innerHTML = html + "</optgroup>";
  $("step-select").value = String(state.step);
}
$("step-select").onchange = (e) => loadStep(Number(e.target.value));

function loadStep(i) {
  i = Math.max(0, Math.min(i, STEPS.length - 1));
  if (!reachable(i)) i = firstOpen();
  state.step = i;
  store.set("step", i);
  const s = STEPS[i];
  $("step-level").textContent = `Step ${i + 1} · ${s.level}`;
  $("step-title").textContent = s.title;
  $("step-lesson").innerHTML = s.lesson;
  $("step-task").innerHTML = s.task;
  $("step-hint").innerHTML = s.hint;
  $("hint").open = false;
  $("step-answer").textContent = s.solution;
  updateAnswer();
  $("checks-box").hidden = true;
  $("checks").innerHTML = "";
  $("success").hidden = !state.done.has(s.id);
  $("success-text").textContent = state.done.has(s.id) ? "You finished this step before. Run it again any time." : "";
  $("next").textContent = i === STEPS.length - 1 ? "Open the playground →" : "Next step →";
  setCode(store.get("code." + s.id, s.starter));
  renderProgress();
  $("lesson").scrollTop = 0;
  setStatus("");
}

function updateAnswer() {
  const s = STEPS[state.step];
  $("answer").hidden = (state.fails[s.id] || 0) < 3 && !state.done.has(s.id);
}

$("next").onclick = () => {
  if (state.step === STEPS.length - 1) setMode("play");
  else loadStep(state.step + 1);
};

// ───────────────────────── Running ─────────────────────────

function setStatus(text, cls = "") {
  $("status").textContent = text;
  $("status").className = "status " + cls;
}

function lineOf(code) { return code.split("\n").length; }

function renderConsole(result, userLines, out, hiddenOut) {
  const c = $("console");
  let html = "";
  const diag = result.check?.output || "";
  const lines = diag.split("\n").filter((l) => l && !/: ok \(/.test(l));
  errorLines = new Set();
  if (lines.length) {
    html += `<h3>Checker</h3><pre>`;
    for (const l of lines) {
      const m = l.match(/^main\.qwe:(\d+):\s*(error|warning)?/);
      let cls = /error/.test(l) ? "err" : /warning/.test(l) ? "warn" : "";
      let text = l;
      if (m) {
        const n = Number(m[1]);
        if (n > userLines) text = `(the tour's test code) ${l.replace(/^main\.qwe:\d+:\s*/, "")}  ← the checks call something your code does not define yet, or with another shape`;
        else if (cls === "err") errorLines.add(n);
      }
      html += `<span class="${cls}">${escapeHtml(text)}</span>\n`;
    }
    html += `</pre>`;
  } else if (result.check?.ok) {
    html += `<h3>Checker</h3><pre class="ok">✓ ${escapeHtml(diag || "ok")}</pre>`;
  }
  if (result.kind !== "error") {
    html += `<h3>Output</h3>`;
    html += out.length ? `<pre>${escapeHtml(out.join("\n"))}</pre>` : `<pre class="log">(nothing printed)</pre>`;
    const err = (result.stderr || "").replace(/^quillo: \d+ routes? listening on .*\n?/m, "").trim();
    if (err) html += `<h3>Errors</h3><pre class="err">${escapeHtml(err)}</pre>`;
    if (result.kind === "script" && result.exit && !err) html += `<pre class="err">exit code ${result.exit}</pre>`;
    if (result.kind === "server") html += `<h3>Server</h3><pre class="ok">Serving. Open the Preview tab.</pre><pre class="log" id="server-log"></pre>`;
  }
  c.innerHTML = html;
  refreshEditor();
}

async function pollLog() {
  clearTimeout(state.logTimer);
  try {
    const r = await (await fetch(`/__pg/api/log?from=${state.logFrom}`, { cache: "no-store" })).json();
    state.logFrom = r.next;
    const el = $("server-log");
    if (el && r.text) {
      el.textContent += r.text.split("\n").filter((l) => l && !/^quillo: (policy|\d+ routes)/.test(l)).map((l) => l + "\n").join("");
      const c = $("console");
      c.scrollTop = c.scrollHeight;
    }
    $("stop").hidden = !r.running;
    if (r.running) state.logTimer = setTimeout(pollLog, 1000);
  } catch { $("stop").hidden = true; }
}

$("stop").onclick = async () => {
  await fetch("/__pg/api/stop", { method: "POST" });
  $("stop").hidden = true;
  $("frame").src = "about:blank";
};

async function run() {
  if (state.running) return;
  state.running = true;
  $("run").disabled = true;
  setStatus("running…", "busy");
  clearTimeout(state.logTimer);
  const tour = state.mode === "tour";
  const step = STEPS[state.step];
  const userCode = ta.value;
  const userLines = lineOf(userCode);
  const code = tour && step.hidden ? `${userCode}\nprint("${MARK}")\n${step.hidden}\n` : userCode;
  let result;
  try {
    const r = await fetch("/__pg/api/run", { method: "POST", body: JSON.stringify({ code }) });
    result = await r.json();
    if (result.error) throw new Error(result.error);
  } catch (e) {
    $("console").innerHTML = `<pre class="err">The playground server did not answer: ${escapeHtml(e.message)}</pre>`;
    setStatus("no server", "bad");
    state.running = false;
    $("run").disabled = false;
    return;
  }
  const all = (result.stdout || "").replace(/\n$/, "").split("\n");
  const cut = all.indexOf(MARK);
  const out = (cut >= 0 ? all.slice(0, cut) : all).filter((l, i, a) => !(a.length === 1 && l === ""));
  const hiddenOut = cut >= 0 ? all.slice(cut + 1) : [];
  renderConsole(result, userLines, out, hiddenOut);
  state.logFrom = 0;
  if (result.kind === "server") {
    $("origin").textContent = location.origin;
    const path = tour ? step.preview || "/" : $("url").value || "/";
    if (tour || !$("tab-preview").hidden || state.mode === "play") loadPreview(path);
    if (state.mode === "play") showTab("preview");
    pollLog();
  } else {
    $("stop").hidden = true;
    $("frame").src = "about:blank";
    showTab("console");
  }
  setStatus(result.kind === "error" ? "checker found errors" : result.kind === "server" ? "serving" : result.exit ? `exit ${result.exit}` : "done",
    result.kind === "error" || result.exit ? "bad" : "ok");

  if (tour) await runChecks(step, result, userCode, out, hiddenOut);
  state.running = false;
  $("run").disabled = false;
}
$("run").onclick = run;

function loadPreview(path) {
  $("url").value = path;
  $("frame").src = path;
}
$("urlbar").onsubmit = (e) => {
  e.preventDefault();
  let p = $("url").value.trim() || "/";
  if (!p.startsWith("/")) p = "/" + p;
  loadPreview(p);
};
$("frame").addEventListener("load", () => {
  try {
    const l = $("frame").contentWindow.location;
    if (l.href !== "about:blank" && !l.pathname.startsWith("/__pg")) {
      const q = new URLSearchParams(l.search);
      q.delete("_t");
      $("url").value = l.pathname + (q.size ? "?" + q : "");
    }
  } catch {}
});

// ───────────────────────── Checks ─────────────────────────

class CheckFail extends Error {}

function show(v) {
  if (typeof v === "string") return JSON.stringify(v);
  try { return JSON.stringify(v); } catch { return String(v); }
}

function stripComments(code) {
  return code.split("\n").map((l) => l.replace(/(^|\s)\/\/.*$/, "")).join("\n");
}

function makeTester(result, code, out, hidden) {
  const t = {
    result, code, out, hidden, lastFrame: null,
    expect(cond, msg) { if (!cond) throw new CheckFail(msg); },
    eq(actual, expected, msg) {
      if (actual !== expected) {
        const got = actual === undefined ? "nothing" : show(actual);
        throw new CheckFail((msg ? msg + "\n" : "") + `expected ${show(expected)}, got ${got}`);
      }
    },
    deepEq(actual, expected, msg) {
      if (JSON.stringify(actual) !== JSON.stringify(expected))
        throw new CheckFail((msg ? msg + "\n" : "") + `expected ${show(expected)}, got ${show(actual)}`);
    },
    uses(re, msg) { if (!re.test(stripComments(code))) throw new CheckFail(msg); },
    serving() {
      if (result.kind === "error") throw new CheckFail("The checker found errors: read them in the Console.");
      if (result.kind !== "server") throw new CheckFail("The program did not start a server: declare at least one route.");
    },
    async request(path, init = {}) {
      const r = await fetch(path, { cache: "no-store", redirect: "manual", ...init });
      const text = await r.text();
      return { status: r.status, type: r.headers.get("content-type") || "", text,
        json: async () => { try { return JSON.parse(text); } catch { throw new CheckFail(`${path} did not answer JSON: ${text.slice(0, 120)}`); } } };
    },
    get(path) { return t.request(path); },
    post(path, body) {
      return t.request(path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    },
    async html(path) {
      const r = await t.get(path);
      if (r.status !== 200) throw new CheckFail(`GET ${path} answered ${r.status}: ${r.text.slice(0, 160)}`);
      return new DOMParser().parseFromString(r.text, "text/html");
    },
    async frame(path) {
      showTab("preview");
      const f = $("frame");
      await new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new CheckFail(`The page ${path} did not load.`)), 8000);
        f.addEventListener("load", () => { clearTimeout(timer); resolve(); }, { once: true });
        $("url").value = path;
        f.src = path + (path.includes("?") ? "&" : "?") + "_t=" + Date.now();
      });
      t.lastFrame = frameHelpers(f.contentDocument, f.contentWindow);
      return t.lastFrame;
    },
  };
  return t;
}

function frameHelpers(doc, win) {
  const need = (sel) => {
    const el = doc.querySelector(sel);
    if (!el) throw new CheckFail(`No element matches ${sel} on the page.`);
    return el;
  };
  const wait = async (fn, describe, ms = 5000) => {
    const end = Date.now() + ms;
    let last;
    while (Date.now() < end) {
      last = fn();
      if (last === true) return;
      await new Promise((r) => setTimeout(r, 60));
    }
    throw new CheckFail(describe(last));
  };
  return {
    doc,
    click(sel) { need(sel).click(); },
    type(sel, text) {
      const el = need(sel);
      el.focus();
      el.value = text;
      el.dispatchEvent(new win.InputEvent("input", { bubbles: true, data: text, inputType: "insertText" }));
      el.dispatchEvent(new win.Event("change", { bubbles: true }));
    },
    submit(sel) {
      const form = need(sel);
      if (form.requestSubmit) form.requestSubmit(); else form.dispatchEvent(new win.Event("submit", { bubbles: true, cancelable: true }));
    },
    text(sel) { return need(sel).textContent.trim(); },
    waitText(sel, expected) {
      return wait(() => { const el = doc.querySelector(sel); return el && el.textContent.trim() === expected ? true : el ? el.textContent.trim() : null; },
        (got) => got == null ? `No element matches ${sel} on the page.` : `${sel} should show ${show(expected)}, it shows ${show(got)}.`);
    },
    waitValue(sel, expected) {
      return wait(() => { const el = doc.querySelector(sel); return el && el.value === expected ? true : el ? el.value : null; },
        (got) => got == null ? `No element matches ${sel} on the page.` : `${sel} should hold ${show(expected)}, it holds ${show(got)}.`);
    },
  };
}

async function runChecks(step, result, code, out, hiddenOut) {
  const box = $("checks"), items = [];
  $("checks-box").hidden = false;
  $("success").hidden = true;
  box.innerHTML = "";
  for (const c of step.checks) {
    const li = document.createElement("li");
    li.className = "skip";
    li.innerHTML = `<span>${escapeHtml(c.name)}</span>`;
    box.append(li);
    items.push(li);
  }
  const t = makeTester(result, code, out, hiddenOut);
  let passed = true;
  if (result.kind === "error" && !step.checks.some((c) => c.name.startsWith("The checker"))) {
    passed = false;
    items[0].className = "fail";
    items[0].insertAdjacentHTML("beforeend", `<span class="why">The checker found errors, so the program did not run. Read them in the Console.</span>`);
  } else {
    for (let i = 0; i < step.checks.length; i++) {
      items[i].className = "running";
      try {
        await step.checks[i].fn(t);
        items[i].className = "pass";
      } catch (e) {
        passed = false;
        items[i].className = "fail";
        const msg = e instanceof CheckFail ? e.message : `The check itself failed: ${e.message}`;
        items[i].insertAdjacentHTML("beforeend", `<span class="why">${escapeHtml(msg)}</span>`);
        break;
      }
    }
  }
  if (passed) {
    state.done.add(step.id);
    store.set("done", [...state.done]);
    $("success").hidden = false;
    const next = STEPS[state.step + 1];
    $("success-text").textContent = next ? `Next: ${next.title}.` : "That was the last step: you have toured Quillo. The playground is yours.";
    setStatus("all checks pass", "ok");
    renderProgress();
    $("success").scrollIntoView({ behavior: "smooth", block: "nearest" });
  } else {
    state.fails[step.id] = (state.fails[step.id] || 0) + 1;
    store.set("fails", state.fails);
    updateAnswer();
    setStatus("not yet", "bad");
  }
}

// ───────────────────────── Start ─────────────────────────

state.step = Math.min(store.get("step", 0), STEPS.length - 1);
$("origin").textContent = location.origin;
setMode(state.mode);
