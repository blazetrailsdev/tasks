---
title: "Cache Store#exist? ports as isExist, not exist"
status: done
updated: 2026-11-20
rfc: "0101-activesupport-out-of-closure-surface"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: trails#10431
claim: "2026-11-20T17:30:40Z"
assignee: "active-support-namespace-seats-test-case"
blocked-by: null
closed-reason: null
---

## Context

Rails `Store#exist?(name, options = nil)`
(`vendor/rails/v8.0.2/activesupport/lib/active_support/cache.rb`, `def exist?`) is a
predicate. trails spells it `exist`
(`packages/activesupport/lib/cache/store.ts:381`), not `isExist` (CLAUDE.md
"Predicates"; `parity:api:predicates`, RFC 0156).

## Acceptance criteria

- [ ] `Store#exist` is renamed `isExist` in the store and every subclass override
      (memory, file, null, redis, mem-cache), along with all callers.
- [ ] `pnpm parity:api:predicates` and `parity:api` show no regression.
