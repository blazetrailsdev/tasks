---
title: "Record the native-promise decision for ActiveRecord::Promise and retire the rows and story that still ask for the port"
status: draft
updated: 2026-10-01
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

On trails#8342 (2026-10-01) the maintainer decided that `ActiveRecord::Promise`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/promise.rb`) is not ported: the `async_*`
readers return native JS promises. A complete port had been written and was reverted from that PR.
`promise.rb` is on the unported-files list (`scripts/parity/unported-files/unscoped.ts`).

The ledger still says the opposite in three places, so the next agent to read it will build the
port again:

- `port-promise-complete-for-async-loaded-arms` (RFC 0174) asks for `Promise::Complete` in `ids`'
  `loaded?` arm (`relation/calculations.rb:374-383`). It is blocked with the decision as its
  reason, not closed, because closing it would stale the citations below.
- `scripts/api-compare/call-mismatches-exclude/activerecord/statement-cache.json`: the `execute` /
  `async_find_by_sql` and `execute` / `wrap` rows (`statement_cache.rb:149,154`) say the gap is
  "tracked by story `port-promise-complete-for-async-loaded-arms`".
- `scripts/api-compare/call-mismatches-exclude/activerecord/relation/calculations.json`: the
  `ids` / `new` and `calculate` / `new` rows are the `Promise::Complete.new` calls
  (`calculations.rb:224,227,382`), still carrying the seeded placeholder reason.

Two facts from the reverted port, for whoever writes the decision down: `FutureResult#then`
(`packages/activerecord/src/future-result.ts`) is a native thenable, so a JS promise resolving to
a `FutureResult` unwraps it; and an `async function` unwraps any thenable it returns, so `pluck`,
`pick` and `calculate` cannot hand back a promise object of their own.

## Acceptance criteria

- [ ] The decision is recorded where CLAUDE.md records its other language-forced shapes, citing
      `promise.rb` and naming the native promise as the port of `ActiveRecord::Promise`.
- [ ] The `Promise.new` / `Promise::Complete.new` / `Promise.wrap` / `async_find_by_sql` omissions
      carry that section's receipt (`@missingRailsCall ... — PERMANENT` at the call site, or a
      reviewed row reason citing the section) instead of a story id or the seeded placeholder.
- [ ] No file cites `port-promise-complete-for-async-loaded-arms`, and that story is closed.
