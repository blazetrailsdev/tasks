---
title: "Reach Relation#execQueries from ExplainProxy#inspect without a cast"
status: done
updated: 2026-10-20
rfc: "0198-activerecord-mixin-host-typing"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: trails#9142
claim: "2026-10-20T16:39:48Z"
assignee: "ar-type-test-helper-models-named-scope-receivers"
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/src/relation.ts` `ExplainProxy#inspect` still reaches `Relation#execQueries` through `(this._relation as unknown as { execQueries(): Promise<T[]> }).execQueries()`, because `execQueries` is TS-`private`/`protected` on `Relation` and `ExplainProxy` is a sibling class. Rails: `ExplainProxy#inspect` calls `@relation.exec_explain { @relation.send(:exec_queries) }` (`vendor/rails/v8.0.2/activerecord/lib/active_record/relation.rb`, `ExplainProxy`), and `exec_queries` is private in Rails. Left out of trails#9124 because removing it needs a visibility decision.

## Acceptance criteria

- [ ] The cast is gone: `execQueries` is reached through a typed path (e.g. `@internal` public with the `rails-private-jsdoc` tag the manifest requires, or `rbFSend`, matching Rails' `send`).
- [ ] `pnpm parity:api:extra:gate` and `pnpm typecheck` green; no runtime change.
