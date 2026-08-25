---
title: "Move JoinDependency#aliasedRow off the production class (test-support surface with no Rails counterpart)"
status: done
updated: 2026-08-05
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: 6135
claim: "2026-08-05T16:33:09Z"
assignee: "check-current-protected-environment-pool-migration-context-blocked-on-adapter-proxy"
blocked-by: null
closed-reason: null
---

## Context

`JoinDependency#aliasedRow`
(`packages/activerecord/src/associations/join-dependency.ts`) is public
test-support code living on a production class. Rails has no counterpart;
`pnpm parity:api:extra` counts it among the six novel names in that file
(`aliasedRow`, `columnsForNode`, `instantiateFromRows`, `nodes`, `selectArel`,
`validateEagerLoadSpec`).

It exists so hydration tests can build a `{path: {column: value}}` row and have
each column mapped to its live `t{n}_r{n}` alias via the `Aliases` map, rather
than hardcoding a column offset that silently misaligns when the canonical
`schema.rb` column order changes. That motivation is sound — the fix is not to
delete the capability but to stop shipping it as production API.

Callers are the join-dependency hydration tests
(`join-dependency-nested-hydration.test.ts`,
`join-dependency-extra-columns.test.ts`,
`join-dependency-duplicate-objects.test.ts` and neighbours). The method reads
only public-ish state (`aliases()`, `_findNodeByPath`), so it can move without
loosening anything that is currently private.

Note `nodes`, `selectArel` and `columnsForNode` are also novel but are load
bearing for production paths; this story is scoped to `aliasedRow` only.

## Acceptance criteria

- `aliasedRow` no longer appears in `JoinDependency`'s public surface. Either
  move it to a test helper that takes the JoinDependency as an argument, or —
  if it must stay on the class for access to private state — tag it
  `@noRailsEquivalent` with the reason, so the extra-surface score reflects a
  deliberate decision rather than unreviewed drift.
- If it moves, place it somewhere both compare populations already exclude;
  check `scripts/api-compare/conventions.ts` and the
  `src/support/**` precedent before choosing the location.
- `pnpm parity:api:extra` reports one fewer novel name in
  `associations/join-dependency.ts` (or the name is accounted for by a tag).
- The hydration tests keep asserting against live aliases — no test regresses
  to hardcoded `t{n}_r{n}` strings or column offsets.
