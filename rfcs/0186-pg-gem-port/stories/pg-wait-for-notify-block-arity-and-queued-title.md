---
title: "pg: wait_for_notify dispatches on block arity; queued-notify spec title matches"
status: ready
updated: 2026-11-25
rfc: "0186-pg-gem-port"
cluster: connection
packages: ["pg"]
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:test --package pg --missing` (origin/main 20bec076f5) reports 5 missing `connection_spec.rb` examples, all on `wait_for_notify`:

- `vendor/pg/v1.6.2/spec/pg/connection_spec.rb:1213` "returns notifications which are already in the queue before wait_for_notify is called without waiting for the socket to become readable". `packages/pg/test/connection.test.ts:133` ports the body, but its title stops at the first half of Ruby's `"..." + "..."` concatenation (it ends with a trailing space), so it does not match.
- `:1889`, `:1945`, `:1966`, `:1985` "calls the block supplied to wait_for_notify with the notify payload if it accepts any number of / two / three arguments / doesn't accept arguments". These are not ported. `waitForNotify` (`packages/pg/lib/connection.ts`) calls `block?.(channel, pid, payload)` and ignores arity. `pgconn_wait_for_notify` (`ext/pg_connection.c`) dispatches on `rb_obj_method_arity` / proc arity: it yields relname for arity 1, then relname and pid for 2, then all three for 3 or -1.

## Acceptance criteria

- The `:1213` test title is the full concatenated Ruby title.
- The four block-arity examples are ported from the spec. `waitForNotify` dispatches on the block's arity the way the C does, using `block.length` with rest-param detection for -1. Cite the C lines.
- After this story, `parity:test --package pg` shows `connection_spec.rb` missing only the encoding example (see `pg-result-strings-keep-encoding-after-client-encoding-change`).
