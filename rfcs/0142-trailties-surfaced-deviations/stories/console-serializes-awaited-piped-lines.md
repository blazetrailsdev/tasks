---
title: "console-serializes-awaited-piped-lines"
status: draft
updated: 2026-09-28
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
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

`trails console` (`packages/trailties/src/commands/console.ts`) now loads
`app/models/*` before `repl.start`, so a first input line can read a model.
But Node's REPL does not wait for a line's top-level `await` to settle before
evaluating the next piped line:

```sh
printf 'const p = await Post.first()\np.title\n' | bin/trails console
# trails> Uncaught TypeError: Cannot read properties of undefined (reading 'title')
```

The same happens with a bare `node -e 'require("repl").start()'` on Node 20.19,
with or without `terminal: false`, and wrapping `r.eval` in `r.pause()` /
`r.resume()` does not stop readline from dispatching the next buffered line.

IRB evaluates input line by line, so each line's result exists before the next
line runs: `Rails::Console.start` (`vendor/rails/v8.0.2/railties/lib/rails/commands/console/console.rb`)
hands off to IRB, whose `eval_input` loop reads one statement, evaluates it, then
reads the next.

## Acceptance criteria

- [ ] With piped stdin, a line that reads a binding bound by an earlier line's
      top-level `await` sees the settled value (`const p = await Post.first()` then
      `p.title` prints the title).
- [ ] A piped-stdin test in `console.trails.test.ts` covers the two-line case.
