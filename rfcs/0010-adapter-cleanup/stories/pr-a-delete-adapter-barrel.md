---
title: "PR A — delete adapter.ts barrel + DatabaseAdapter interface"
status: claimed
updated: 2026-06-24
rfc: "0010-adapter-cleanup"
cluster: adapter-cleanup
deps: []
deps-rfc: []
est-loc: 150
priority: 14
pr: null
claim: "2026-06-24T16:12:31Z"
assignee: "pr-a-delete-adapter-barrel"
blocked-by: null
---

## Context

Delete `packages/activerecord/src/adapter.ts` and the `DatabaseAdapter` interface
(`AbstractAdapter` is the superset per #2402).

**Unblocked (verified 2026-06-24):** the original blocker — ~134 import sites
re-exporting through `adapter.ts` (Phase G fixture adoption replacing inline
`Model.create()` with `useFixtures()` and rewriting `.adapter` → `.connection`)
— is cleared. The barrel now has **zero runtime re-export consumers**: the only
`export` lines in `adapter.ts` forward `adapterNameFromConfig` /
`inspectExplainOption` from their real homes, and no other module imports a
runtime value from `./adapter.js`. What remains is **45 type-only sites** doing
`import type { DatabaseAdapter | AdapterName | ExplainOption } from
".../adapter.js"` — those are the in-scope deletion work, not a blocker.

See RFC 0010 §Remaining work (PR A).

## Acceptance criteria

- [ ] The ~45 `import type { DatabaseAdapter }` sites repointed to
      `AbstractAdapter` from `connection-adapters/abstract-adapter.js` (the
      superset); `AdapterName` / `ExplainOption` imports repointed to their real
      sources (`connection-adapters/abstract-adapter.js`,
      `connection-adapters/abstract/database-statements.js`).
- [ ] `packages/activerecord/src/adapter.ts` deleted
- [ ] `DatabaseAdapter` interface deleted entirely
- [ ] `index.ts` re-exports updated to forward from the real sources
- [ ] `grep -rnE "from ['\"].*\./adapter(\.js)?['\"]" packages/activerecord/src/`
      returns zero non-test hits (note: the original one-line grep missed `.js`
      and `../` paths — use this corrected pattern).
- [ ] If the import-rewrite + deletion exceeds one ≤500 LOC PR, split the
      mechanical repoint from the deletion and register the remainder as a
      follow-up story.

## Notes

Originally blocked on Phase G (trails fixtures-adoption-plan, not an RFC);
blocker confirmed resolved 2026-06-24 (0 runtime re-export consumers remain).
