---
title: "Thread async through execMainQuery as Rails' argument instead of holding it in _asyncLoad"
status: done
updated: 2026-08-19
rfc: "0107-relation-ts-decomposition"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 180
priority: null
pr: 6744
claim: "2026-08-19T16:59:58Z"
assignee: "thread-async-through-exec-main-query-argument"
blocked-by: null
closed-reason: null
---

# Thread `async` through `execMainQuery` as Rails' argument instead of holding it in `_asyncLoad`

## Context

Surfaced by the private-member audit of `relation.ts` in PR #6735 (RFC 0107),
which documented `_asyncLoad` as a **non-permanent** deviation naming this as
the convergence target. This story is that target.

Rails threads the flag as a METHOD ARGUMENT. `load_async`
(`vendor/rails/activerecord/lib/active_record/relation.rb:1138-1154`) calls

```ruby
result = exec_main_query(async: !c.current_transaction.joinable?)
```

directly, while `exec_queries` (`relation.rb:1416-1421`) calls
`exec_main_query` with the default (`async: false`, `:1423`).

trails stores it as a field instead (`packages/activerecord/src/relation.ts`,
`private _asyncLoad = false`), because `loadAsync()` reaches `execMainQuery`
indirectly — through `toArray()` and `execQueries()`, neither of which takes
such a parameter — and `reset()` has to clear it. The field is read at
`relation.ts` in `execMainQuery`'s `const async = this._asyncLoad && ...` line
and written in three places, which is three chances for it to leak across a
load it was not meant to cover.

## Converged shape

Either thread `async` down `toArray` → `execQueries` → `execMainQuery` as a
parameter, or have `loadAsync()` drive `execMainQuery` itself the way
`relation.rb:1142` does. Then delete the `_asyncLoad` field and its three
writes, and drop the non-permanent deviation note on its declaration.

Prefer whichever keeps `exec_queries`' own signature closest to Rails'.

## Acceptance criteria

- [ ] `_asyncLoad` is gone from `relation.ts`; `async` reaches `execMainQuery`
      as an argument.
- [ ] `reset()` no longer clears an async flag (Rails' reset drops
      `@future_result`, not a flag — `relation.rb:1195-1196`).
- [ ] The prose deviation note on the declaration is removed with the field.
- [ ] `relation-load-async.trails.test.ts` and
      `asynchronous-queries.test.ts` green on all three lanes.
- [ ] `parity:api:calls` / `:args` green; `parity:api:extra` unchanged.
