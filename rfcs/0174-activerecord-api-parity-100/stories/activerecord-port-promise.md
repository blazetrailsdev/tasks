---
title: "activerecord: port ActiveRecord::Promise (un-exclude promise.rb)"
status: ready
updated: 2026-09-30
rfc: "0174-activerecord-api-parity-100"
cluster: excluded-files
packages: ["activerecord"]
deps: ["port-promise-complete-for-async-loaded-arms"]
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`promise.rb` is excluded: "Rails Promise wraps a thread-backed FutureResult with a blocking #value. JS is
single-threaded; native Promise covers #then." `vendor/rails/v8.0.2/activerecord/lib/active_record/promise.rb` is the public return value of every
`async_*` query method (`async_count`, `async_pluck`, …): `pending?`, `value`, `then`, `inspect`,
`pretty_print`, and `Promise::Complete`. trails' async methods return a native `Promise`, so
`Promise#pending?`, `#then` with Rails' block semantics, and `Complete` are missing API.
`port-promise-complete-for-async-loaded-arms` (RFC 0023) ports `Complete` for the loaded arms.

A blocking `value` is the one piece JS cannot express; it maps onto the ratified shape of CLAUDE.md
§ "`Relation` is evaluated by an async query" (a thenable), not onto deleting the class.

## Acceptance criteria

- [ ] `ActiveRecord::Promise` and `Promise::Complete` are ported in `packages/activerecord/src/promise.ts`; `async_*` methods return it; `value` is async and `then` follows the thenable shape CLAUDE.md ratifies.
- [ ] The unported entry is deleted; `promise.rb` scores 100%.
- [ ] `SKIP_GROUPS[0]`'s `promise.rb#then` / `#class` hits resolve with it (see `activerecord-score-core-object-protocol-names`).

## Verification

```bash
pnpm build && pnpm parity:api && pnpm parity:skips:stories && pnpm parity:api:calls
```
