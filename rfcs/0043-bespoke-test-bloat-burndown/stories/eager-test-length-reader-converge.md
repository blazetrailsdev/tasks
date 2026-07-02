---
title: "eager.test.ts: use proxy.length() reader instead of internal target.length"
status: claimed
updated: 2026-07-02
rfc: "0043-bespoke-test-bloat-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: "2026-07-02T04:23:22Z"
assignee: "eager-test-length-reader-converge"
blocked-by: null
---

## Context

PR #4274 fixed `CollectionProxy#length()` to read the loaded `_target`
without a query (mirroring Rails `length` → `records` → `load_target`).
The `join-model.test.ts` eager-load tests were converted to the natural
`proxy.length()` reader inside `assertNoQueries`. However `eager.test.ts`
still asserts on the internal `(record.association("x").target as Base[]).length`
in many places (e.g. `eager.test.ts:1706, 2052, 2143, 2162, 2279, 2280,
2353, 2371, 2376, 2411`). Rails' canonical eager tests call `.length` on
the association proxy directly. Now that `proxy.length()` no-requeries
when loaded, these can converge to the public reader for fidelity.

## Acceptance criteria

- [ ] Replace internal `.association(name).target.length` reads in
      `eager.test.ts` with `await proxy.length()` where the Rails source
      uses `.length` on the association.
- [ ] Where the assertion is inside (or should be inside) a no-query
      guard, wrap with `assertNoQueries` matching Rails' `assert_no_queries`.
- [ ] No test-name changes; keep Rails verbatim names.
