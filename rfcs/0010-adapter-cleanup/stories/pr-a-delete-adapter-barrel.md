---
title: "PR A — delete adapter.ts barrel + DatabaseAdapter interface"
status: blocked
updated: 2026-05-30
rfc: "0010-adapter-cleanup"
cluster: adapter-cleanup
deps: []
deps-rfc: []
est-loc: 150
priority: 14
pr: null
claim: null
assignee: null
blocked-by: "Phase G fixture adoption must rewrite the ~134 import sites still re-exporting through adapter.ts (trails fixtures-adoption-plan)"
---

## Context

Delete `packages/activerecord/src/adapter.ts` and the `DatabaseAdapter` interface
(`AbstractAdapter` is the superset per #2402). Blocked until Phase G fixture
adoption rewrites the ~134 import sites still re-exporting through `adapter.ts`
(Phase G replaces inline `Model.create()` with `useFixtures()` and rewrites
`.adapter` → `.connection` in the same pass).

See RFC 0010 §Remaining work (PR A).

## Acceptance criteria

- [ ] `packages/activerecord/src/adapter.ts` deleted
- [ ] `DatabaseAdapter` interface deleted entirely
- [ ] `index.ts` re-exports updated
- [ ] `grep -rn "from .*['\"]\./adapter['\"]" packages/activerecord/src/` returns
      zero non-test hits

## Notes

Blocked on Phase G (tracked in the trails fixtures-adoption-plan, not an RFC).
