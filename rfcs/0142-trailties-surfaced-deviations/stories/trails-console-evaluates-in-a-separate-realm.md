---
title: "trails console evaluates each line in a new vm realm, so where({...}) rejects hash literals"
status: ready
updated: 2026-09-27
rfc: "0142-trailties-surfaced-deviations"
cluster: boot
packages: ["trailties"]
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Found while verifying the root README quickstart (2026-09-27, main `b4f622ae87`).
In a fresh `trails new` app, `bin/trails console` cannot run the most basic
query:

```text
trails> await Post.where({ title: "Hello" }).first()
Uncaught ArgumentError: Unsupported argument type: [object Object] (object)
    at Proxy.buildWhereClause (packages/activerecord/src/relation/query-methods.ts:734)
```

`const p = await Post.create(...)` also fails (`SyntaxError: Unexpected token 'const'`
on the expression attempt), and a binding made on one line does not survive to
the next.

Cause: `packages/trailties/src/commands/console.ts:31-61` evaluates each line
with `vm.runInNewContext(...)`, wrapped in an async IIFE (`:36`, `:48`). An
object literal typed at the prompt is created in the REPL's context realm, so
the framework's plain-hash checks, which compare against the main realm's
`Object.prototype`, reject it. The IIFE wrapper scopes every `const`/`let` to
one line.

Rails' console is IRB evaluating in the application's own object space
(`vendor/rails/v8.0.2/railties/lib/rails/commands/console/console_command.rb`,
`vendor/rails/v8.0.2/railties/lib/rails/console/methods.rb`). A hash typed at
the prompt is an ordinary Hash, and a local persists across lines.

`@blazetrails/activerecord-cli`'s `ar console` (`packages/activerecord-cli/src/console.ts:49`)
uses `repl.start({ useGlobal: false })`, which is worth checking for the same
realm split.

## Acceptance criteria

- `trails console` evaluates input in the main realm (for example
  `repl.start` with `useGlobal: true` and Node's own top-level-await REPL
  handling, or evaluation with the main realm's globals), so that
  `await Post.where({ title: "x" }).first()` works.
- `const p = await Post.create({...})` on one line leaves `p` readable on the next.
- A console test drives both cases through the REPL.
