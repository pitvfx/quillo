// Programs for the free playground, one feature each.

export const EXAMPLES = [
  {
    name: "Hello, world",
    code: `// Press Run (Ctrl+Enter). print writes to the console.
let name = "world"
print(\`Hello, \${name}!\`)

fn fib(n: int) -> int = n < 2 ? n : fib(n - 1) + fib(n - 2)
print(for i in 0..10 => fib(i))
`,
  },
  {
    name: "Pipelines",
    code: `let orders = [
    { id: 1, customer: "ann", total: 120, paid: true },
    { id: 2, customer: "bob", total: 40, paid: false },
    { id: 3, customer: "ann", total: 300, paid: true },
    { id: 4, customer: "cid", total: 90, paid: true },
]

orders
    | filter((o) => o.paid)
    | sort_by((o) => -o.total)
    | map((o) => \`#\${o.id} \${o.customer}: \${o.total}\`)
    | join("\\n")
    | print

print(orders.filter((o) => o.customer == "ann").map((o) => o.total).sum())
`,
  },
  {
    name: "Pattern matching",
    code: `fn handle(msg) = match msg {
    { type: "login", user.name: str as who } => \`welcome back, \${who}\`
    { type: "buy", items: [first, ..rest] }  => \`buying \${first} and \${len(rest)} more\`
    { type: "buy", items: [] }               => "an empty cart"
    int as n if n < 0                        => "a negative number"
    "ping" | "PING"                          => "pong"
    _                                        => "unknown"
}

for m in [
    { type: "login", user: { name: "ada" } },
    { type: "buy", items: ["pen", "ink", "paper"] },
    { type: "buy", items: [] },
    -5,
    "PING",
    true,
] => print(handle(m))
`,
  },
  {
    name: "Exact money",
    code: `print(0.1 + 0.2)          // a float
print(0.1m + 0.2m)        // a decimal: exact

let total = money.mul(money.of(19.99m, "USD"), 3)
print(money.format(total, "en-US"))

// Split without losing a cent, written as each locale does
let shares = money.allocate(total, [1, 1, 1])
print(shares | map((m) => money.format(m, "de-DE")))
print(money.format(money.of(1234567m, "JPY"), "ja-JP"))
`,
  },
  {
    name: "Records",
    code: `type Address = { city: str, zip: str? }
type User = {
    name: str,
    email: str,
    role: "admin" | "member" = "member",
    address: Address?,
}

print(User({ name: "Ada", email: "ada@example.com" }))

// What a client sends cannot add fields: is_staff is dropped
let sent = json.parse('{"name": "Bob", "email": "b@x.io", "is_staff": true}')
print(User(sent))

// A bad value is an error value that says what is wrong
print(str(User(json.parse('{"name": "Cy", "email": "c@x.io", "role": "boss"}'))))
`,
  },
  {
    name: "Routes and JSON",
    code: `// A program with routes keeps running. Open the Preview tab, or try:
//   /users/41   /search?q=cats&page=2   /api/stats

route GET / = <html><body>
    <h1>Routes</h1>
    <ul>
        <li><a href="/users/41">/users/41</a></li>
        <li><a href="/search?q=cats&page=2">/search?q=cats&amp;page=2</a></li>
        <li><a href="/api/stats">/api/stats</a></li>
    </ul>
</body></html>

route GET /users/:id(int) = \`user \${id + 1}\`
route GET /search ? { q: str, page: int = 1 } = { q, page, results: [] }
route GET /api/stats = { uptime: "fine", numbers: for i in 1..6 => i * i }
`,
  },
  {
    name: "Counter component",
    code: `component Counter(start: int = 0) {
    state count = start
    let double = count * 2
    <div class="counter">
        <button onclick={() => { count -= 1 }}>−</button>
        <b>{count}</b>
        <button onclick={() => { count += 1 }}>+</button>
        <p>double: {double}</p>
    </div>
}

route GET / = <html><body style="font: 18px system-ui; padding: 24px">
    <Counter start={5}/>
    <Counter/>
</body></html>
`,
  },
  {
    name: "Notes (server fn + db)",
    code: `db.open(":memory:")
db.exec("create table notes (id integer primary key, text text)")

server fn add_note(text: str) -> list with db {
    db.exec("insert into notes (text) values (?)", text)
    db.query("select * from notes order by id")
}

server fn remove(id: int) -> list with db {
    db.exec("delete from notes where id = ?", id)
    db.query("select * from notes order by id")
}

component Notes(initial: list) {
    state notes = initial
    state draft = ""
    <form @submit={() => { notes = add_note(draft); draft = "" }}>
        <input value={draft} placeholder="Write a note, press Enter"/>
        <ul>{for n in notes => <li key={n.id}>
            {n.text} <button type="button" onclick={() => { notes = remove(n.id) }}>×</button>
        </li>}</ul>
        <p>{len(notes)} notes</p>
    </form>
}

route GET / = <html><body style="font: 16px system-ui; padding: 24px">
    <h1>Notes</h1>
    <Notes initial={db.query("select * from notes order by id")}/>
</body></html>
`,
  },
  {
    name: "Todo list",
    code: `type Todo = { id: int, text: str, done: bool }

component Todos() {
    state items = []
    state draft = ""
    state next_id = 1
    let left = items | filter((t) => !t.done) | len

    <div>
        <form @submit={() => {
            if draft != "" {
                items = items | push({ id: next_id, text: draft, done: false })
                next_id += 1
                draft = ""
            }
        }}>
            <input value={draft} placeholder="What needs doing?"/>
        </form>
        <ul>{for t in items => <li key={t.id}>
            <label>
                <input type="checkbox" checked={t.done}
                    onchange={() => { items = items | map((x) => x.id == t.id ? { ...x, done: !x.done } : x) }}/>
                <span style={t.done ? "text-decoration: line-through; opacity: .6" : ""}>{t.text}</span>
            </label>
        </li>}</ul>
        <p>{left} left</p>
    </div>
}

route GET / = <html><body style="font: 16px system-ui; padding: 24px"><Todos/></body></html>
`,
  },
];
