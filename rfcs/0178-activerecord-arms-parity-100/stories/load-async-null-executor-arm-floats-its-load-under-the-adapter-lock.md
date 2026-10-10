---
title: "load-async-null-executor-arm-floats-its-load-under-the-adapter-lock"
status: draft
updated: 2026-10-10
rfc: "0178-activerecord-arms-parity-100"
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

## Acceptance criteria

- [ ] Either the null-executor arm reaches Rails' `return load` shape with no `synchronize` call
      and "load async from transaction" (`load_async_test.rb:65-79`, `:324-336`) still passes on
      SQLite, PostgreSQL and MariaDB without the caller awaiting the relation,
- [ ] or the repo owner ratifies the lock-held floating load in `packages/activerecord/CLAUDE.md`,
      the receipt becomes `PERMANENT`, and this story closes with a `PERMANENT:` reason.
