---
title: "tasks list --json truncates at one pipe buffer, so every programmatic reader gets invalid JSON"
status: draft
updated: 2026-10-09
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## What

`tasks list --json` writes complete, valid JSON to a file and a TRUNCATED
stream to a pipe. It stops at exactly 65,536 bytes — one pipe buffer — so any
consumer that reads it through a pipe gets a JSON syntax error.

```text
$ pnpm tasks list --json > out.json; wc -c out.json      # 10429358, parses, 12401 entries
$ pnpm tasks list --json | head -c 2000000 | wc -c       # 65536
$ pnpm tasks list --json | python3 -c 'import json,sys; json.load(sys.stdin)'
json.decoder.JSONDecodeError: Unterminated string starting at: line 2461 column 18
```

## Why it matters

It silently breaks every programmatic reader of the CLI. Two consecutive
reviews of trailmap#47 reported "`pnpm tasks list --json` emits unparseable
JSON here" and fell back to reviewing against the PR description alone, unable
to resolve which story the work belonged to. The output is not malformed —
it is decapitated — so the error message sends the reader hunting for a quoting
bug that does not exist.

## Root cause

`tasks/src/cli.ts:509`:

```ts
// Explicit: the connection pool would otherwise keep the event loop alive.
try {
  Base.connection.disconnect();
} catch {
  /* already closed */
}
process.exit(process.exitCode ?? 0);
```

`process.exit()` discards whatever is still buffered in stdout. Node's stdout
is synchronous to a file or TTY and ASYNCHRONOUS to a pipe, which is why the
bug is invisible in a terminal and fatal in a script.

The `disconnect()` above it looks like a no-op that hides the real exit path:
`Base.connection.disconnect` is not a function in the vendored pin — the
`disconnect(): void` is on the connection POOL
(`@blazetrails/activerecord/dist/connection-pool.d.ts:39`), and the package
also exports `disconnectAllBang()` (`dist/index.d.ts:80`). So the `catch`
swallows a `TypeError`, nothing is disconnected, and `process.exit()` is doing
all the work.

## Shape expected

In the tasks repo: disconnect through the API that exists (`disconnectAllBang()`
or the pool's `disconnect()`), then let the process end on its own, so stdout
drains. Keep `process.exitCode`; drop the `process.exit()`. If a handle still
holds the loop open after a real disconnect, flush first instead — await
`new Promise(r => process.stdout.write("", r))` — and say in the comment which
handle made it necessary.

Then a test that pipes a large `--json` output through a reader and parses it,
since the terminal will never show this.

## Boundary

If a correct disconnect still leaves the event loop alive, the finding moves:
that is then a framework gap — a trails CLI cannot shut down cleanly — and
belongs against trails rather than here. Verify before fixing.
