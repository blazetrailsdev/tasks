---
title: "load-async-null-executor-arm-floats-its-load-under-the-adapter-lock"
status: blocked
updated: 2026-10-10
rfc: "0123-blocked-convergence-holding"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-10-10T17:09:39Z"
assignee: "load-async-null-executor-arm-floats-its-load-under-the-adapter-lock"
blocked-by: "owner ruling on the lock-held floating load: loadAsync is synchronous and cannot await load, so the null-executor arm cannot be Rails' return load (relation.rb:1139); ratify c.lock.synchronize as PERMANENT in packages/activerecord/CLAUDE.md or name another shape"
closed-reason: null
---

## Context

Rails' `Relation#load_async` opens with `return load if !c.async_enabled?`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/relation.rb:1138-1140`): `load` runs in line and
the rows are read before `load_async` returns.

trails' `loadAsync` (`packages/activerecord/src/relation.ts`, the `!c.asyncEnabled()` arm) is
synchronous and cannot await `load`. Since trails#8743 it starts the load inside
`c.lock.synchronize(() => this.load())`, sets `_loaded = true` and returns. The monitor queues the
entry synchronously, so the query is ordered ahead of the enclosing transaction's ROLLBACK / COMMIT.
`synchronize` is a call Rails' body does not make, and the floating load with its `catch` that
resets `_loaded` has no Rails counterpart either. The arm carries
`@inventedArm synchronize — CONVERGEABLE` against this story.

JS has no synchronous await, so the arm cannot be `return load`. Whether that makes the
`synchronize` call permanent is the repo owner's ruling to make.

Since trails#8820 the arm writes `_loaded = true` inside the locked block, after `load()` has
started, and the block returns early when a reader's own load is already in flight. A relation
scheduled while the adapter lock is held therefore reads `isLoaded === false` until its entry runs,
where Rails' in-line `load` (`relation.rb:1139`) leaves `loaded?` true as `load_async` returns
(`vendor/rails/v8.0.2/activerecord/test/cases/relation/load_async_test.rb:23`). Whatever shape replaces the arm has to
close that window as well; the guard and the deferred write go with it.

## Acceptance criteria

- [ ] Either the null-executor arm reaches Rails' `return load` shape with no `synchronize` call
      and "load async from transaction" (`load_async_test.rb:65-79`, `:324-336`) still passes on
      SQLite, PostgreSQL and MariaDB without the caller awaiting the relation,
- [ ] or the repo owner ratifies the lock-held floating load in `packages/activerecord/CLAUDE.md`,
      the receipt becomes `PERMANENT`, and this story closes with a `PERMANENT:` reason.
