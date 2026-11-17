// The guided tour: one feature a step, easiest first.
//
// Each step has a lesson, a task, the code the editor starts with, a hint, an answer
// (shown only after a few tries), optional `hidden` code the checks add after the
// learner's code (its output is kept apart), and checks. A check is an async function
// given `t` (see app.js, `makeTester`); it throws a message when the work is not done.

const H = String.raw;

export const LEVELS = ["Basics", "Data", "Server", "Components"];

export const STEPS = [
  // ───────────────────────────── Basics ─────────────────────────────
  {
    id: "hello",
    level: "Basics",
    title: "Say hello",
    lesson: H`
      <p>A Quillo program runs from top to bottom. <code>print</code> writes a value to
      the console, followed by a line break.</p>
      <pre>print("Hi there")</pre>
      <p>Strings use double or single quotes. There are no semicolons: a line break ends
      a statement.</p>`,
    task: H`<ol><li>Print exactly <code>Hello, Quillo!</code></li>
      <li>Press <b>Run &amp; check</b> (or <kbd>Ctrl</kbd>+<kbd>Enter</kbd>).</li></ol>`,
    starter: `// Step 1: print a greeting.\n// Type your code below, then press "Run & check".\n\n`,
    hint: `Call <code>print</code> with the text in quotes: <code>print("…")</code>.`,
    solution: `print("Hello, Quillo!")`,
    checks: [
      { name: "The program prints something", fn: (t) => t.expect(t.out.length > 0, "Nothing was printed. Use print(...).") },
      { name: "The first line is “Hello, Quillo!”", fn: (t) => t.eq(t.out[0], "Hello, Quillo!") },
    ],
  },
  {
    id: "variables",
    level: "Basics",
    title: "Variables and template strings",
    lesson: H`
      <p><code>let</code> gives a value a name. Values do not change, but a variable can
      be given a new value with <code>=</code>.</p>
      <p>Back-tick strings are <em>template strings</em>: <code>\${…}</code> puts a value
      inside the text.</p>
      <pre>let city = "Lisbon"
print(\`I live in \${city}\`)   // I live in Lisbon</pre>`,
    task: H`<ol><li>Declare <code>name</code> with the value <code>"Ada"</code>.</li>
      <li>Declare <code>lang</code> with the value <code>"Quillo"</code>.</li>
      <li>With one template string, print <code>Hello, Ada! Welcome to Quillo.</code></li></ol>`,
    starter: `// Step 2: variables and template strings.\n\n`,
    hint: `Two <code>let</code> lines, then <code>print(\`Hello, \${name}! …\`)</code> with back-ticks, not quotes.`,
    solution: "let name = \"Ada\"\nlet lang = \"Quillo\"\nprint(`Hello, ${name}! Welcome to ${lang}.`)",
    hidden: `print(name)\nprint(lang)`,
    checks: [
      { name: "`name` is \"Ada\"", fn: (t) => t.eq(t.hidden[0], "Ada", "`name` should be \"Ada\".") },
      { name: "`lang` is \"Quillo\"", fn: (t) => t.eq(t.hidden[1], "Quillo", "`lang` should be \"Quillo\".") },
      { name: "A template string is used", fn: (t) => t.uses(/`[^`]*\$\{/, "Use a back-tick string with ${name} and ${lang} inside.") },
      { name: "It prints the welcome", fn: (t) => t.eq(t.out[0], "Hello, Ada! Welcome to Quillo.") },
    ],
  },
  {
    id: "functions",
    level: "Basics",
    title: "Functions",
    lesson: H`
      <p>A one-line function is <code>fn name(params) = expression</code>. Parameters and
      the result can have types, which Quillo checks before the program runs.</p>
      <pre>fn add(a: int, b: int) -> int = a + b
fn shout(s: str) -> str = upper(s) + "!"

print(add(2, 3))        // 5
print(shout("hey"))     // HEY!</pre>
      <p>A longer body goes in braces; its last expression is the result, so you rarely
      need <code>return</code>.</p>`,
    task: H`<ol><li>Write <code>square(n: int) -> int</code> that gives <code>n * n</code>.</li>
      <li>Write <code>greet(name: str) -> str</code> that gives <code>Hello, &lt;name&gt;!</code>
      (so <code>greet("Lin")</code> is <code>"Hello, Lin!"</code>).</li></ol>
      <p class="note">The check calls your functions with its own values.</p>`,
    starter: `// Step 3: functions.\n\n`,
    hint: "<code>fn square(n: int) -> int = n * n</code>, and a template string for <code>greet</code>.",
    solution: "fn square(n: int) -> int = n * n\nfn greet(name: str) -> str = `Hello, ${name}!`",
    hidden: `print(square(7))\nprint(square(-3))\nprint(greet("Lin"))\nprint(greet("Grace"))`,
    checks: [
      { name: "square(7) is 49", fn: (t) => t.eq(t.hidden[0], "49") },
      { name: "square(-3) is 9", fn: (t) => t.eq(t.hidden[1], "9") },
      { name: "greet(\"Lin\") is \"Hello, Lin!\"", fn: (t) => t.eq(t.hidden[2], "Hello, Lin!") },
      { name: "greet(\"Grace\") is \"Hello, Grace!\"", fn: (t) => t.eq(t.hidden[3], "Hello, Grace!") },
    ],
  },
  {
    id: "pipelines",
    level: "Basics",
    title: "Lists and pipelines",
    lesson: H`
      <p>Lists are written <code>[1, 2, 3]</code>. Functions such as <code>filter</code>,
      <code>map</code> and <code>sum</code> take the list first, and the pipe
      <code>|</code> passes a value into the next call: <code>a | f(b)</code> is
      <code>f(a, b)</code>.</p>
      <pre>[1, 2, 3, 4]
    | filter((n) => n > 2)     // [3, 4]
    | map((n) => n * 10)       // [30, 40]</pre>
      <p><code>(n) => …</code> is an arrow function, as in JavaScript.
      <code>1..5</code> is the range 1, 2, 3, 4.</p>`,
    task: H`<ol><li>Write <code>even_squares(xs: list) -> list</code>: keep the even numbers
      (<code>n % 2 == 0</code>), then square each one.</li>
      <li>Use the pipe <code>|</code>.</li>
      <li>Print <code>even_squares(1..11)</code>.</li></ol>`,
    starter: `// Step 4: lists and pipelines.\n\n`,
    hint: "<code>xs | filter((n) => …) | map((n) => …)</code>",
    solution: "fn even_squares(xs: list) -> list = xs | filter((n) => n % 2 == 0) | map((n) => n * n)\n\nprint(even_squares(1..11))",
    hidden: `print(even_squares([1, 2, 3, 4, 5, 6]))\nprint(even_squares([]))\nprint(even_squares([7, 9]))`,
    checks: [
      { name: "The pipe | is used", fn: (t) => t.uses(/\|\s*(filter|map)\b/, "Chain the calls with the pipe: xs | filter(...) | map(...).") },
      { name: "even_squares([1..6]) is [4, 16, 36]", fn: (t) => t.eq(t.hidden[0], "[4, 16, 36]") },
      { name: "An empty list gives []", fn: (t) => t.eq(t.hidden[1], "[]") },
      { name: "Odd numbers only give []", fn: (t) => t.eq(t.hidden[2], "[]") },
      { name: "It prints even_squares(1..11)", fn: (t) => t.eq(t.out[0], "[4, 16, 36, 64, 100]") },
    ],
  },
  {
    id: "errors",
    level: "Basics",
    title: "Errors are values",
    lesson: H`
      <p>Quillo has no exceptions. A function that fails gives an <em>error value</em>,
      and <code>??</code> replaces it (or <code>null</code>) with a fallback:</p>
      <pre>int("42")          // 42
int("abc")         // err("not an int: \"abc\"")
int("abc") ?? 0    // 0</pre>
      <p>You make your own with <code>err("message")</code>. The ternary
      <code>cond ? a : b</code> works as in JavaScript.</p>`,
    task: H`<ol><li>Write <code>parse_age(text: str) -> int</code>: the number in
      <code>text</code>, or <code>0</code> when it is not a number.</li>
      <li>Write <code>safe_div(a, b)</code>: <code>err("cannot divide by zero")</code> when
      <code>b == 0</code>, else <code>a / b</code>.</li></ol>`,
    starter: `// Step 5: errors are values.\n\n`,
    hint: `<code>int(text) ?? 0</code>, and <code>b == 0 ? err("…") : a / b</code>.`,
    solution: "fn parse_age(text: str) -> int = int(text) ?? 0\n\nfn safe_div(a, b) = b == 0 ? err(\"cannot divide by zero\") : a / b",
    hidden: `print(parse_age("42"))\nprint(parse_age("abc"))\nprint(parse_age(""))\nprint(safe_div(6, 3))\nprint(str(safe_div(1, 0)))\nprint(safe_div(1, 0) ?? "fallback")`,
    checks: [
      { name: "parse_age(\"42\") is 42", fn: (t) => t.eq(t.hidden[0], "42") },
      { name: "parse_age(\"abc\") is 0", fn: (t) => t.eq(t.hidden[1], "0") },
      { name: "parse_age(\"\") is 0", fn: (t) => t.eq(t.hidden[2], "0") },
      { name: "safe_div(6, 3) is 2", fn: (t) => t.eq(t.hidden[3], "2") },
      { name: "safe_div(1, 0) is an error value", fn: (t) => t.eq(t.hidden[4], 'err("cannot divide by zero")') },
      { name: "?? replaces that error", fn: (t) => t.eq(t.hidden[5], "fallback") },
    ],
  },
  {
    id: "match",
    level: "Basics",
    title: "Pattern matching",
    lesson: H`
      <p><code>match</code> compares a value with patterns, top to bottom, and gives the
      result of the first arm that fits. Patterns can look inside maps, test types and
      bind names:</p>
      <pre>fn kind(v) = match v {
    { type: "user", name } => \`user \${name}\`
    int as n if n < 0      => "negative"
    "yes" | "y"            => "agreed"
    _                      => "something else"
}</pre>
      <p>A map pattern needs only the keys it names; extra keys are allowed.</p>`,
    task: H`<p>Write <code>describe(event)</code> that gives:</p><ul>
      <li><code>{ type: "click", x: 3, y: 4 }</code> → <code>click at 3,4</code></li>
      <li><code>{ type: "key", key: "Enter" }</code> or <code>key: "Return"</code> → <code>enter</code></li>
      <li>any other <code>{ type: "key", key }</code> → <code>key K</code> (the key's text)</li>
      <li>anything else → <code>other</code></li></ul>`,
    starter: `// Step 6: pattern matching.\n\nfn describe(event) = match event {\n    // your arms here\n}\n`,
    hint: `Put the <code>"Enter" | "Return"</code> arm before the general <code>{ type: "key", key }</code> arm, and finish with <code>_ =&gt; "other"</code>.`,
    solution: "fn describe(event) = match event {\n    { type: \"click\", x: int, y: int } => `click at ${x},${y}`\n    { type: \"key\", key: \"Enter\" | \"Return\" } => \"enter\"\n    { type: \"key\", key } => `key ${key}`\n    _ => \"other\"\n}",
    hidden: `print(describe({ type: "click", x: 3, y: 4 }))\nprint(describe({ type: "key", key: "Enter" }))\nprint(describe({ type: "key", key: "Return" }))\nprint(describe({ type: "key", key: "q" }))\nprint(describe({ type: "scroll" }))\nprint(describe(42))`,
    checks: [
      { name: "A click", fn: (t) => t.eq(t.hidden[0], "click at 3,4") },
      { name: "Enter", fn: (t) => t.eq(t.hidden[1], "enter") },
      { name: "Return", fn: (t) => t.eq(t.hidden[2], "enter") },
      { name: "Another key", fn: (t) => t.eq(t.hidden[3], "key q") },
      { name: "Another event", fn: (t) => t.eq(t.hidden[4], "other") },
      { name: "Not a map at all", fn: (t) => t.eq(t.hidden[5], "other") },
    ],
  },

  // ───────────────────────────── Data ─────────────────────────────
  {
    id: "decimals",
    level: "Data",
    title: "Exact decimals",
    lesson: H`
      <p>Floats cannot hold most decimal fractions exactly: <code>0.1 + 0.2</code> is
      <code>0.30000000000000004</code>. For money, Quillo has a decimal type: write the
      number with an <code>m</code>.</p>
      <pre>0.1 + 0.2 == 0.3       // false
0.1m + 0.2m == 0.3m    // true
19.99m * 3             // 59.97</pre>
      <p><code>sum(list)</code> adds a list of numbers or decimals.</p>`,
    task: H`<ol><li>Print <code>0.1 + 0.2 == 0.3</code> and then <code>0.1m + 0.2m == 0.3m</code>, to see the difference.</li>
      <li>Write <code>cart_total(prices: list) -> dec</code> that adds up a list of decimal prices.</li></ol>`,
    starter: `// Step 7: exact decimals.\n\n`,
    hint: "<code>fn cart_total(prices: list) -> dec = sum(prices)</code>",
    solution: "print(0.1 + 0.2 == 0.3)\nprint(0.1m + 0.2m == 0.3m)\n\nfn cart_total(prices: list) -> dec = sum(prices)",
    hidden: `print(cart_total([0.1m, 0.2m]) == 0.3m)\nprint(cart_total([19.99m, 5m, 0.01m]))`,
    checks: [
      { name: "It prints false, then true", fn: (t) => { t.eq(t.out[0], "false", "First print 0.1 + 0.2 == 0.3 (floats)."); t.eq(t.out[1], "true", "Then print 0.1m + 0.2m == 0.3m (decimals)."); } },
      { name: "A decimal literal (m) is used", fn: (t) => t.uses(/\dm\b/, "Write decimals with an m: 0.1m.") },
      { name: "cart_total([0.1m, 0.2m]) is exactly 0.3m", fn: (t) => t.eq(t.hidden[0], "true") },
      { name: "cart_total([19.99m, 5m, 0.01m]) is 25.00", fn: (t) => t.eq(t.hidden[1], "25.00") },
    ],
  },
  {
    id: "money",
    level: "Data",
    title: "Money",
    lesson: H`
      <p>The <code>money</code> module keeps an amount with its currency.
      <code>money.allocate</code> splits it by weights <em>without losing a cent</em>, and
      <code>money.format</code> writes it as a locale does.</p>
      <pre>let m = money.of(10m, "EUR")
money.allocate(m, [1, 1, 1])        // 3.34, 3.33, 3.33
money.format(m, "de-DE")            // "10,00 €"</pre>
      <p><code>for i in 0..n => 1</code> makes a list of <code>n</code> ones.</p>`,
    task: H`<p>Write <code>split_bill(amount: dec, people: int) -> list</code>: split
      <code>amount</code> US dollars into equal shares, written for <code>en-US</code>.</p>
      <p><code>split_bill(100m, 3)</code> must be <code>["$33.34", "$33.33", "$33.33"]</code>.</p>`,
    starter: `// Step 8: money.\n\n`,
    hint: `<code>money.allocate(money.of(amount, "USD"), for i in 0..people => 1) | map((m) =&gt; money.format(m, "en-US"))</code>`,
    solution: "fn split_bill(amount: dec, people: int) -> list =\n    money.allocate(money.of(amount, \"USD\"), for i in 0..people => 1)\n        | map((m) => money.format(m, \"en-US\"))",
    hidden: `print(split_bill(100m, 3))\nprint(split_bill(10m, 4))`,
    checks: [
      { name: "split_bill(100m, 3)", fn: (t) => t.eq(t.hidden[0], '["$33.34", "$33.33", "$33.33"]') },
      { name: "split_bill(10m, 4)", fn: (t) => t.eq(t.hidden[1], '["$2.50", "$2.50", "$2.50", "$2.50"]') },
    ],
  },
  {
    id: "records",
    level: "Data",
    title: "Records",
    lesson: H`
      <p><code>type</code> names a shape. Calling the type checks a map against it, fills
      in defaults, and drops fields the type does not have. A bad map gives an error
      value.</p>
      <pre>type Point = { x: int, y: int = 0 }

Point({ x: 1 })            // { x: 1, y: 0 }
Point({ x: "a" })          // err(...)
Point({ x: 1, admin: true }) // { x: 1, y: 0 }  admin is dropped</pre>`,
    task: H`<ol><li>Declare <code>type Book = { title: str, pages: int, read: bool = false }</code>.</li>
      <li>Write <code>summary(b: Book) -> str</code> that gives <code>Dune (412 pages)</code> for that book.</li></ol>`,
    starter: `// Step 9: records.\n\n`,
    hint: "A template string: <code>`${b.title} (${b.pages} pages)`</code>.",
    solution: "type Book = { title: str, pages: int, read: bool = false }\n\nfn summary(b: Book) -> str = `${b.title} (${b.pages} pages)`",
    hidden: `print(Book({ title: "Dune", pages: 412 }))\nprint(summary(Book({ title: "Dune", pages: 412 })))\nprint(Book(json.parse('{"title": "X"}')) ?? "invalid")\nprint(Book(json.parse('{"title": "X", "pages": 3, "admin": true}')))`,
    checks: [
      { name: "`read` defaults to false", fn: (t) => t.eq(t.hidden[0], '{ title: "Dune", pages: 412, read: false }') },
      { name: "summary(...) is \"Dune (412 pages)\"", fn: (t) => t.eq(t.hidden[1], "Dune (412 pages)") },
      { name: "A book with no pages is an error", fn: (t) => t.eq(t.hidden[2], "invalid") },
      { name: "Unknown fields are dropped", fn: (t) => t.eq(t.hidden[3], '{ title: "X", pages: 3, read: false }') },
    ],
  },
  {
    id: "checker",
    level: "Data",
    title: "Checked before it runs",
    lesson: H`
      <p>Before a program runs, Quillo checks it: types, record fields, function calls,
      routes and components. Mistakes are found without running anything, with the line
      and often a suggestion.</p>
      <p>The code in the editor has <b>two</b> mistakes. Press <b>Run &amp; check</b> and
      read the <b>Checker</b> messages in the console.</p>`,
    task: H`<ol><li>Run the code and read what the checker says.</li>
      <li>Fix both mistakes.</li>
      <li>The program must print <code>Ada &lt;ada@example.com&gt;</code> and then <code>2 tags</code>.</li></ol>`,
    starter: "// Step 10: let the checker find the bugs.\n\ntype User = { name: str, email: str, tags: list<str> = [] }\n\nfn label(u: User) -> str = `${u.nmae} <${u.email}>`\nfn tag_count(u: User) -> int = len(u.tags)\n\nlet ada = User({ name: \"Ada\", email: \"ada@example.com\", tags: [\"math\", \"engines\"] })\n\nprint(label(\"Ada\"))\nprint(`${tag_count(ada)} tags`)\n",
    hint: "The checker says “did you mean `name`?” on one line, and that <code>label</code> wants a User, not a string, on another.",
    solution: "type User = { name: str, email: str, tags: list<str> = [] }\n\nfn label(u: User) -> str = `${u.name} <${u.email}>`\nfn tag_count(u: User) -> int = len(u.tags)\n\nlet ada = User({ name: \"Ada\", email: \"ada@example.com\", tags: [\"math\", \"engines\"] })\n\nprint(label(ada))\nprint(`${tag_count(ada)} tags`)",
    keepStarter: true,
    checks: [
      { name: "The checker finds no errors", fn: (t) => t.expect(t.result.check.ok, "The checker still reports an error: read it in the console.") },
      { name: "It prints the label", fn: (t) => t.eq(t.out[0], "Ada <ada@example.com>") },
      { name: "It prints the tag count", fn: (t) => t.eq(t.out[1], "2 tags") },
    ],
  },

  // ───────────────────────────── Server ─────────────────────────────
  {
    id: "route",
    level: "Server",
    title: "Your first route",
    lesson: H`
      <p>Routes are part of the language. A program that declares a route keeps running
      and serves it:</p>
      <pre>route GET /ping = "pong"</pre>
      <p>A string answers as text, a map or list as JSON, and HTML as a page. The
      <b>Preview</b> tab shows your program's pages.</p>`,
    task: H`<ol><li><code>GET /</code> answers <code>Hello from Quillo</code>.</li>
      <li><code>GET /about</code> answers <code>Made with Quillo</code>.</li></ol>`,
    starter: `// Step 11: your first routes.\n\n`,
    hint: `<code>route GET / = "…"</code> and a second line for <code>/about</code>.`,
    solution: `route GET / = "Hello from Quillo"\nroute GET /about = "Made with Quillo"`,
    preview: "/",
    checks: [
      { name: "The program serves", fn: (t) => t.serving() },
      { name: "GET / answers “Hello from Quillo”", fn: async (t) => { const r = await t.get("/"); t.eq(r.status, 200, "GET / should answer 200."); t.eq(r.text, "Hello from Quillo"); } },
      { name: "GET /about answers “Made with Quillo”", fn: async (t) => { const r = await t.get("/about"); t.eq(r.status, 200, "GET /about should answer 200."); t.eq(r.text, "Made with Quillo"); } },
    ],
  },
  {
    id: "params",
    level: "Server",
    title: "Path parameters",
    lesson: H`
      <p><code>:name</code> in a path becomes a variable. A type in brackets,
      <code>:id(int)</code>, matches only that type and gives you a real number; other
      text finds no route (404).</p>
      <pre>route GET /users/:id(int) = \`user \${id + 1}\`
// /users/41 → "user 42"     /users/abc → 404</pre>`,
    task: H`<ol><li><code>GET /hello/:name</code> answers <code>Hello, &lt;name&gt;!</code></li>
      <li><code>GET /double/:n(int)</code> answers twice <code>n</code>, as text
      (<code>/double/21</code> → <code>42</code>).</li></ol>`,
    starter: `// Step 12: path parameters.\n\n`,
    hint: "Answer with template strings, e.g. <code>`${n * 2}`</code>, so the answer is text.",
    solution: "route GET /hello/:name = `Hello, ${name}!`\nroute GET /double/:n(int) = `${n * 2}`",
    preview: "/hello/Ada",
    checks: [
      { name: "The program serves", fn: (t) => t.serving() },
      { name: "/hello/Ada", fn: async (t) => t.eq((await t.get("/hello/Ada")).text, "Hello, Ada!") },
      { name: "/hello/Grace", fn: async (t) => t.eq((await t.get("/hello/Grace")).text, "Hello, Grace!") },
      { name: "/double/21 is 42", fn: async (t) => t.eq((await t.get("/double/21")).text, "42") },
      { name: "/double/abc finds no route", fn: async (t) => t.eq((await t.get("/double/abc")).status, 404, "Use :n(int) so text that is not a number is a 404.") },
    ],
  },
  {
    id: "query",
    level: "Server",
    title: "Query strings",
    lesson: H`
      <p>After <code>?</code>, a pattern takes the query string, with types and defaults.
      A request that does not fit is answered 400.</p>
      <pre>route GET /list ? { limit: int = 10 } = { limit }
// /list → {"limit":10}    /list?limit=3 → {"limit":3}</pre>
      <p><code>{ limit }</code> is short for <code>{ limit: limit }</code>; a map answers as JSON.</p>`,
    task: H`<p><code>GET /search</code> takes <code>q</code> (text, required) and <code>page</code>
      (int, default <code>1</code>), and answers the JSON <code>{ "q": …, "page": … }</code>.</p>`,
    starter: `// Step 13: query strings.\n\n`,
    hint: "<code>route GET /search ? { q: str, page: int = 1 } = { q, page }</code>",
    solution: "route GET /search ? { q: str, page: int = 1 } = { q, page }",
    preview: "/search?q=cats",
    checks: [
      { name: "The program serves", fn: (t) => t.serving() },
      { name: "/search?q=cats", fn: async (t) => t.deepEq(await (await t.get("/search?q=cats")).json(), { q: "cats", page: 1 }) },
      { name: "/search?q=cats&page=3", fn: async (t) => t.deepEq(await (await t.get("/search?q=cats&page=3")).json(), { q: "cats", page: 3 }) },
      { name: "page must be a number", fn: async (t) => t.eq((await t.get("/search?q=cats&page=x")).status, 400, "Give page the type int.") },
      { name: "q is required", fn: async (t) => t.eq((await t.get("/search")).status, 400, "q has no default, so a request without it should be refused.") },
    ],
  },
  {
    id: "html",
    level: "Server",
    title: "HTML is a value",
    lesson: H`
      <p>HTML is written straight in the code, and <code>{…}</code> puts a value in it
      (escaped for you). A <code>view</code> is a function that gives HTML, used like a
      tag. <code>for x in xs => …</code> makes a list.</p>
      <pre>view Badge(label: str) = &lt;span class="badge"&gt;{label}&lt;/span&gt;

route GET / = &lt;ul&gt;{for n in ["a", "b"] => &lt;li&gt;&lt;Badge label={n}/&gt;&lt;/li&gt;}&lt;/ul&gt;</pre>
      <p>A view's <code>children</code> parameter gets what is written between its tags.</p>`,
    task: H`<ol><li>Write <code>view Card(title: str, children)</code> that gives
      <code>&lt;section class="card"&gt;&lt;h2&gt;</code><i>title</i><code>&lt;/h2&gt;</code><i>children</i><code>&lt;/section&gt;</code>.</li>
      <li><code>let fruits = ["apple", "pear", "fig"]</code></li>
      <li><code>GET /</code> answers a page with a <code>Card</code> titled <code>Fruits</code>
      holding a <code>&lt;ul&gt;</code> with one <code>&lt;li&gt;</code> per fruit.</li></ol>`,
    starter: `// Step 14: HTML and views.\n\n`,
    hint: "<code>route GET / = &lt;html&gt;&lt;body&gt;&lt;Card title=\"Fruits\"&gt;&lt;ul&gt;{for f in fruits =&gt; &lt;li&gt;{f}&lt;/li&gt;}&lt;/ul&gt;&lt;/Card&gt;&lt;/body&gt;&lt;/html&gt;</code>",
    solution: "view Card(title: str, children) = <section class=\"card\"><h2>{title}</h2>{children}</section>\n\nlet fruits = [\"apple\", \"pear\", \"fig\"]\n\nroute GET / = <html><body>\n    <Card title=\"Fruits\">\n        <ul>{for f in fruits => <li>{f}</li>}</ul>\n    </Card>\n</body></html>",
    preview: "/",
    checks: [
      { name: "The program serves", fn: (t) => t.serving() },
      { name: "A view named Card is declared", fn: (t) => t.uses(/\bview\s+Card\s*\(/, "Declare it with: view Card(title: str, children) = ...") },
      { name: "GET / is HTML", fn: async (t) => { const r = await t.get("/"); t.expect(/text\/html/.test(r.type), `GET / should answer HTML, it answered ${r.type || "nothing"}.`); } },
      { name: "The card has its title", fn: async (t) => { const d = await t.html("/"); const h = d.querySelector("section.card > h2"); t.expect(h, "No <section class=\"card\"> with an <h2> in it."); t.eq(h.textContent.trim(), "Fruits"); } },
      { name: "One <li> per fruit, inside the card", fn: async (t) => { const d = await t.html("/"); const li = [...d.querySelectorAll("section.card ul li")].map((x) => x.textContent.trim()); t.deepEq(li, ["apple", "pear", "fig"]); } },
    ],
  },
  {
    id: "json",
    level: "Server",
    title: "JSON bodies and replies",
    lesson: H`
      <p>A route can match the request body by pattern. <code>{ json: … }</code> looks
      inside the JSON body; a body that does not fit goes on to the next route.
      <code>reply status value</code> answers with a status.</p>
      <pre>route POST /votes { json: { choice: "yes" | "no" } } {
    reply 201 { counted: choice }
}
route POST /votes = respond(422, "choose yes or no")</pre>
      <p><code>customer.id: int as id</code> looks inside a nested map and names the value.</p>`,
    task: H`<ol><li><code>POST /orders</code> with a JSON body
      <code>{ "type": "order" | "refund", "customer": { "id": &lt;int&gt; } }</code>
      answers <b>201</b> with <code>{ "accepted": true, "customer": &lt;id&gt; }</code>.</li>
      <li>Any other body to <code>POST /orders</code> answers <b>422</b> with <code>not an order</code>.</li></ol>`,
    starter: `// Step 15: JSON bodies and replies.\n\n`,
    hint: "<code>route POST /orders { json: { type: \"order\" | \"refund\", customer.id: int as id } } { reply 201 { accepted: true, customer: id } }</code>, then the 422 fallback route.",
    solution: "route POST /orders { json: { type: \"order\" | \"refund\", customer.id: int as id } } {\n    reply 201 { accepted: true, customer: id }\n}\nroute POST /orders = respond(422, \"not an order\")",
    checks: [
      { name: "The program serves", fn: (t) => t.serving() },
      { name: "An order is accepted (201)", fn: async (t) => { const r = await t.post("/orders", { type: "order", customer: { id: 7 } }); t.eq(r.status, 201); t.deepEq(await r.json(), { accepted: true, customer: 7 }); } },
      { name: "A refund is accepted too", fn: async (t) => { const r = await t.post("/orders", { type: "refund", customer: { id: 12 } }); t.eq(r.status, 201); t.deepEq(await r.json(), { accepted: true, customer: 12 }); } },
      { name: "A wrong type is refused (422)", fn: async (t) => { const r = await t.post("/orders", { type: "gift", customer: { id: 7 } }); t.eq(r.status, 422); t.eq(r.text, "not an order"); } },
      { name: "A text id is refused (422)", fn: async (t) => t.eq((await t.post("/orders", { type: "order", customer: { id: "7" } })).status, 422) },
    ],
  },
  {
    id: "database",
    level: "Server",
    title: "A database",
    lesson: H`
      <p>SQLite is built in. <code>db.open</code> opens a database (<code>":memory:"</code>
      keeps it in memory), <code>db.exec</code> runs a statement with <code>?</code>
      placeholders, and <code>db.query</code> gives rows as a list of maps.</p>
      <pre>db.open(":memory:")
db.exec("create table pets (id integer primary key, name text)")
db.exec("insert into pets (name) values (?)", "Rex")
db.query("select * from pets")   // [{ id: 1, name: "Rex" }]</pre>
      <p>A route that uses the database says so with <code>with db</code>: that is an
      <em>effect</em>, which the checker follows.</p>`,
    task: H`<ol><li>Open <code>":memory:"</code> and create a table <code>todos (id integer primary key, text text not null)</code>.</li>
      <li><code>POST /todos</code> with JSON <code>{ "text": … }</code> inserts it and answers <b>201</b>.</li>
      <li><code>GET /todos</code> answers every todo as JSON, oldest first: <code>[{ "id": 1, "text": "milk" }, …]</code>.</li></ol>`,
    starter: `// Step 16: a database.\n\n`,
    hint: "<code>route POST /todos { json: { text: str } } with db { db.exec(\"insert into todos (text) values (?)\", text); reply 201 { added: text } }</code>",
    solution: "db.open(\":memory:\")\ndb.exec(\"create table todos (id integer primary key, text text not null)\")\n\nroute POST /todos { json: { text: str } } with db {\n    db.exec(\"insert into todos (text) values (?)\", text)\n    reply 201 { added: text }\n}\n\nroute GET /todos with db = db.query(\"select id, text from todos order by id\")",
    preview: "/todos",
    checks: [
      { name: "The program serves", fn: (t) => t.serving() },
      { name: "GET /todos starts empty", fn: async (t) => t.deepEq(await (await t.get("/todos")).json(), [], "GET /todos should be [] before anything is added.") },
      { name: "POST /todos answers 201", fn: async (t) => { t.eq((await t.post("/todos", { text: "milk" })).status, 201); t.eq((await t.post("/todos", { text: "eggs" })).status, 201); } },
      { name: "GET /todos lists both, oldest first", fn: async (t) => { const rows = await (await t.get("/todos")).json(); t.deepEq(rows.map((r) => [r.id, r.text]), [[1, "milk"], [2, "eggs"]]); } },
    ],
  },

  // ───────────────────────────── Components ─────────────────────────────
  {
    id: "counter",
    level: "Components",
    title: "Your first component",
    lesson: H`
      <p>A <code>component</code> is a view with <code>state</code> that also runs in the
      browser. The server renders it; the browser takes over that HTML as it is.</p>
      <pre>component Like() {
    state likes = 0
    let label = likes == 1 ? "like" : "likes"   // follows likes
    &lt;button onclick={() =&gt; { likes += 1 }}&gt;{likes} {label}&lt;/button&gt;
}</pre>
      <p>Assigning a state updates only the places that show it. A <code>let</code> that
      reads state is worked out again when it changes.</p>`,
    task: H`<ol><li>Write <code>component Counter()</code> with <code>state count = 0</code>
      and <code>let double = count * 2</code>.</li>
      <li>It shows <code>&lt;span id="count"&gt;</code>{count}, <code>&lt;span id="double"&gt;</code>{double}
      and a <code>&lt;button&gt;</code> that adds 1 to <code>count</code>.</li>
      <li>Wrap them in one <code>&lt;div&gt;</code>; <code>GET /</code> shows the counter in a page.</li></ol>
      <p class="note">The check clicks your button in the Preview.</p>`,
    starter: `// Step 17: your first component.\n\n`,
    hint: "<code>&lt;button onclick={() =&gt; { count += 1 }}&gt;+&lt;/button&gt;</code>; the route is <code>route GET / = &lt;html&gt;&lt;body&gt;&lt;Counter/&gt;&lt;/body&gt;&lt;/html&gt;</code>.",
    solution: "component Counter() {\n    state count = 0\n    let double = count * 2\n    <div>\n        <span id=\"count\">{count}</span> × 2 = <span id=\"double\">{double}</span>\n        <button onclick={() => { count += 1 }}>+</button>\n    </div>\n}\n\nroute GET / = <html><body><Counter/></body></html>",
    preview: "/",
    checks: [
      { name: "The program serves", fn: (t) => t.serving() },
      { name: "The server renders 0", fn: async (t) => { const d = await t.html("/"); t.expect(d.querySelector("#count"), "No element with id=\"count\" on the page."); t.eq(d.querySelector("#count").textContent.trim(), "0"); } },
      { name: "Clicking the button counts", fn: async (t) => { const f = await t.frame("/"); f.click("button"); f.click("button"); f.click("button"); await f.waitText("#count", "3"); } },
      { name: "double follows count", fn: async (t) => { const f = t.lastFrame; await f.waitText("#double", "6"); } },
    ],
  },
  {
    id: "input",
    level: "Components",
    title: "Inputs follow state",
    lesson: H`
      <p>An input whose <code>value</code> is a state is two-way: typing sets the state,
      and setting the state changes the input.</p>
      <pre>component Search() {
    state q = ""
    &lt;div&gt;&lt;input value={q}/&gt; &lt;p&gt;Searching for {q}&lt;/p&gt;&lt;/div&gt;
}</pre>
      <p>Note: in Quillo <code>""</code> is truthy. Compare with <code>== ""</code> to test for an empty string.</p>`,
    task: H`<ol><li>Write <code>component Greeter()</code> with <code>state name = ""</code>, an
      <code>&lt;input value={name}/&gt;</code> and a <code>&lt;p id="out"&gt;</code>.</li>
      <li>The paragraph shows <code>Who are you?</code> while the name is empty, and
      <code>Hello, &lt;name&gt;!</code> once something is typed.</li>
      <li><code>GET /</code> shows the greeter.</li></ol>`,
    starter: `// Step 18: inputs follow state.\n\n`,
    hint: "<code>&lt;p id=\"out\"&gt;{name == \"\" ? \"Who are you?\" : `Hello, ${name}!`}&lt;/p&gt;</code>",
    solution: "component Greeter() {\n    state name = \"\"\n    <div>\n        <input value={name}/>\n        <p id=\"out\">{name == \"\" ? \"Who are you?\" : `Hello, ${name}!`}</p>\n    </div>\n}\n\nroute GET / = <html><body><Greeter/></body></html>",
    preview: "/",
    checks: [
      { name: "The program serves", fn: (t) => t.serving() },
      { name: "It starts with “Who are you?”", fn: async (t) => { const d = await t.html("/"); t.expect(d.querySelector("#out"), "No element with id=\"out\" on the page."); t.eq(d.querySelector("#out").textContent.trim(), "Who are you?"); } },
      { name: "Typing a name greets it", fn: async (t) => { const f = await t.frame("/"); f.type("input", "Ada"); await f.waitText("#out", "Hello, Ada!"); } },
      { name: "Clearing it asks again", fn: async (t) => { const f = t.lastFrame; f.type("input", ""); await f.waitText("#out", "Who are you?"); } },
    ],
  },
  {
    id: "serverfn",
    level: "Components",
    title: "Calling the server",
    lesson: H`
      <p>A <code>server fn</code> runs on the server, but a component calls it like any
      function. Quillo makes the request for you: no API, no <code>fetch</code>, no
      <code>await</code>.</p>
      <pre>server fn add_note(text: str) -> list with db {
    db.exec("insert into notes (text) values (?)", text)
    db.query("select * from notes order by id")
}</pre>
      <p>In a component, <code>@submit={…}</code> handles a form's submit (the page does
      not reload). <code>key={…}</code> gives each list item an identity.</p>`,
    task: H`<p>Build the notes app:</p><ol>
      <li>A <code>notes (id integer primary key, text text)</code> table in <code>":memory:"</code>.</li>
      <li><code>server fn add_note(text: str) -> list with db</code> that inserts and gives every note.</li>
      <li><code>component Notes(initial: list)</code> with <code>state notes = initial</code> and
      <code>state draft = ""</code>: a <code>&lt;form&gt;</code> holding an <code>&lt;input value={draft}/&gt;</code> and a
      <code>&lt;ul&gt;</code> with an <code>&lt;li&gt;</code> per note. Submitting calls
      <code>add_note(draft)</code>, keeps its answer in <code>notes</code> and empties <code>draft</code>.</li>
      <li><code>GET /</code> renders <code>Notes</code> with the notes from the database.</li></ol>`,
    starter: `// Step 19: calling the server from a component.\n\n`,
    hint: "<code>&lt;form @submit={() =&gt; { notes = add_note(draft); draft = \"\" }}&gt;</code>, and <code>&lt;Notes initial={db.query(\"select * from notes order by id\")}/&gt;</code> in the route.",
    solution: "db.open(\":memory:\")\ndb.exec(\"create table notes (id integer primary key, text text)\")\n\nserver fn add_note(text: str) -> list with db {\n    db.exec(\"insert into notes (text) values (?)\", text)\n    db.query(\"select * from notes order by id\")\n}\n\ncomponent Notes(initial: list) {\n    state notes = initial\n    state draft = \"\"\n    <form @submit={() => { notes = add_note(draft); draft = \"\" }}>\n        <input value={draft} placeholder=\"A note\"/>\n        <ul>{for n in notes => <li key={n.id}>{n.text}</li>}</ul>\n    </form>\n}\n\nroute GET / = <html><body>\n    <Notes initial={db.query(\"select * from notes order by id\")}/>\n</body></html>",
    preview: "/",
    checks: [
      { name: "The program serves", fn: (t) => t.serving() },
      { name: "A server fn is declared", fn: (t) => t.uses(/\bserver\s+fn\s+add_note\b/, "Declare: server fn add_note(text: str) -> list with db { ... }") },
      { name: "The page starts with no notes", fn: async (t) => { const d = await t.html("/"); t.expect(d.querySelector("form input"), "No <form> with an <input> on the page."); t.eq(d.querySelectorAll("li").length, 0, "There should be no <li> before a note is added."); } },
      { name: "Submitting adds a note", fn: async (t) => { const f = await t.frame("/"); f.type("input", "buy milk"); f.submit("form"); await f.waitText("li", "buy milk"); } },
      { name: "The input is emptied", fn: async (t) => { await t.lastFrame.waitValue("input", ""); } },
      { name: "The note was saved on the server", fn: async (t) => { const d = await t.html("/"); t.deepEq([...d.querySelectorAll("li")].map((x) => x.textContent.trim()), ["buy milk"], "Reloading the page should show the note from the database."); } },
    ],
  },
];
