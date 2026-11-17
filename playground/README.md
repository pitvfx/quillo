# Quillo playground

A web page for trying Quillo, with a guided tour of 19 steps, from `print` to components
that call the server. Each step teaches one feature and gives a task. You type the code
yourself. **Run & check** runs your code with the real `quillo` binary and tests the
result. When every check passes, the next step opens.

```sh
cargo build --release
node playground/server.mjs        # then open http://127.0.0.1:7070/
```

You need Node 18 or later. The server uses `QUILLO_BIN` if it is set. If not, it uses
`target/release/quillo`, then `target/debug/quillo`, then `quillo` on the `PATH`. Set
`PORT` to use a port other than 7070.

## The tour

| Level | Steps |
|---|---|
| Basics | print, variables and template strings, functions, lists and pipelines, errors as values, pattern matching |
| Data | exact decimals, money, records, the checker |
| Server | routes, path parameters, query strings, HTML and views, JSON bodies, a database |
| Components | state and derived values, two-way inputs, server functions |

The checks run in different ways, depending on the step:

- **Output**: what your program prints.
- **Hidden calls**: the tour adds its own calls after your code (for example
  `print(square(7))`). Their output is kept separate from yours.
- **HTTP**: requests to your routes.
- **Browser**: clicks and typing in the Preview, for components.

Your progress and the code for each step are saved in the browser. After three failed
tries, the step offers an answer to read.

The **Playground** tab has examples (pipelines, matching, money, records, routes, a
counter, notes, a to-do list) that you can edit and run freely.

## How it runs code

`POST /__pg/api/run` writes the code to a new temporary folder and runs `quillo check`
on it. If the check passes, it runs `quillo run`. A program that only prints ends, and
the page gets its output. A program that has routes keeps running. Every path outside
`/__pg/` is passed to it, WebSockets included, so the Preview and the checks reach it
from the playground's own origin. Only one program runs at a time.

Programs run under a policy that allows only the `db`, `time` and `random` effects, so
they get no file, network or environment access. A request can compute for at most 2 s,
and a script can run for at most 6 s. The playground listens on 127.0.0.1 only. It is a
tool for your own machine. **Do not expose it to the internet.**

## Testing the tour

`node playground/test.mjs` (with the server running and Playwright installed) types
each step's answer into the page, the way a learner would. It checks that every step
passes and that a wrong answer is refused.
