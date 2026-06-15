---
title: "buildCountSubquery in calculations.ts is exported but has no callers — remove or wire it"
status: ready
updated: 2026-06-15
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 15
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`buildCountSubquery` (`packages/activerecord/src/relation/calculations.ts:1184`)
is `export`ed but has **no callers** anywhere in the tree:

```
$ grep -rn buildCountSubquery packages/activerecord/src
packages/activerecord/src/relation/calculations.ts:1184:export function buildCountSubquery(
```

The only hit is the definition itself — no call site, no re-export through
`index.ts`, no test. Rails' `Calculations#build_count_subquery`
(`vendor/rails/activerecord/lib/active_record/relation/calculations.rb`) is a
**private** helper on the limit/offset DISTINCT-count path
(`SELECT COUNT(*) FROM (SELECT … subquery)`). In trails that path is handled
elsewhere, so the ported function is dead weight — exported, untested, and
drifting from the Rails private it mirrors.

This is a pure dead-code removal (companion to
`remove-dead-initialize-generated-modules-noop`). If a future limit/offset
DISTINCT-count convergence needs it, it should be re-introduced wired and
tested then, not left as an orphan export.

## Acceptance criteria

- [ ] Delete the `buildCountSubquery` export at `calculations.ts:1184` (and any
      imports it alone pulled in).
- [ ] Confirm nothing references it: `grep -rn buildCountSubquery
    packages/activerecord/src` returns no hits after removal; it is not
      re-exported from `index.ts`.
- [ ] `pnpm vitest run packages/activerecord/src/calculations.test.ts` stays
      green; api:compare / test:compare delta non-negative.
- [ ] If on inspection the DISTINCT limit/offset count path is actually missing
      (not just routed elsewhere), register a separate story to wire it
      faithfully rather than keeping the orphan export.
